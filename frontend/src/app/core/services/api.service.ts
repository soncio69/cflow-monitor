import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonitoredServer {
  id: number;
  name: string;
  url: string;
  username?: string;
  password?: string;
  enabled: boolean;
  warning_threshold: number;
  critical_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ServerStatus {
  id: number;
  name: string;
  url: string;
  status: string;
  http_code?: number;
  response_time_ms?: number;
  last_check?: string;
}

export interface MonitoringHistory {
  id: number;
  server_id: number;
  check_time: string;
  http_code?: number;
  response_time_ms?: number;
  status: string;
  error_message?: string;
}

export interface ChartDataPoint {
  time: string;
  response_time_ms: number;
  status: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth
  login(credentials: LoginRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/api/auth/login`,
      credentials
    );
  }

  // Servers
  getServers(): Observable<MonitoredServer[]> {
    return this.http.get<MonitoredServer[]>(`${this.apiUrl}/api/servers`);
  }

  getServer(id: number): Observable<MonitoredServer> {
    return this.http.get<MonitoredServer>(`${this.apiUrl}/api/servers/${id}`);
  }

  createServer(server: Partial<MonitoredServer>): Observable<MonitoredServer> {
    return this.http.post<MonitoredServer>(`${this.apiUrl}/api/servers`, server);
  }

  updateServer(id: number, server: Partial<MonitoredServer>): Observable<MonitoredServer> {
    return this.http.put<MonitoredServer>(`${this.apiUrl}/api/servers/${id}`, server);
  }

  deleteServer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/servers/${id}`);
  }

  // Monitoring
  getStatus(): Observable<ServerStatus[]> {
    return this.http.get<ServerStatus[]>(`${this.apiUrl}/api/monitoring/status`);
  }

  getHistory(serverId: number, limit = 100, offset = 0): Observable<MonitoringHistory[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<MonitoringHistory[]>(
      `${this.apiUrl}/api/monitoring/history/${serverId}`,
      { params }
    );
  }

  getChartData(serverId: number, hours = 24): Observable<{ data: ChartDataPoint[] }> {
    const params = new HttpParams().set('hours', hours.toString());

    return this.http.get<{ data: ChartDataPoint[] }>(
      `${this.apiUrl}/api/monitoring/chart/${serverId}`,
      { params }
    );
  }

  triggerCheck(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/api/monitoring/check-now`, {});
  }
}
