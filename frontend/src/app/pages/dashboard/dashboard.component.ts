import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, interval } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ApiService, ServerStatus } from '../../core/services/api.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Summary Tiles -->
      <div class="tiles-row">
        <mat-card class="stat-tile tile-total">
          <div class="tile-value">{{ totalServers }}</div>
          <div class="tile-label">Totale Server</div>
        </mat-card>
        <mat-card class="stat-tile tile-up">
          <div class="tile-value">{{ upServers }}</div>
          <div class="tile-label">UP</div>
        </mat-card>
        <mat-card class="stat-tile tile-warning">
          <div class="tile-value">{{ warningServers }}</div>
          <div class="tile-label">WARNING</div>
        </mat-card>
        <mat-card class="stat-tile tile-down">
          <div class="tile-value">{{ downServers }}</div>
          <div class="tile-label">DOWN</div>
        </mat-card>
      </div>

      <!-- Server Table -->
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Stato Server</mat-card-title>
          <span class="spacer"></span>
          <button mat-icon-button (click)="refresh()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-header>

        <mat-card-content>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Cerca</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Nome o URL">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort>
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nome</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <!-- URL Column -->
              <ng-container matColumnDef="url">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>URL</th>
                <td mat-cell *matCellDef="let row">
                  <a [href]="row.url" target="_blank" class="server-url">{{ row.url }}</a>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Stato</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-chip" [ngClass]="'status-' + row.status.toLowerCase()">
                    {{ row.status }}
                  </span>
                </td>
              </ng-container>

              <!-- HTTP Code Column -->
              <ng-container matColumnDef="http_code">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>HTTP Code</th>
                <td mat-cell *matCellDef="let row">{{ row.http_code || '-' }}</td>
              </ng-container>

              <!-- Response Time Column -->
              <ng-container matColumnDef="response_time_ms">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Response Time (ms)</th>
                <td mat-cell *matCellDef="let row">{{ row.response_time_ms || '-' }}</td>
              </ng-container>

              <!-- Last Check Column -->
              <ng-container matColumnDef="last_check">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Ultimo Check</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.last_check ? (row.last_check | date:'dd/MM/yyyy HH:mm:ss') : '-' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [routerLink]="['/servers', row.id, 'history']"
                          matTooltip="Storico">
                    <mat-icon>history</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            <mat-paginator [pageSizeOptions]="[10, 25, 100]" showFirstLastButtons></mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Performance Chart -->
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Andamento Response Time (Ultime 24 ore)</mat-card-title>
          <span class="spacer"></span>
          <mat-form-field appearance="outline" class="server-select">
            <mat-label>Seleziona Server</mat-label>
            <mat-select [(value)]="selectedServerId" (selectionChange)="loadChartData()">
              <mat-option *ngFor="let server of servers" [value]="server.id">
                {{ server.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-header>

        <mat-card-content>
          <div class="chart-container">
            <canvas #chartCanvas></canvas>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px;
    }

    .tiles-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .tiles-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-tile {
      padding: 24px;
      text-align: center;
      border-radius: 8px;
    }

    .tile-total { background: #1976d2; color: white; }
    .tile-up { background: #4caf50; color: white; }
    .tile-warning { background: #ff9800; color: white; }
    .tile-down { background: #f44336; color: white; }

    .tile-value {
      font-size: 42px;
      font-weight: 500;
    }

    .tile-label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 8px;
    }

    .dashboard-card {
      margin-bottom: 16px;
    }

    .search-field {
      width: 100%;
      max-width: 300px;
      margin-bottom: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .server-url {
      color: #1976d2;
      text-decoration: none;
    }

    .server-url:hover {
      text-decoration: underline;
    }

    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-up { background: #e8f5e9; color: #2e7d32; }
    .status-warning { background: #fff3e0; color: #ef6c00; }
    .status-down { background: #ffebee; color: #c62828; }
    .status-unknown { background: #f5f5f5; color: #616161; }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .server-select {
      width: 200px;
    }

    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'url', 'status', 'http_code', 'response_time_ms', 'last_check', 'actions'];
  dataSource = new MatTableDataSource<ServerStatus>();

  servers: ServerStatus[] = [];
  selectedServerId: number | null = null;
  loading = false;

  totalServers = 0;
  upServers = 0;
  warningServers = 0;
  downServers = 0;

  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStatus();
    // Auto-refresh every 60 seconds
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadStatus());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadStatus() {
    this.loading = true;
    this.api.getStatus().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.servers = data;
        this.dataSource.data = data;
        this.updateCounts();

        this.dataSource.paginator = this.paginator;
        if (this.dataSource.sort) {
          this.dataSource.sort = this.sort;
        }

        if (!this.selectedServerId && data.length > 0) {
          this.selectedServerId = data[0].id;
          this.loadChartData();
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updateCounts() {
    this.totalServers = this.servers.length;
    this.upServers = this.servers.filter(s => s.status === 'UP').length;
    this.warningServers = this.servers.filter(s => s.status === 'WARNING').length;
    this.downServers = this.servers.filter(s => s.status === 'DOWN').length;
  }

  refresh() {
    this.loadStatus();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadChartData() {
    if (!this.selectedServerId) return;

    this.api.getChartData(this.selectedServerId, 24).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.renderChart(response.data);
      }
    });
  }

  renderChart(data: any[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })),
        datasets: [{
          label: 'Response Time (ms)',
          data: data.map(d => d.response_time_ms),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Response Time (ms)'
            }
          }
        }
      }
    });
  }
}
