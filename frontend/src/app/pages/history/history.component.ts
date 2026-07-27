import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Chart, registerables } from 'chart.js';
import { ApiService, MonitoringHistory, MonitoredServer } from '../../core/services/api.service';

Chart.register(...registerables);

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="history-container">
      <div class="header">
        <button mat-icon-button routerLink="/servers">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Storico: {{ serverName }}</h1>
      </div>

      <!-- Chart -->
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Andamento Response Time</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="chart-container">
            <canvas #chartCanvas></canvas>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- History Table -->
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Storico Check</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource">
              <!-- Check Time Column -->
              <ng-container matColumnDef="check_time">
                <th mat-header-cell *matHeaderCellDef>Data/Ora</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.check_time | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>
              </ng-container>

              <!-- HTTP Code Column -->
              <ng-container matColumnDef="http_code">
                <th mat-header-cell *matHeaderCellDef>HTTP Code</th>
                <td mat-cell *matCellDef="let row">{{ row.http_code || '-' }}</td>
              </ng-container>

              <!-- Response Time Column -->
              <ng-container matColumnDef="response_time_ms">
                <th mat-header-cell *matHeaderCellDef>Response Time (ms)</th>
                <td mat-cell *matCellDef="let row">{{ row.response_time_ms || '-' }}</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Stato</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-chip" [ngClass]="'status-' + row.status.toLowerCase()">
                    {{ row.status }}
                  </span>
                </td>
              </ng-container>

              <!-- Error Message Column -->
              <ng-container matColumnDef="error_message">
                <th mat-header-cell *matHeaderCellDef>Messaggio Errore</th>
                <td mat-cell *matCellDef="let row">{{ row.error_message || '-' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            <mat-paginator [pageSizeOptions]="[25, 50, 100]" showFirstLastButtons></mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 16px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    .dashboard-card {
      margin-bottom: 16px;
    }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
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
  `]
})
export class HistoryComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = ['check_time', 'http_code', 'response_time_ms', 'status', 'error_message'];
  dataSource: MonitoringHistory[] = [];

  serverId!: number;
  serverName = '';

  private chart: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.serverId = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(this.serverId)) {
      this.router.navigate(['/servers']);
      return;
    }

    this.loadServerInfo();
    this.loadHistory();
    this.loadChartData();
  }

  loadServerInfo() {
    this.api.getServer(this.serverId).subscribe({
      next: (server) => {
        this.serverName = server.name;
      }
    });
  }

  loadHistory() {
    this.api.getHistory(this.serverId, 100, 0).subscribe({
      next: (data) => {
        this.dataSource = data;
      }
    });
  }

  loadChartData() {
    this.api.getChartData(this.serverId, 24).subscribe({
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
