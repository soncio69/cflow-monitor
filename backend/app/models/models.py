from sqlalchemy import Column, Integer, String, Boolean, BigInteger, DateTime, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class MonitoredServer(Base):
    __tablename__ = "monitored_servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    username = Column(String(100), nullable=True)
    password = Column(String(255), nullable=True)  # Stored as plain text (internal tool)
    enabled = Column(Boolean, default=True)
    warning_threshold = Column(Integer, default=1000)
    critical_threshold = Column(Integer, default=3000)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MonitoringHistory(Base):
    __tablename__ = "monitoring_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    server_id = Column(Integer, nullable=False, index=True)
    check_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    http_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False)  # UP, WARNING, DOWN
    error_message = Column(Text, nullable=True)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(String(255), nullable=False)
