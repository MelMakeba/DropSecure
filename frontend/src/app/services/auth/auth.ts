import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { AnyUser, UserRole } from '../../models/user.model';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<{success: boolean; user?: AnyUser; token?: string; message: string}> {
    return this.http.post<{ message: string; data: { accessToken: string; refreshToken: string; user: AnyUser } }>(
      `${this.apiUrl}/auth/login`,
      { email, password }
    ).pipe(
      map(res => {
        if (res && res.data && res.data.accessToken && res.data.user) {
          localStorage.setItem('dropsecure_user', JSON.stringify(res.data.user));
          localStorage.setItem('token', res.data.accessToken);
          return {
            success: true,
            user: res.data.user,
            token: res.data.accessToken,
            message: res.message || 'Login successful'
          };
        }
        return { success: false, message: 'Invalid response from server' };
      }),
      catchError((error: HttpErrorResponse) => {
        const msg = error.error?.message || 'Invalid credentials';
        return of({ success: false, message: msg });
      })
    );
  }

  register(userData: Partial<AnyUser> & { role: UserRole }): Observable<{success: boolean; user?: AnyUser; message: string}> {
    return this.http.post<{ message: string; data: AnyUser }>(
      `${this.apiUrl}/auth/register`,
      userData
    ).pipe(
      map(res => {
        if (res && res.data) {
          return {
            success: true,
            user: res.data,
            message: res.message || 'Registration successful'
          };
        }
        return { success: false, message: 'Invalid response from server' };
      }),
      catchError((error: HttpErrorResponse) => {
        const msg = error.error?.message || 'Registration failed';
        return of({ success: false, message: msg });
      })
    );
  }

  validateToken(token: string): boolean {
    // Optionally, call /auth/me or decode JWT for validation
    return !!token && token.length > 0;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('dropsecure_user');
    this.router.navigate(['/']);
  }

  // Optionally, get current user info from backend
  getCurrentUser(): AnyUser | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      } as AnyUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('dropsecure_user') && !!localStorage.getItem('token');
  }

  verifyEmail(email: string, code: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/auth/verify-email`,
      { email, code },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      map(res => ({
        success: true,
        message: res.message || 'Email verified successfully'
      })),
      catchError((error: HttpErrorResponse) => {
        const msg = error.error?.message || 'Verification failed';
        return of({ success: false, message: msg });
      })
    );
  }

  resendVerification(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/auth/verify-email`,
      { email },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      map(res => ({
        success: true,
        message: res.message || 'Verification email resent successfully'
      })),
      catchError((error: HttpErrorResponse) => {
        const msg = error.error?.message || 'Resend verification failed';
        return of({ success: false, message: msg });
      })
    );
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  // add other fields if needed
}

