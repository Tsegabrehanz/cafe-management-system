import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, saveBlob } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { OnlineOrderAlertsService } from '../../core/online-order-alerts.service';
import { OnlineOrder, OrderStatus } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CompleteOrderDialogComponent } from './complete-order-dialog.component';
import { OnlineOrderDetailDialogComponent } from './online-order-detail-dialog.component';
import { environment } from '../../../environments/environment';

type Filter = 'ACTIVE' | OrderStatus | 'ALL';

const ACTIVE: OrderStatus[] = ['PENDING', 'ACCEPTED', 'READY'];

@Component({
  selector: 'app-online-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule, MatCardModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Online Orders</h1>
      <span class="spacer"></span>
      <span class="muted small hide-xs">Updates every 20 s</span>
      <button mat-icon-button color="primary" matTooltip="Refresh now" (click)="load()"><mat-icon>refresh</mat-icon></button>
    </mat-card>

    <mat-card class="filter-card orders-filter">
      <mat-button-toggle-group [value]="filter()" (change)="setFilter($event.value)" aria-label="Status filter">
        <mat-button-toggle value="ACTIVE">Active ({{ count('ACTIVE') }})</mat-button-toggle>
        <mat-button-toggle value="PENDING">New ({{ count('PENDING') }})</mat-button-toggle>
        <mat-button-toggle value="COMPLETED">Completed</mat-button-toggle>
        <mat-button-toggle value="CANCELLED">Cancelled</mat-button-toggle>
        <mat-button-toggle value="ALL">All</mat-button-toggle>
      </mat-button-toggle-group>
      <mat-form-field class="filter">
        <mat-label>Filter</mat-label>
        <input matInput (keyup)="applySearch($event)">
      </mat-form-field>
    </mat-card>

    <mat-card class="table-card">
      <div class="table-scroll">
        <table mat-table [dataSource]="ds" class="template-table">
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let o"><b>{{ o.code }}</b><div class="cell-sub">{{ o.createdAt | date: 'HH:mm' }}</div></td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Customer</th>
            <td mat-cell *matCellDef="let o">{{ o.customerName }}<div class="cell-sub">{{ o.contactNumber }}</div></td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let o">
              <mat-icon class="type-icon" [matTooltip]="o.address || 'Pickup at the counter'">{{ o.orderType === 'DELIVERY' ? 'delivery_dining' : 'storefront' }}</mat-icon>
              <div class="cell-sub">{{ o.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup' }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="items">
            <th mat-header-cell *matHeaderCellDef>Items</th>
            <td mat-cell *matCellDef="let o" class="items-cell">
              {{ summary(o) }}
              @if (o.note) { <div class="cell-sub note"><mat-icon inline>sticky_note_2</mat-icon> {{ o.note }}</div> }
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let o">{{ o.total | currency: currency }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let o"><span [class]="'status-chip s-' + o.status.toLowerCase()">{{ label(o.status) }}</span></td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let o" class="action-cell">
              @if (o.nextStatuses.includes('ACCEPTED')) {
                <button mat-flat-button color="primary" class="act" (click)="move(o, 'ACCEPTED')">Accept</button>
              }
              @if (o.nextStatuses.includes('READY')) {
                <button mat-flat-button color="primary" class="act" (click)="move(o, 'READY')">{{ o.orderType === 'DELIVERY' ? 'Out for delivery' : 'Ready' }}</button>
              }
              @if (o.nextStatuses.includes('COMPLETED')) {
                <button mat-flat-button color="primary" class="act" (click)="complete(o)">Complete</button>
              }
              <button mat-icon-button color="primary" matTooltip="View" (click)="view(o)"><mat-icon>visibility</mat-icon></button>
              @if (o.billUuid) {
                <button mat-icon-button color="primary" matTooltip="Download Bill" (click)="downloadBill(o)"><mat-icon>summarize</mat-icon></button>
              }
              @if (o.nextStatuses.includes('CANCELLED')) {
                <button mat-icon-button color="primary" matTooltip="Cancel order" (click)="cancel(o)"><mat-icon>cancel</mat-icon></button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" [class.row-new]="row.status === 'PENDING'"></tr>
          <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="columns.length">No orders here.</td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" [pageSize]="10" [class.hidden]="ds.filteredData.length <= 10" />
    </mat-card>
  `,
})
export class OnlineOrdersComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private dialog = inject(MatDialog);
  private alerts = inject(OnlineOrderAlertsService);
  private destroyRef = inject(DestroyRef);

  readonly currency = environment.currency;
  readonly columns = ['code', 'customer', 'type', 'items', 'total', 'status', 'action'];
  readonly ds = new MatTableDataSource<OnlineOrder>([]);
  readonly filter = signal<Filter>('ACTIVE');
  private all: OnlineOrder[] = [];
  private search = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.ds.filterPredicate = (o, f) =>
      [o.code, o.customerName, o.contactNumber, o.address ?? '', ...o.items.map(i => i.name)]
        .some(v => v.toLowerCase().includes(f));
  }

  ngOnInit(): void {
    this.load();
    interval(20000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(true));
  }

  ngAfterViewInit(): void {
    this.ds.paginator = this.paginator;
  }

  load(quiet = false): void {
    this.api.getOnlineOrders('ALL').subscribe({
      next: list => {
        const before = this.all.filter(o => o.status === 'PENDING').length;
        const after = list.filter(o => o.status === 'PENDING').length;
        if (quiet && after > before) this.notify.success(`${after - before} new online order${after - before > 1 ? 's' : ''}!`);
        this.all = list;
        this.apply();
        this.alerts.pending.set(after);
      },
      error: e => { if (!quiet) this.notify.fromHttp(e); },
    });
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
    this.apply();
  }

  applySearch(e: Event): void {
    this.search = (e.target as HTMLInputElement).value.trim().toLowerCase();
    this.ds.filter = this.search;
    this.ds.paginator?.firstPage();
  }

  count(f: Filter): number {
    return this.all.filter(o => this.matches(o, f)).length;
  }

  summary(o: OnlineOrder): string {
    return o.items.map(i => `${i.quantity}× ${i.name}`).join(', ');
  }

  label(s: OrderStatus): string {
    return { PENDING: 'New', ACCEPTED: 'Preparing', READY: 'Ready', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }[s];
  }

  move(o: OnlineOrder, status: OrderStatus, paymentMethod?: string): void {
    this.api.updateOnlineOrderStatus(o.id, status, paymentMethod).subscribe({
      next: updated => {
        this.all = this.all.map(x => x.id === updated.id ? updated : x);
        this.apply();
        this.alerts.pending.set(this.count('PENDING'));
        this.notify.success(`Order ${updated.code}: ${this.label(updated.status).toLowerCase()}.`);
      },
      error: e => { this.notify.fromHttp(e); this.load(true); },
    });
  }

  complete(o: OnlineOrder): void {
    this.dialog.open(CompleteOrderDialogComponent, { width: '420px', data: o })
      .afterClosed().subscribe((payment: string | null) => { if (payment) this.move(o, 'COMPLETED', payment); });
  }

  cancel(o: OnlineOrder): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancel Order', message: `Cancel order ${o.code} from ${o.customerName}? Consider calling them on ${o.contactNumber}.`, confirmText: 'Cancel order' },
    }).afterClosed().subscribe(ok => { if (ok) this.move(o, 'CANCELLED'); });
  }

  view(o: OnlineOrder): void {
    this.dialog.open(OnlineOrderDetailDialogComponent, { width: '600px', maxWidth: '95vw', data: o });
  }

  downloadBill(o: OnlineOrder): void {
    if (!o.billUuid) return;
    this.api.getBillPdf(o.billUuid).subscribe({
      next: blob => saveBlob(blob, `${o.billUuid}.pdf`),
      error: e => this.notify.fromHttp(e, 'Could not download the bill.'),
    });
  }

  private apply(): void {
    this.ds.data = this.all.filter(o => this.matches(o, this.filter()));
    this.ds.filter = this.search;
  }

  private matches(o: OnlineOrder, f: Filter): boolean {
    if (f === 'ALL') return true;
    if (f === 'ACTIVE') return ACTIVE.includes(o.status);
    return o.status === f;
  }
}
