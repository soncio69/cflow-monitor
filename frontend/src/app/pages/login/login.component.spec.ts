import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty credentials initially', () => {
    expect(component.username).toBe('');
    expect(component.password).toBe('');
  });

  it('should show error when submitting empty credentials', () => {
    component.username = '';
    component.password = '';
    component.onSubmit();
    fixture.detectChanges();
    expect(component.error).toBe('Inserisci username e password');
  });

  it('should call authService.login on submit with valid credentials', fakeAsync(() => {
    component.username = 'admin';
    component.password = 'admin';
    authService.login.and.returnValue(of({ success: true, message: 'Login successful' }));

    component.onSubmit();
    tick();

    expect(authService.login).toHaveBeenCalledWith('admin', 'admin');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should handle login error', fakeAsync(() => {
    component.username = 'admin';
    component.password = 'wrong';
    authService.login.and.returnValue(throwError(() => new Error('Connection error')));

    component.onSubmit();
    tick();

    expect(component.error).toBe('Errore di connessione');
    expect(component.loading).toBe(false);
  }));

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBe(true);
    component.hidePassword = !component.hidePassword;
    expect(component.hidePassword).toBe(false);
  });
});
