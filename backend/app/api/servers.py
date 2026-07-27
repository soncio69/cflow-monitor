from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.schemas import ServerCreate, ServerUpdate, ServerResponse
from app.repositories.server_repository import ServerRepository

router = APIRouter(prefix="/api/servers", tags=["servers"])


@router.get("", response_model=List[ServerResponse])
def get_servers(db: Session = Depends(get_db)):
    """Get all monitored servers"""
    repo = ServerRepository(db)
    return repo.get_all()


@router.get("/{server_id}", response_model=ServerResponse)
def get_server(server_id: int, db: Session = Depends(get_db)):
    """Get a specific server by ID"""
    repo = ServerRepository(db)
    server = repo.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.post("", response_model=ServerResponse, status_code=201)
def create_server(server: ServerCreate, db: Session = Depends(get_db)):
    """Create a new monitored server"""
    repo = ServerRepository(db)
    return repo.create(server)


@router.put("/{server_id}", response_model=ServerResponse)
def update_server(server_id: int, server: ServerUpdate, db: Session = Depends(get_db)):
    """Update an existing server"""
    repo = ServerRepository(db)
    updated = repo.update(server_id, server)
    if not updated:
        raise HTTPException(status_code=404, detail="Server not found")
    return updated


@router.delete("/{server_id}", status_code=204)
def delete_server(server_id: int, db: Session = Depends(get_db)):
    """Delete a server"""
    repo = ServerRepository(db)
    if not repo.delete(server_id):
        raise HTTPException(status_code=404, detail="Server not found")
