import httpx
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.models import MonitoredServer, MonitoringHistory
from app.models.schemas import MonitoringHistoryBase
from app.repositories.server_repository import ServerRepository
from app.repositories.history_repository import HistoryRepository


class MonitoringService:
    def __init__(self, db: Session):
        self.db = db
        self.server_repo = ServerRepository(db)
        self.history_repo = HistoryRepository(db)

    def check_server(self, server: MonitoredServer) -> Dict[str, Any]:
        """Perform HTTP check on a single server"""
        result = {
            'server_id': server.id,
            'http_code': None,
            'response_time_ms': None,
            'status': 'DOWN',
            'error_message': None,
            'timestamp': datetime.utcnow()
        }

        try:
            # Prepare authentication
            auth = None
            if server.username:
                auth = (server.username, server.password or '')

            # Make HTTP request with timeout
            start_time = datetime.utcnow()
            with httpx.Client(timeout=10.0) as client:
                response = client.get(server.url, auth=auth)
                end_time = datetime.utcnow()

                # Calculate response time
                response_time = int((end_time - start_time).total_seconds() * 1000)
                result['response_time_ms'] = response_time
                result['http_code'] = response.status_code

                # Determine status based on response code and thresholds
                if response.status_code == 200:
                    if response_time < server.warning_threshold:
                        result['status'] = 'UP'
                    elif response_time < server.critical_threshold:
                        result['status'] = 'WARNING'
                    else:
                        result['status'] = 'DOWN'
                else:
                    result['status'] = 'DOWN'
                    result['error_message'] = f"HTTP {response.status_code}"

        except httpx.TimeoutException:
            result['error_message'] = 'Timeout'
        except httpx.ConnectError as e:
            result['error_message'] = f'Connection error: {str(e)}'
        except Exception as e:
            result['error_message'] = f'Error: {str(e)}'

        return result

    def check_all_servers(self) -> None:
        """Check all enabled servers and save results"""
        servers = self.server_repo.get_enabled()

        for server in servers:
            check_result = self.check_server(server)

            # Save to history
            history = MonitoringHistoryBase(
                server_id=server.id,
                http_code=check_result['http_code'],
                response_time_ms=check_result['response_time_ms'],
                status=check_result['status'],
                error_message=check_result['error_message']
            )
            self.history_repo.create(history)

    def get_current_status(self) -> list:
        """Get current status of all servers"""
        latest_checks = self.history_repo.get_all_latest()
        servers = self.server_repo.get_all()

        # Create a dict of latest checks by server_id
        latest_by_server = {h.server_id: h for h in latest_checks}

        result = []
        for server in servers:
            latest = latest_by_server.get(server.id)
            result.append({
                'id': server.id,
                'name': server.name,
                'url': server.url,
                'status': latest.status if latest else 'UNKNOWN',
                'http_code': latest.http_code if latest else None,
                'response_time_ms': latest.response_time_ms if latest else None,
                'last_check': latest.check_time if latest else None
            })

        return result
