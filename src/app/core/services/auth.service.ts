import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Role } from '../models/auth.model';

const TOKEN_KEY = 'charge_token';
const ROLE_KEY = 'charge_role';
const NAME_KEY = 'charge_name';
const USER_ID_KEY = 'charge_user_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly roleSignal = signal<Role | null>(localStorage.getItem(ROLE_KEY) as Role | null);
  private readonly nameSignal = signal<string | null>(localStorage.getItem(NAME_KEY));

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly role = computed(() => this.roleSignal());
  readonly fullName = computed(() => this.nameSignal());

  constructor(private http: HttpClient, private router: Router) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(USER_ID_KEY);
    this.tokenSignal.set(null);
    this.roleSignal.set(null);
    this.nameSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUserId(): number | null {
    const raw = localStorage.getItem(USER_ID_KEY);
    return raw ? Number(raw) : null;
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(ROLE_KEY, res.role);
    localStorage.setItem(NAME_KEY, res.fullName);
    localStorage.setItem(USER_ID_KEY, String(res.userId));
    this.tokenSignal.set(res.token);
    this.roleSignal.set(res.role);
    this.nameSignal.set(res.fullName);
  }
}