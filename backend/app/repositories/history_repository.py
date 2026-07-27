from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import MonitoringHistory
from app.models.schemas import MonitoringHistoryBase
from typing import List, Optional
from datetime import datetime


class HistoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, history: MonitoringHistoryBase) -> MonitoringHistory:
        db_history = MonitoringHistory(**history.model_dump())
        self.db.add(db_history)
        self.db.commit()
        self.db.refresh(db_history)
        return db_history

    def get_by_server(self, server_id: int, limit: int = 100, offset: int = 0) -> List[MonitoringHistory]:
        return (
            self.db.query(MonitoringHistory)
            .filter(MonitoringHistory.server_id == server_id)
            .order_by(desc(MonitoringHistory.check_time))
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_latest_by_server(self, server_id: int) -> Optional[MonitoringHistory]:
        return (
            self.db.query(MonitoringHistory)
            .filter(MonitoringHistory.server_id == server_id)
            .order_by(desc(MonitoringHistory.check_time))
            .first()
        )

    def get_all_latest(self) -> List[MonitoringHistory]:
        """Get the latest check for each server using a subquery approach"""
        from sqlalchemy import func

        subquery = (
            self.db.query(
                MonitoringHistory.server_id,
                func.max(MonitoringHistory.check_time).label('max_check_time')
            )
            .group_by(MonitoringHistory.server_id)
            .subquery()
        )

        results = (
            self.db.query(MonitoringHistory)
            .join(
                subquery,
                (MonitoringHistory.server_id == subquery.c.server_id) &
                (MonitoringHistory.check_time == subquery.c.max_check_time)
            )
            .all()
        )

        return results

    def get_history_for_chart(self, server_id: int, hours: int = 24) -> List[MonitoringHistory]:
        from datetime import timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        return (
            self.db.query(MonitoringHistory)
            .filter(
                MonitoringHistory.server_id == server_id,
                MonitoringHistory.check_time >= cutoff_time
            )
            .order_by(MonitoringHistory.check_time)
            .all()
        )
