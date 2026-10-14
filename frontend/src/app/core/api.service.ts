import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Bill, Category, Dashboard, GenerateBillRequest, LoginResponse, MenuCategory, Message, OnlineOrder,
  OrderStatus, PlaceOrderRequest, PlaceOrderResponse, Product, TrackedOrder, User,
} from './models';

/** All calls to the Spring Boot REST API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- user
  signup(body: { name: string; contactNumber: string; email: string; password: string }): Observable<Message> {
    return this.http.post<Message>(`${this.url}/user/signup`, body);
  }
  login(body: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/user/login`, body);
  }
  forgotPassword(email: string): Observable<Message> {
    return this.http.post<Message>(`${this.url}/user/forgotPassword`, { email });
  }
  changePassword(oldPassword: string, newPassword: string): Observable<Message> {
    return this.http.post<Message>(`${this.url}/user/changePassword`, { oldPassword, newPassword });
  }
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.url}/user/get`);
  }
  updateUserStatus(id: number, status: boolean): Observable<Message> {
    return this.http.post<Message>(`${this.url}/user/update`, { id, status });
  }

  // ---- dashboard
  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.url}/dashboard/details`);
  }

  // ---- category
  getCategories(onlyWithActiveProducts = false): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.url}/category/get`, { params: { filterValue: onlyWithActiveProducts } });
  }
  addCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.url}/category/add`, { name });
  }
  updateCategory(id: number, name: string): Observable<Category> {
    return this.http.post<Category>(`${this.url}/category/update`, { id, name });
  }
  deleteCategory(id: number): Observable<Message> {
    return this.http.delete<Message>(`${this.url}/category/delete/${id}`);
  }

  // ---- product
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/product/get`);
  }
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/product/getByCategory/${categoryId}`);
  }
  addProduct(body: Omit<Product, 'id' | 'status' | 'categoryName'>): Observable<Product> {
    return this.http.post<Product>(`${this.url}/product/add`, body);
  }
  updateProduct(body: Omit<Product, 'status' | 'categoryName'>): Observable<Product> {
    return this.http.post<Product>(`${this.url}/product/update`, body);
  }
  updateProductStatus(id: number, status: boolean): Observable<Message> {
    return this.http.post<Message>(`${this.url}/product/updateStatus`, { id, status });
  }
  deleteProduct(id: number): Observable<Message> {
    return this.http.delete<Message>(`${this.url}/product/delete/${id}`);
  }

  // ---- bill
  generateBill(body: GenerateBillRequest): Observable<{ uuid: string; total: number }> {
    return this.http.post<{ uuid: string; total: number }>(`${this.url}/bill/generateReport`, body);
  }
  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.url}/bill/getBills`);
  }
  getBillPdf(uuid: string): Observable<Blob> {
    return this.http.get(`${this.url}/bill/getPdf/${encodeURIComponent(uuid)}`, { responseType: 'blob' });
  }
  deleteBill(id: number): Observable<Message> {
    return this.http.delete<Message>(`${this.url}/bill/delete/${id}`);
  }

  // ---- public online ordering (no login)
  getPublicMenu(): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.url}/public/menu`);
  }
  placeOrder(body: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(`${this.url}/public/order`, body);
  }
  trackOrder(code: string): Observable<TrackedOrder> {
    return this.http.get<TrackedOrder>(`${this.url}/public/order/${encodeURIComponent(code.trim())}`);
  }

  // ---- staff: online order queue
  getOnlineOrders(status?: OrderStatus | 'ALL'): Observable<OnlineOrder[]> {
    const params: Record<string, string> = status && status !== 'ALL' ? { status } : {};
    return this.http.get<OnlineOrder[]>(`${this.url}/onlineOrder/get`, { params });
  }
  pendingOnlineCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.url}/onlineOrder/pendingCount`);
  }
  updateOnlineOrderStatus(id: number, status: OrderStatus, paymentMethod?: string): Observable<OnlineOrder> {
    return this.http.post<OnlineOrder>(`${this.url}/onlineOrder/updateStatus`, { id, status, paymentMethod });
  }
}

/** Triggers a browser download for a blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
