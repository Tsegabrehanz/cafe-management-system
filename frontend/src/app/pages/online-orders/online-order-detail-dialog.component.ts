import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { OnlineOrder } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-online-order-detail-dialog',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TitleCasePipe, MatDialogModule, MatButtonModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>Online order {{ o.code }}</h2>
    <mat-dialog-content>
      <dl class="detail-list">
        <dt>Status</dt><dd><span [class]="'status-chip s-' + o.status.toLowerCase()">{{ o.status | titlecase }}</span></dd>
        <dt>Customer</dt><dd>{{ o.customerName }}</dd>
        <dt>Phone</dt><dd><a [href]="'tel:' + o.contactNumber">{{ o.contactNumber }}</a></dd>
        @if (o.email) { <dt>Email</dt><dd>{{ o.email }}</dd> }
        <dt>Type</dt><dd>{{ o.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup' }}</dd>
        @if (o.address) { <dt>Address</dt><dd>{{ o.address }}</dd> }
        @if (o.note) { <dt>Note</dt><dd class="note">{{ o.note }}</dd> }
        <dt>Ordered</dt><dd>{{ o.createdAt | date: 'dd.MM.yyyy HH:mm' }}</dd>
        @if (o.handledBy) { <dt>Handled by</dt><dd>{{ o.handledBy }}</dd> }
        @if (o.billUuid) { <dt>Bill</dt><dd>{{ o.billUuid }}</dd> }
      </dl>
      <table mat-table [dataSource]="o.items" class="compact">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Product</th>
          <td mat-cell *matCellDef="let l">{{ l.name }}</td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Qty</th>
          <td mat-cell *matCellDef="let l">{{ l.quantity }}</td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Price</th>
          <td mat-cell *matCellDef="let l">{{ l.price | currency: currency }}</td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Sub total</th>
          <td mat-cell *matCellDef="let l">{{ l.total | currency: currency }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      <p class="bill-total">Total: {{ o.total | currency: currency }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
})
export class OnlineOrderDetailDialogComponent {
  readonly o = inject<OnlineOrder>(MAT_DIALOG_DATA);
  readonly currency = environment.currency;
  readonly columns = ['name', 'quantity', 'price', 'total'];
}
