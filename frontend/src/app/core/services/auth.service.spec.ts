import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', () => {
      const mockResponse = { success: true, message: 'Login successful' };

      service.login('admin', 'admin').subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'admin' });
      req.flush(mockResponse);
    });

    it('should set localStorage on successful login', () => {
      const mockResponse = { success: true, message: 'Login successful' };

      service.login('admin', 'admin').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(mockResponse);

      expect(localStorage.getItem('cflow_logged_in')).toBe('true');
    });
  });

  describe('logout', () => {
    it('should clear localStorage on logout', () => {
      localStorage.setItem('cflow_logged_in', 'true');
      service.logout();
      expect(localStorage.getItem('cflow_logged_in')).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when user is logged in', () => {
      localStorage.setItem('cflow_logged_in', 'true');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when user is not logged in', () => {
      localStorage.clear();
      expect(service.isLoggedIn()).toBe(false);
    });
  });
});
