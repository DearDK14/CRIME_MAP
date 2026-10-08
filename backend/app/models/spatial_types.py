import logging
from sqlalchemy.types import TypeDecorator, String
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from geoalchemy2 import Geography
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False

class SpatialPoint(TypeDecorator):
    """
    Polymorphic spatial point type:
    - On PostgreSQL: compiles to native PostGIS GEOGRAPHY(POINT, 4326) with GiST spatial indexing
    - On SQLite: compiles cleanly to VARCHAR(255) for lightweight standalone testing
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and HAS_GEOALCHEMY:
            return dialect.type_descriptor(Geography(geometry_type="POINT", srid=4326, spatial_index=True))
        return dialect.type_descriptor(String(255))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql" and HAS_GEOALCHEMY:
            # If coordinates tuple or dict provided
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        return value

def get_point_geography_column(srid: int = 4326):
    return SpatialPoint
