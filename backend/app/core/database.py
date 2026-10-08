import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Choose database URL
database_url = settings.DATABASE_URL

def create_db_engine():
    """
    Creates database engine. Tests PostgreSQL connection with a short timeout;
    falls back cleanly to SQLite for offline/standalone execution.
    """
    target_url = settings.DATABASE_URL
    if settings.USE_SQLITE_FALLBACK or target_url.startswith("sqlite"):
        logger.info("Using SQLite database engine.")
        return create_engine(settings.SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})

    try:
        eng = create_engine(
            target_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 2}
        )
        with eng.connect() as conn:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
                logger.info("PostGIS extension active.")
            except Exception as ext_err:
                logger.info(f"PostGIS check: {ext_err}")
        return eng
    except Exception as e:
        logger.warning(f"PostgreSQL not reachable ({e}). Falling back to SQLite.")
        return create_engine(settings.SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    global SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
