import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatSlideToggleModule, MatCardModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Manage Users</h1>
      <span class="spacer"></span>
      <span class="muted">New sign-ups can't log in until approved</span>
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
            <td mat-cell *matCellDef="let u">{{ u.name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>
          <ng-container matColumnDef="contactNumber">
            <th mat-header-cell *matHeaderCellDef>Contact Number</th>
            <td mat-cell *matCellDef="let u">{{ u.contactNumber }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Action</th>
            <td mat-cell *matCellDef="let u">
              <mat-slide-toggle color="primary" [checked]="u.status" (change)="toggle(u, $event)" [attr.aria-label]="'Approved: ' + u.name">
                <span class="status-label" [class.pending]="!u.status">{{ u.status ? 'Active' : 'Pending' }}</span>
              </mat-slide-toggle>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="columns.length">No users found.</td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" [class.hidden]="ds.data.length <= 5" />
    </mat-card>
  `,
})
export class UserComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  readonly columns = ['name', 'email', 'contactNumber', 'status'];
  readonly ds = new MatTableDataSource<User>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.ds.filterPredicate = (u, f) =>
      [u.name, u.email, u.contactNumber ?? ''].some(v => v.toLowerCase().includes(f));
  }

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this.ds.paginator = this.paginator;
    this.ds.sort = this.sort;
  }

  load(): void {
    this.api.getUsers().subscribe({ next: u => this.ds.data = u, error: e => this.notify.fromHttp(e) });
  }

  applyFilter(e: Event): void {
    this.ds.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
    this.ds.paginator?.firstPage();
  }

  toggle(u: User, e: MatSlideToggleChange): void {
    this.api.updateUserStatus(u.id, e.checked).subscribe({
      next: r => { u.status = e.checked; this.notify.success(r.message); },
      error: err => { e.source.checked = !e.checked; this.notify.fromHttp(err); },
    });
  }
}
