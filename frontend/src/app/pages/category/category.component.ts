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
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { Category } from '../../core/models';
import { CategoryDialogComponent } from './category-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatCardModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Manage Category</h1>
      <span class="spacer"></span>
      <button mat-flat-button color="primary" (click)="open()">Add Category</button>
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
            <td mat-cell *matCellDef="let c">{{ c.name }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let c" class="action-cell">
              <button mat-icon-button color="primary" matTooltip="Edit" (click)="open(c)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="primary" matTooltip="Delete" (click)="remove(c)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="columns.length">No categories found.</td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" [class.hidden]="ds.data.length <= 5" />
    </mat-card>
  `,
})
export class CategoryComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private dialog = inject(MatDialog);

  readonly columns = ['name', 'action'];
  readonly ds = new MatTableDataSource<Category>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this.ds.paginator = this.paginator;
    this.ds.sort = this.sort;
  }

  load(): void {
    this.api.getCategories().subscribe({ next: c => this.ds.data = c, error: e => this.notify.fromHttp(e) });
  }

  applyFilter(e: Event): void {
    this.ds.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
    this.ds.paginator?.firstPage();
  }

  open(category?: Category): void {
    this.dialog.open(CategoryDialogComponent, { width: '420px', data: category ?? null })
      .afterClosed().subscribe(changed => { if (changed) this.load(); });
  }

  remove(c: Category): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete category', message: `Delete "${c.name}"?`, confirmText: 'Delete' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteCategory(c.id).subscribe({
        next: r => { this.notify.success(r.message); this.load(); },
        error: e => this.notify.fromHttp(e),
      });
    });
  }
}
