import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, saveBlob } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { NotifyService } from '../../core/notify.service';
import { Bill } from '../../core/models';
import { BillDetailDialogComponent } from './bill-detail-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-bill',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule, MatCardModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">View Bill</h1>
    </mat-card>

    <mat-card class="filter-card">
      <mat-form-field class="filter">
        <mat-label>Filter</mat-label>
        <input matInput (keyup)="applyFilter($event)">
      </mat-form-field>
    </mat-card>

    <mat-card class="table-card">
      <div class="table-scroll">
        <table mat-table [dataSource]="ds" matSort class="template-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let b">{{ b.name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let b">{{ b.email || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="contactNumber">
            <th mat-header-cell *matHeaderCellDef>Contact Number</th>
            <td mat-cell *matCellDef="let b">{{ b.contactNumber || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="paymentMethod">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Payment Method</th>
            <td mat-cell *matCellDef="let b">{{ b.paymentMethod }}</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Total</th>
            <td mat-cell *matCellDef="let b">{{ b.total }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let b" class="action-cell">
              <button mat-icon-button color="primary" matTooltip="View" (click)="view(b)"><mat-icon>visibility</mat-icon></button>
              <button mat-icon-button color="primary" matTooltip="Download Bill" (click)="download(b)"><mat-icon>summarize</mat-icon></button>
              @if (auth.isAdmin()) {
                <button mat-icon-button color="primary" matTooltip="Delete" (click)="remove(b)"><mat-icon>delete</mat-icon></button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="columns.length">No bills found.</td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" [class.hidden]="ds.data.length <= 5" />
    </mat-card>
  `,
})
export class BillComponent implements OnInit, AfterViewInit {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private dialog = inject(MatDialog);

  readonly columns = ['name', 'email', 'contactNumber', 'paymentMethod', 'total', 'action'];
  readonly ds = new MatTableDataSource<Bill>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.ds.filterPredicate = (b, f) =>
      [b.name, b.uuid, b.paymentMethod, b.email ?? '', b.contactNumber ?? '', String(b.total)]
        .some(v => v.toLowerCase().includes(f));
  }

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this.ds.paginator = this.paginator;
    this.ds.sort = this.sort;
  }

  load(): void {
    this.api.getBills().subscribe({ next: b => this.ds.data = b, error: e => this.notify.fromHttp(e) });
  }

  applyFilter(e: Event): void {
    this.ds.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
    this.ds.paginator?.firstPage();
  }

  view(b: Bill): void {
    this.dialog.open(BillDetailDialogComponent, { width: '640px', maxWidth: '95vw', data: b })
      .afterClosed().subscribe(r => { if (r === 'download') this.download(b); });
  }

  download(b: Bill): void {
    this.api.getBillPdf(b.uuid).subscribe({
      next: blob => saveBlob(blob, `${b.uuid}.pdf`),
      error: e => this.notify.fromHttp(e, 'Could not download the PDF.'),
    });
  }

  remove(b: Bill): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Bill', message: `Are you sure you want to delete the bill for ${b.name}?`, confirmText: 'Delete' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteBill(b.id).subscribe({
        next: r => { this.notify.success(r.message); this.load(); },
        error: e => this.notify.fromHttp(e),
      });
    });
  }
}
