from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON


json_type = JSON().with_variant(JSONB, "postgresql")
