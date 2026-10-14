import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { OnlineOrder } from '../../core/models';
import { environment } from '../../../environments/environment';

/** Asks how the customer paid before completing an order (a bill is created). */
@Component({
  selector: 'app-complete-order-dialog',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Complete order {{ order.code }}</h2>
    <mat-dialog-content class="dialog-form">
      <p>{{ order.customerName }} pays <b>{{ order.total | currency: currency }}</b>. A bill will be created.</p>
      <mat-form-field>
        <mat-label>Payment method</mat-label>
        <mat-select [(ngModel)]="payment">
          @for (m of methods; track m) { <mat-option [value]="m">{{ m }}</mat-option> }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="payment">Complete &amp; create bill</button>
    </mat-dialog-actions>
  `,
})
export class CompleteOrderDialogComponent {
  readonly order = inject<OnlineOrder>(MAT_DIALOG_DATA);
  readonly currency = environment.currency;
  readonly methods = ['Cash', 'Card', 'Mobile payment'];
  payment = 'Cash';
}
