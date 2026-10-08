import io
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.crime_incident import CrimeIncident
from app.models.police_station import PoliceStation
from app.models.crime_type import CrimeType
from app.models.hotspot import Hotspot
from app.models.prediction import Prediction
from app.core.audit import log_audit_event

logger = logging.getLogger(__name__)

class ReportService:
    @staticmethod
    def compile_intelligence_summary(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        police_station_id: Optional[int] = None,
        crime_type_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Compiles comprehensive crime intelligence metrics, clearly distinguishing
        between historical statistics and ML-derived assessments.
        """
        query = db.query(CrimeIncident)
        if start_date:
            query = query.filter(CrimeIncident.incident_date >= start_date)
        if end_date:
            query = query.filter(CrimeIncident.incident_date <= end_date)
        if police_station_id:
            query = query.filter(CrimeIncident.police_station_id == police_station_id)
        if crime_type_id:
            query = query.filter(CrimeIncident.crime_type_id == crime_type_id)

        incidents = query.all()
        total_inc = len(incidents)

        # 1. Historical Crime Type Breakdown
        type_counts = {}
        for inc in incidents:
            t_name = inc.crime_type.name if inc.crime_type else "Other"
            type_counts[t_name] = type_counts.get(t_name, 0) + 1

        # 2. Historical Severity Breakdown
        sev_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        for inc in incidents:
            s = inc.severity if inc.severity in sev_counts else "Medium"
            sev_counts[s] += 1

        # 3. Police Station Distribution
        station_counts = {}
        for inc in incidents:
            st_name = inc.police_station.name if inc.police_station else "Unknown"
            station_counts[st_name] = station_counts.get(st_name, 0) + 1

        # 4. Active ML Hotspots
        hotspots = db.query(Hotspot).filter(Hotspot.is_active == True).order_by(Hotspot.risk_score.desc()).limit(5).all()
        hotspot_data = [
            {
                "label": hs.cluster_label,
                "risk_score": hs.risk_score,
                "risk_category": hs.risk_category,
                "incident_count": hs.incident_count,
                "primary_crime": hs.primary_crime_type,
                "lat": hs.center_lat,
                "lon": hs.center_lon
            }
            for hs in hotspots
        ]

        # 5. Zone Predictions
        predictions = db.query(Prediction).order_by(Prediction.risk_score.desc()).limit(5).all()
        pred_data = [
            {
                "zone_id": pr.zone_id,
                "zone_name": pr.zone_name,
                "risk_score": pr.risk_score,
                "risk_category": pr.risk_category,
                "key_driver": pr.important_factors.get("key_driver", "Historical pattern") if pr.important_factors else "Pattern"
            }
            for pr in predictions
        ]

        # Important Human Observations
        observations = [
            f"Analyzed {total_inc} incidents across the jurisdiction within the specified timeframe.",
            f"Highest recorded crime category: {max(type_counts.items(), key=lambda x: x[1])[0] if type_counts else 'None'}.",
            f"High & Critical severity events represent {round((sev_counts['High'] + sev_counts['Critical']) / max(total_inc, 1) * 100, 1)}% of recorded cases.",
            f"Station with highest workload volume: {max(station_counts.items(), key=lambda x: x[1])[0] if station_counts else 'None'}."
        ]

        return {
            "title": "CRIMEMAP Geospatial Crime Intelligence Report",
            "jurisdiction": "Puducherry Police Department",
            "start_date": start_date.isoformat() if start_date else "All Time",
            "end_date": end_date.isoformat() if end_date else "Present",
            "total_incidents": total_inc,
            "crime_types": type_counts,
            "severity_breakdown": sev_counts,
            "stations_breakdown": station_counts,
            "hotspots": hotspot_data,
            "predictions": pred_data,
            "observations": observations,
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "disclaimer": "CRITICAL NOTICE: Machine learning assessments represent probabilistic historical risk indicators for human decision-support only. They do not constitute deterministic forecasts of future events."
        }

    @staticmethod
    def generate_pdf_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        police_station_id: Optional[int] = None,
        crime_type_id: Optional[int] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None
    ) -> bytes:
        """
        Compiles the intelligence report and generates a formatted PDF document.
        """
        data = ReportService.compile_intelligence_summary(
            db, start_date, end_date, police_station_id, crime_type_id
        )

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569")
        )
        heading_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1e3a8a"),
            fontName="Helvetica-Bold"
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1e293b")
        )
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#b91c1c"),
            fontName="Helvetica-Oblique"
        )

        elements = []

        # Header Ribbon
        elements.append(Paragraph(data["title"], title_style))
        elements.append(Paragraph(f"<b>Puducherry Police Department</b> | Generated: {data['generated_at']} | Scope: {data['start_date']} to {data['end_date']}", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=12))

        # Ethical Disclaimer Box
        elements.append(Paragraph(f"<b>DECISION-SUPPORT NOTICE:</b> {data['disclaimer']}", disclaimer_style))
        elements.append(Spacer(1, 12))

        # KPI Metrics Table
        kpi_data = [
            ["Total Incidents", "Critical Severity", "High Severity", "Active Hotspots"],
            [
                str(data["total_incidents"]),
                str(data["severity_breakdown"].get("Critical", 0)),
                str(data["severity_breakdown"].get("High", 0)),
                str(len(data["hotspots"]))
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, 1), 14),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 14))

        # Section 1: Historical Crime Distribution
        elements.append(Paragraph("1. Historical Crime Category Statistics", heading_style))
        type_table_data = [["Crime Category / Type", "Incident Count", "Percentage of Total"]]
        for ctype, cnt in sorted(data["crime_types"].items(), key=lambda x: x[1], reverse=True)[:6]:
            pct = round(cnt / max(data["total_incidents"], 1) * 100, 1)
            type_table_data.append([ctype, str(cnt), f"{pct}%"])
        
        type_table = Table(type_table_data, colWidths=[240, 140, 140])
        type_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(type_table)
        elements.append(Spacer(1, 14))

        # Section 2: Machine-Learning Hotspot & Risk Assessment
        elements.append(Paragraph("2. ML-Derived Hotspot & Risk Assessment (DBSCAN)", heading_style))
        elements.append(Paragraph("<i>Note: The following clusters are algorithmically computed based on historical density, recent velocity, and severity weighting.</i>", subtitle_style))
        elements.append(Spacer(1, 4))

        hs_table_data = [["Cluster Label", "Risk Category", "Risk Score", "Incident Count", "Primary Crime Type"]]
        if data["hotspots"]:
            for hs in data["hotspots"]:
                hs_table_data.append([
                    hs["label"],
                    hs["risk_category"],
                    f"{hs['risk_score']}/100",
                    str(hs["incident_count"]),
                    hs["primary_crime"]
                ])
        else:
            hs_table_data.append(["No active hotspots detected", "N/A", "N/A", "0", "N/A"])

        hs_table = Table(hs_table_data, colWidths=[140, 90, 80, 90, 120])
        hs_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fcd34d")),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(hs_table)
        elements.append(Spacer(1, 14))

        # Section 3: Key Observations & Operational Recommendations
        elements.append(Paragraph("3. Operational Observations (Human Decision Support)", heading_style))
        for obs in data["observations"]:
            elements.append(Paragraph(f"• {obs}", body_style))
            elements.append(Spacer(1, 3))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        # Audit log entry
        log_audit_event(
            db=db,
            action="GENERATE_REPORT",
            entity_type="Report",
            user_id=user_id,
            entity_id=None,
            ip_address=ip_address,
            details={"scope": f"{data['start_date']} to {data['end_date']}", "total_incidents": data["total_incidents"]}
        )

        return pdf_bytes
