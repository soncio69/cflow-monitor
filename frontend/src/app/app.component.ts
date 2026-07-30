import { Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" *ngIf="authService.isLoggedIn()">
        <button mat-icon-button (click)="sidenav.toggle()">
          <mat-icon>menu</mat-icon>
        </button>
        <span>C-Flow Monitor</span>
        <span class="spacer"></span>
        <button mat-icon-button (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container" *ngIf="authService.isLoggedIn()">
        <mat-sidenav #sidenav mode="side" opened class="sidenav">
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/servers">
              <mat-icon matListItemIcon>dns</mat-icon>
              <span matListItemTitle>Server</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content>
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <div class="content" *ngIf="!authService.isLoggedIn()">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .sidenav-container {
      flex: 1;
      background: #f5f5f5;
    }

    .sidenav {
      width: 200px;
      background: white;
    }

    .content {
      flex: 1;
      overflow: auto;
    }
  `]
})
export class AppComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
