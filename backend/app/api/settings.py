from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.schemas import SettingsResponse, SettingsUpdate
from app.core.config import get_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=List[SettingsResponse])
def get_settings_list(db: Session = Depends(get_db)):
    """Get all settings"""
    from app.models.models import Settings

    settings_db = db.query(Settings).all()
    return settings_db


@router.put("", response_model=SettingsResponse)
def update_setting(setting: SettingsUpdate, db: Session = Depends(get_db)):
    """Update a setting"""
    from app.models.models import Settings

    existing = db.query(Settings).filter(Settings.key == setting.key).first()

    if existing:
        existing.value = setting.value
    else:
        existing = Settings(key=setting.key, value=setting.value)
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return existing


@router.get("/check-interval")
def get_check_interval():
    """Get current check interval"""
    settings = get_settings()
    return {"check_interval_seconds": settings.check_interval_seconds}
