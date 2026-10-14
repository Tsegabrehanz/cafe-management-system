import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Bill } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-bill-detail-dialog',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatDialogModule, MatButtonModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>Bill {{ bill.uuid }}</h2>
    <mat-dialog-content>
      <dl class="detail-list">
        <dt>Customer</dt><dd>{{ bill.name }}</dd>
        @if (bill.email) { <dt>Email</dt><dd>{{ bill.email }}</dd> }
        @if (bill.contactNumber) { <dt>Contact</dt><dd>{{ bill.contactNumber }}</dd> }
        <dt>Payment</dt><dd>{{ bill.paymentMethod }}</dd>
        <dt>Date</dt><dd>{{ bill.createdAt | date: 'dd.MM.yyyy HH:mm' }}</dd>
        <dt>Created by</dt><dd>{{ bill.createdBy }}</dd>
      </dl>
      <table mat-table [dataSource]="bill.items" class="compact">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Product</th>
          <td mat-cell *matCellDef="let l">{{ l.name }}</td>
        </ng-container>
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Category</th>
          <td mat-cell *matCellDef="let l">{{ l.category }}</td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef class="num">Qty</th>
          <td mat-cell *matCellDef="let l" class="num">{{ l.quantity }}</td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef class="num">Price</th>
          <td mat-cell *matCellDef="let l" class="num">{{ l.price | currency: currency }}</td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef class="num">Sub total</th>
          <td mat-cell *matCellDef="let l" class="num">{{ l.total | currency: currency }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      <p class="bill-total">Total: {{ bill.total | currency: currency }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="'download'">Download PDF</button>
    </mat-dialog-actions>
  `,
})
export class BillDetailDialogComponent {
  readonly bill = inject<Bill>(MAT_DIALOG_DATA);
  readonly currency = environment.currency;
  readonly columns = ['name', 'category', 'quantity', 'price', 'total'];
}
