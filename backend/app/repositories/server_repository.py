from sqlalchemy.orm import Session
from app.models.models import MonitoredServer
from app.models.schemas import ServerCreate, ServerUpdate
from typing import List, Optional
from datetime import datetime


class ServerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[MonitoredServer]:
        return self.db.query(MonitoredServer).all()

    def get_by_id(self, server_id: int) -> Optional[MonitoredServer]:
        return self.db.query(MonitoredServer).filter(MonitoredServer.id == server_id).first()

    def create(self, server: ServerCreate) -> MonitoredServer:
        db_server = MonitoredServer(**server.model_dump())
        self.db.add(db_server)
        self.db.commit()
        self.db.refresh(db_server)
        return db_server

    def update(self, server_id: int, server: ServerUpdate) -> Optional[MonitoredServer]:
        db_server = self.get_by_id(server_id)
        if db_server:
            update_data = server.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_server, key, value)
            db_server.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_server)
        return db_server

    def delete(self, server_id: int) -> bool:
        db_server = self.get_by_id(server_id)
        if db_server:
            self.db.delete(db_server)
            self.db.commit()
            return True
        return False

    def get_enabled(self) -> List[MonitoredServer]:
        return self.db.query(MonitoredServer).filter(MonitoredServer.enabled == True).all()
