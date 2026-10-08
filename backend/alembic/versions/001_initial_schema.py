"""Initial schema migration for CRIMEMAP

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-08 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Enable PostGIS extension if PostgreSQL
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Police Stations
    op.create_table(
        'police_stations',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('station_code', sa.String(length=20), nullable=False, unique=True),
        sa.Column('jurisdiction_area', sa.String(length=150), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('contact_number', sa.String(length=30), nullable=True),
        sa.Column('officer_in_charge', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 3. Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('username', sa.String(length=50), nullable=False, unique=True),
        sa.Column('email', sa.String(length=100), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('badge_number', sa.String(length=50), nullable=True),
        sa.Column('police_station_id', sa.Integer(), sa.ForeignKey('police_stations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 4. Crime Types
    op.create_table(
        'crime_types',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('code', sa.String(length=20), nullable=False, unique=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('base_severity', sa.String(length=20), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 5. Crime Incidents
    op.create_table(
        'crime_incidents',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('case_number', sa.String(length=50), nullable=False, unique=True),
        sa.Column('crime_type_id', sa.Integer(), sa.ForeignKey('crime_types.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('incident_date', sa.Date(), nullable=False),
        sa.Column('incident_time', sa.Time(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('police_station_id', sa.Integer(), sa.ForeignKey('police_stations.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('weapon_used', sa.String(length=100), nullable=True),
        sa.Column('victim_count', sa.Integer(), nullable=False, default=1),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Add PostGIS spatial columns & GiST index if PostgreSQL
    if conn.dialect.name == "postgresql":
        op.execute("ALTER TABLE crime_incidents ADD COLUMN location GEOGRAPHY(POINT, 4326);")
        op.execute("ALTER TABLE police_stations ADD COLUMN location GEOGRAPHY(POINT, 4326);")
        op.execute("CREATE INDEX idx_incidents_location_gist ON crime_incidents USING GIST(location);")
        op.execute("CREATE INDEX idx_stations_location_gist ON police_stations USING GIST(location);")

    # 6. Hotspots
    op.create_table(
        'hotspots',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('cluster_label', sa.String(length=50), nullable=False),
        sa.Column('center_lat', sa.Float(), nullable=False),
        sa.Column('center_lon', sa.Float(), nullable=False),
        sa.Column('radius_meters', sa.Float(), nullable=False),
        sa.Column('incident_count', sa.Integer(), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_category', sa.String(length=20), nullable=False),
        sa.Column('primary_crime_type', sa.String(length=100), nullable=True),
        sa.Column('severity_breakdown', sa.JSON(), nullable=True),
        sa.Column('temporal_concentration', sa.JSON(), nullable=True),
        sa.Column('detection_method', sa.String(length=50), nullable=False),
        sa.Column('geometry_geojson', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 7. Predictions
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('zone_id', sa.String(length=50), nullable=False),
        sa.Column('zone_name', sa.String(length=100), nullable=False),
        sa.Column('geometry_geojson', sa.JSON(), nullable=True),
        sa.Column('center_lat', sa.Float(), nullable=False),
        sa.Column('center_lon', sa.Float(), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_category', sa.String(length=20), nullable=False),
        sa.Column('incident_count_historical', sa.Integer(), nullable=True),
        sa.Column('recent_trend_ratio', sa.Float(), nullable=True),
        sa.Column('severity_weighted_index', sa.Float(), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('important_factors', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 8. Alerts
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('location_name', sa.String(length=150), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('acknowledged_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 9. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=50), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('alerts')
    op.drop_table('predictions')
    op.drop_table('hotspots')
    op.drop_table('crime_incidents')
    op.drop_table('crime_types')
    op.drop_table('users')
    op.drop_table('police_stations')
