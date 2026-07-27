import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, MonitoredServer, ServerStatus } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Auth', () => {
    it('should login successfully', () => {
      const mockResponse = { success: true, message: 'Login successful' };

      service.login({ username: 'admin', password: 'admin' }).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Servers CRUD', () => {
    const mockServer: MonitoredServer = {
      id: 1,
      name: 'TestServer',
      url: 'http://test.com',
      enabled: true,
      warning_threshold: 1000,
      critical_threshold: 3000,
      created_at: '2024-01-01T00:00:00',
      updated_at: '2024-01-01T00:00:00'
    };

    it('should get all servers', () => {
      const mockServers: MonitoredServer[] = [mockServer];

      service.getServers().subscribe(servers => {
        expect(servers).toEqual(mockServers);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/servers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockServers);
    });

    it('should get a server by id', () => {
      service.getServer(1).subscribe(server => {
        expect(server).toEqual(mockServer);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/servers/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockServer);
    });

    it('should create a server', () => {
      const newServer = { name: 'NewServer', url: 'http://new.com' };

      service.createServer(newServer).subscribe(server => {
        expect(server).toEqual(mockServer);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/servers`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newServer);
      req.flush(mockServer);
    });

    it('should update a server', () => {
      const updates = { name: 'UpdatedName' };

      service.updateServer(1, updates).subscribe(server => {
        expect(server).toEqual(mockServer);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/servers/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockServer);
    });

    it('should delete a server', () => {
      service.deleteServer(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/servers/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Monitoring', () => {
    const mockStatus: ServerStatus[] = [
      {
        id: 1,
        name: 'TestServer',
        url: 'http://test.com',
        status: 'UP',
        http_code: 200,
        response_time_ms: 150,
        last_check: '2024-01-01T12:00:00'
      }
    ];

    it('should get monitoring status', () => {
      service.getStatus().subscribe(status => {
        expect(status).toEqual(mockStatus);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/monitoring/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });

    it('should get history for a server', () => {
      const mockHistory = [
        {
          id: 1,
          server_id: 1,
          check_time: '2024-01-01T12:00:00',
          http_code: 200,
          response_time_ms: 150,
          status: 'UP'
        }
      ];

      service.getHistory(1, 100, 0).subscribe(history => {
        expect(history).toEqual(mockHistory);
      });

      const req = httpMock.expectOne(req =>
        req.url === `${environment.apiUrl}/api/monitoring/history/1` &&
        req.params.get('limit') === '100' &&
        req.params.get('offset') === '0'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });

    it('should get chart data', () => {
      const mockChartData = {
        data: [
          { time: '2024-01-01T12:00:00', response_time_ms: 150, status: 'UP' }
        ]
      };

      service.getChartData(1, 24).subscribe(response => {
        expect(response).toEqual(mockChartData);
      });

      const req = httpMock.expectOne(req =>
        req.url === `${environment.apiUrl}/api/monitoring/chart/1` &&
        req.params.get('hours') === '24'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockChartData);
    });

    it('should trigger manual check', () => {
      const mockResponse = { message: 'Check triggered' };

      service.triggerCheck().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/monitoring/check-now`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
