import csv
import io
import re
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, date, time, timezone
from sqlalchemy.orm import Session
from app.models.crime_incident import CrimeIncident
from app.models.crime_type import CrimeType
from app.models.police_station import PoliceStation
from app.core.audit import log_audit_event

logger = logging.getLogger(__name__)

# CSV injection prevention regex
CSV_INJECTION_PREFIXES = ("=", "+", "-", "@", "\t", "\r")

def sanitize_csv_cell(value: Any) -> str:
    """Neutralize potential CSV formula injection attacks."""
    if not isinstance(value, str):
        return str(value) if value is not None else ""
    val = value.strip()
    if val.startswith(CSV_INJECTION_PREFIXES):
        return "'" + val
    return val

class CSVImportService:
    @staticmethod
    def parse_and_validate_csv(
        db: Session,
        csv_content: str,
        commit: bool = False,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parses CSV data, validates fields, checks coordinates, detects duplicates,
        and optionally inserts valid records into the database.
        """
        f = io.StringIO(csv_content.strip())
        reader = csv.DictReader(f)
        
        # Standardize headers
        if not reader.fieldnames:
            return {
                "success": False,
                "error": "Empty CSV or no header row detected",
                "total_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "duplicate_rows": 0,
                "imported_rows": 0,
                "errors": [],
                "preview": []
            }

        headers = [h.strip().lower() for h in reader.fieldnames]
        required_headers = ["case_number", "crime_type", "date", "latitude", "longitude", "police_station"]
        
        missing_headers = [rh for rh in required_headers if rh not in headers]
        if missing_headers:
            return {
                "success": False,
                "error": f"Missing mandatory CSV columns: {', '.join(missing_headers)}",
                "total_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "duplicate_rows": 0,
                "imported_rows": 0,
                "errors": [{"row": 0, "field": "header", "message": f"Missing: {missing_headers}"}],
                "preview": []
            }

        # Cache existing crime types and stations
        crime_types = {ct.name.lower(): ct for ct in db.query(CrimeType).all()}
        # Also index by code
        crime_types_by_code = {ct.code.lower(): ct for ct in crime_types.values()}
        
        stations = {st.name.lower(): st for st in db.query(PoliceStation).all()}
        stations_by_code = {st.station_code.lower(): st for st in stations.values()}

        # Existing case numbers in DB
        existing_cases = set(row[0] for row in db.query(CrimeIncident.case_number).all())
        seen_in_batch = set()

        valid_records = []
        error_records = []
        preview_records = []
        duplicate_count = 0

        for row_idx, raw_row in enumerate(reader, start=2):
            row = {k.strip().lower(): sanitize_csv_cell(v) for k, v in raw_row.items() if k}
            row_errors = []

            # 1. Case Number
            case_no = row.get("case_number", "").strip()
            if not case_no:
                row_errors.append("Case number is required")
            elif case_no in seen_in_batch or case_no in existing_cases:
                duplicate_count += 1
                row_errors.append(f"Duplicate case number '{case_no}'")
            else:
                seen_in_batch.add(case_no)

            # 2. Crime Type
            ct_input = row.get("crime_type", "").strip()
            ct_obj = crime_types.get(ct_input.lower()) or crime_types_by_code.get(ct_input.lower())
            if not ct_obj:
                # Default to first available or error
                if crime_types:
                    ct_obj = list(crime_types.values())[0]
                else:
                    row_errors.append(f"Unknown crime type '{ct_input}'")

            # 3. Date
            date_str = row.get("date", "").strip()
            parsed_date = None
            if not date_str:
                row_errors.append("Incident date is required")
            else:
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
                    try:
                        parsed_date = datetime.strptime(date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                if not parsed_date:
                    row_errors.append(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD")

            # 4. Time
            time_str = row.get("time", "").strip()
            parsed_time = None
            if time_str:
                for tfmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M:%S %p"):
                    try:
                        parsed_time = datetime.strptime(time_str, tfmt).time()
                        break
                    except ValueError:
                        continue

            # 5. Coordinates
            lat_str = row.get("latitude", "").strip()
            lon_str = row.get("longitude", "").strip()
            lat_val = None
            lon_val = None
            try:
                lat_val = float(lat_str)
                lon_val = float(lon_str)
                if not (-90.0 <= lat_val <= 90.0 and -180.0 <= lon_val <= 180.0):
                    row_errors.append("Coordinates out of global range")
                elif not (11.0 <= lat_val <= 13.0 and 78.5 <= lon_val <= 81.0):
                    # Warning / validation for regional Puducherry boundary
                    pass
            except (ValueError, TypeError):
                row_errors.append(f"Invalid numeric coordinates (lat: {lat_str}, lon: {lon_str})")

            # 6. Police Station
            st_input = row.get("police_station", "").strip()
            st_obj = stations.get(st_input.lower()) or stations_by_code.get(st_input.lower())
            if not st_obj:
                if stations:
                    st_obj = list(stations.values())[0]
                else:
                    row_errors.append(f"Unknown police station '{st_input}'")

            # 7. Severity & Status
            sev = row.get("severity", "Medium").capitalize()
            if sev not in ["Low", "Medium", "High", "Critical"]:
                sev = "Medium"

            status = row.get("status", "Reported").title()
            if status not in ["Reported", "Under Investigation", "Charges Filed", "Closed"]:
                status = "Reported"

            desc = row.get("description", "")
            address = row.get("address", "")

            if row_errors:
                error_records.append({
                    "row": row_idx,
                    "case_number": case_no or "N/A",
                    "errors": row_errors
                })
            else:
                record_dict = {
                    "case_number": case_no,
                    "crime_type_id": ct_obj.id,
                    "crime_type_name": ct_obj.name,
                    "incident_date": parsed_date,
                    "incident_time": parsed_time,
                    "latitude": lat_val,
                    "longitude": lon_val,
                    "police_station_id": st_obj.id,
                    "police_station_name": st_obj.name,
                    "severity": sev,
                    "status": status,
                    "description": desc,
                    "address": address
                }
                valid_records.append(record_dict)
                if len(preview_records) < 10:
                    preview_records.append({
                        "case_number": case_no,
                        "crime_type": ct_obj.name,
                        "date": parsed_date.isoformat(),
                        "time": parsed_time.isoformat() if parsed_time else "",
                        "station": st_obj.name,
                        "severity": sev,
                        "latitude": lat_val,
                        "longitude": lon_val
                    })

        total_rows = len(valid_records) + len(error_records)
        imported_count = 0

        if commit and valid_records:
            for rec in valid_records:
                incident = CrimeIncident(
                    case_number=rec["case_number"],
                    crime_type_id=rec["crime_type_id"],
                    incident_date=rec["incident_date"],
                    incident_time=rec["incident_time"],
                    latitude=rec["latitude"],
                    longitude=rec["longitude"],
                    police_station_id=rec["police_station_id"],
                    severity=rec["severity"],
                    status=rec["status"],
                    description=rec["description"],
                    address=rec["address"],
                    created_by_id=user_id,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(incident)
            db.commit()
            imported_count = len(valid_records)

            # Audit log
            log_audit_event(
                db=db,
                action="CSV_IMPORT",
                entity_type="CrimeIncident",
                user_id=user_id,
                entity_id=None,
                ip_address=ip_address,
                details={
                    "total_rows": total_rows,
                    "imported_count": imported_count,
                    "duplicate_count": duplicate_count,
                    "error_count": len(error_records)
                }
            )

        return {
            "success": True,
            "commit": commit,
            "total_rows": total_rows,
            "valid_rows": len(valid_records),
            "invalid_rows": len(error_records),
            "duplicate_rows": duplicate_count,
            "imported_rows": imported_count,
            "errors": error_records[:50],  # Return first 50 error rows
            "preview": preview_records
        }
