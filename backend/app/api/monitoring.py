from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.monitoring_service import MonitoringService
from app.models.schemas import ServerStatusResponse, MonitoringHistoryResponse
from app.repositories.history_repository import HistoryRepository

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/status", response_model=List[ServerStatusResponse])
def get_status(db: Session = Depends(get_db)):
    """Get current status of all monitored servers"""
    service = MonitoringService(db)
    return service.get_current_status()


@router.get("/history/{server_id}", response_model=List[MonitoringHistoryResponse])
def get_history(
    server_id: int,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get monitoring history for a specific server"""
    repo = HistoryRepository(db)
    return repo.get_by_server(server_id, limit=limit, offset=offset)


@router.get("/chart/{server_id}")
def get_chart_data(server_id: int, hours: int = Query(24, ge=1, le=168), db: Session = Depends(get_db)):
    """Get data for charting response times"""
    repo = HistoryRepository(db)
    history = repo.get_history_for_chart(server_id, hours=hours)

    return {
        'server_id': server_id,
        'hours': hours,
        'data': [
            {
                'time': h.check_time.isoformat(),
                'response_time_ms': h.response_time_ms,
                'status': h.status
            }
            for h in history
        ]
    }


@router.post("/check-now")
def trigger_check(db: Session = Depends(get_db)):
    """Manually trigger a monitoring check for all servers"""
    service = MonitoringService(db)
    service.check_all_servers()
    return {"message": "Check triggered"}
