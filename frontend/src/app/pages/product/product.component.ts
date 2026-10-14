import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { Product } from '../../core/models';
import { ProductDialogComponent } from './product-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatSlideToggleModule, MatCardModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Manage Product</h1>
      <span class="spacer"></span>
      <button mat-flat-button color="primary" (click)="open()">Add Product</button>
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
            <td mat-cell *matCellDef="let p">{{ p.name }}</td>
          </ng-container>
          <ng-container matColumnDef="categoryName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
            <td mat-cell *matCellDef="let p">{{ p.categoryName }}</td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let p">{{ p.description || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Price</th>
            <td mat-cell *matCellDef="let p">{{ p.price }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let p" class="action-cell">
              <button mat-icon-button color="primary" matTooltip="Edit" (click)="open(p)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="primary" matTooltip="Delete" (click)="remove(p)"><mat-icon>delete</mat-icon></button>
              <mat-slide-toggle color="primary" [checked]="p.status" (change)="toggle(p, $event)"
                                [matTooltip]="p.status ? 'Available — click to deactivate' : 'Unavailable — click to activate'"
                                [attr.aria-label]="'Available: ' + p.name" />
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="columns.length">No products found.</td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" [class.hidden]="ds.data.length <= 5" />
    </mat-card>
  `,
})
export class ProductComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private dialog = inject(MatDialog);

  readonly columns = ['name', 'categoryName', 'description', 'price', 'action'];
  readonly ds = new MatTableDataSource<Product>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.ds.filterPredicate = (p, f) =>
      [p.name, p.categoryName, p.description ?? ''].some(v => v.toLowerCase().includes(f));
  }

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this.ds.paginator = this.paginator;
    this.ds.sort = this.sort;
  }

  load(): void {
    this.api.getProducts().subscribe({ next: p => this.ds.data = p, error: e => this.notify.fromHttp(e) });
  }

  applyFilter(e: Event): void {
    this.ds.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
    this.ds.paginator?.firstPage();
  }

  open(product?: Product): void {
    this.dialog.open(ProductDialogComponent, { width: '480px', data: product ?? null })
      .afterClosed().subscribe(changed => { if (changed) this.load(); });
  }

  toggle(p: Product, e: MatSlideToggleChange): void {
    this.api.updateProductStatus(p.id, e.checked).subscribe({
      next: r => { p.status = e.checked; this.notify.success(r.message); },
      error: err => { e.source.checked = !e.checked; this.notify.fromHttp(err); },
    });
  }

  remove(p: Product): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete product', message: `Delete "${p.name}"?`, confirmText: 'Delete' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteProduct(p.id).subscribe({
        next: r => { this.notify.success(r.message); this.load(); },
        error: e => this.notify.fromHttp(e),
      });
    });
  }
}
