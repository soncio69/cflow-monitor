from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


# Server Schemas
class ServerBase(BaseModel):
    name: str
    url: str
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: bool = True
    warning_threshold: int = 1000
    critical_threshold: int = 3000


class ServerCreate(ServerBase):
    pass


class ServerUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: Optional[bool] = None
    warning_threshold: Optional[int] = None
    critical_threshold: Optional[int] = None


class ServerResponse(ServerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Monitoring History Schemas
class MonitoringHistoryBase(BaseModel):
    server_id: int
    http_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    status: str
    error_message: Optional[str] = None


class MonitoringHistoryResponse(MonitoringHistoryBase):
    id: int
    check_time: datetime

    model_config = ConfigDict(from_attributes=True)


# Monitoring Status Schemas
class ServerStatusResponse(BaseModel):
    id: int
    name: str
    status: str
    http_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    last_check: Optional[datetime] = None
    url: str


# Settings Schemas
class SettingsResponse(BaseModel):
    key: str
    value: str


class SettingsUpdate(BaseModel):
    key: str
    value: str


# Login Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
