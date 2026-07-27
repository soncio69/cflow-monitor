import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatConfirmDialogComponent } from '../../shared/mat-confirm-dialog.component';
import { ApiService, MonitoredServer } from '../../core/services/api.service';

@Component({
  selector: 'app-servers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  template: `
    <div class="servers-container">
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Gestione Server Monitorati</mat-card-title>
          <span class="spacer"></span>
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon>
            Aggiungi Server
          </button>
        </mat-card-header>

        <mat-card-content>
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
                <td mat-cell *matCellDef="let row">{{ row.url }}</td>
              </ng-container>

              <!-- Enabled Column -->
              <ng-container matColumnDef="enabled">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Attivo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.enabled"
                    (change)="toggleEnabled(row)">
                  </mat-slide-toggle>
                </td>
              </ng-container>

              <!-- Warning Threshold Column -->
              <ng-container matColumnDef="warning_threshold">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Soglia Warning (ms)</th>
                <td mat-cell *matCellDef="let row">{{ row.warning_threshold }}</td>
              </ng-container>

              <!-- Critical Threshold Column -->
              <ng-container matColumnDef="critical_threshold">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Soglia Critical (ms)</th>
                <td mat-cell *matCellDef="let row">{{ row.critical_threshold }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="openDialog(row)" matTooltip="Modifica">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteServer(row)" matTooltip="Elimina" color="warn">
                    <mat-icon>delete</mat-icon>
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

      <!-- Edit Dialog -->
      <ng-template #dialogTemplate>
        <h2 mat-dialog-title>{{ editingServer ? 'Modifica' : 'Nuovo' }} Server</h2>
        <mat-dialog-content>
          <form [formGroup]="form" class="server-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>URL</mat-label>
              <input matInput formControlName="url" required placeholder="http://...">
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Soglia Warning (ms)</mat-label>
                <input matInput formControlName="warning_threshold" type="number">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Soglia Critical (ms)</mat-label>
                <input matInput formControlName="critical_threshold" type="number">
              </mat-form-field>
            </div>

            <mat-slide-toggle formControlName="enabled">Server Attivo</mat-slide-toggle>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>Annulla</button>
          <button mat-raised-button color="primary"
                  [disabled]="form.invalid"
                  (click)="saveServer()">
            Salva
          </button>
        </mat-dialog-actions>
      </ng-template>
    </div>
  `,
  styles: [`
    .servers-container {
      padding: 16px;
    }

    .dashboard-card {
      margin-bottom: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .server-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 400px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class ServersComponent implements OnInit {
  @ViewChild('dialogTemplate') dialogTemplate: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'url', 'enabled', 'warning_threshold', 'critical_threshold', 'actions'];
  dataSource: any[] = [];
  form!: FormGroup;
  editingServer: MonitoredServer | null = null;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      url: ['', Validators.required],
      username: [''],
      password: [''],
      warning_threshold: [1000],
      critical_threshold: [3000],
      enabled: [true]
    });

    this.loadServers();
  }

  loadServers() {
    this.api.getServers().subscribe({
      next: (data) => {
        this.dataSource = data;
      }
    });
  }

  openDialog(server?: MonitoredServer) {
    this.editingServer = server || null;

    if (server) {
      this.form.patchValue({
        name: server.name,
        url: server.url,
        username: server.username || '',
        password: server.password || '',
        warning_threshold: server.warning_threshold,
        critical_threshold: server.critical_threshold,
        enabled: server.enabled
      });
    } else {
      this.form.reset({
        warning_threshold: 1000,
        critical_threshold: 3000,
        enabled: true
      });
    }

    const dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '500px'
    });
  }

  saveServer() {
    if (this.form.invalid) return;

    const data = this.form.value;

    if (this.editingServer) {
      this.api.updateServer(this.editingServer.id, data).subscribe({
        next: () => {
          this.snackBar.open('Server aggiornato', 'Chiudi', { duration: 3000 });
          this.loadServers();
          this.dialog.closeAll();
        }
      });
    } else {
      this.api.createServer(data).subscribe({
        next: () => {
          this.snackBar.open('Server creato', 'Chiudi', { duration: 3000 });
          this.loadServers();
          this.dialog.closeAll();
        }
      });
    }
  }

  toggleEnabled(server: MonitoredServer) {
    this.api.updateServer(server.id, { enabled: !server.enabled }).subscribe({
      next: () => {
        this.snackBar.open('Stato aggiornato', 'Chiudi', { duration: 2000 });
        this.loadServers();
      }
    });
  }

  deleteServer(server: MonitoredServer) {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Conferma Eliminazione',
        message: `Sei sicuro di voler eliminare il server "${server.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.deleteServer(server.id).subscribe({
          next: () => {
            this.snackBar.open('Server eliminato', 'Chiudi', { duration: 3000 });
            this.loadServers();
          }
        });
      }
    });
  }
}
