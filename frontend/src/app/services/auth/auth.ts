import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { Admin, Customer, Courier, AnyUser, UserRole } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{success: boolean; user?: AnyUser; token?: string; message: string}> {
    console.log('🔐 Login attempt:', { email, password });
    
    return this.getAllUsers().pipe(
      tap(users => console.log('📋 All users fetched:', users)),
      map((allUsers: AnyUser[]) => {
        // Detailed logging for debugging
        console.log('🔍 Searching for user with email:', email);
        console.log('🔑 Password provided:', password);
        
        // Check each user individually for debugging
        allUsers.forEach((user, index) => {
          console.log(`👤 User ${index + 1}:`, {
            email: user.email,
            password: user.password,
            emailMatch: user.email === email,
            passwordMatch: user.password === password,
            isActive: user.isActive,
            role: user.role
          });
        });

        const user = allUsers.find((u) => {
          const emailMatch = u.email?.toLowerCase() === email?.toLowerCase();
          const passwordMatch = u.password === password;
          const isActive = u.isActive === undefined || u.isActive === true;
          
          console.log('🔍 Checking user:', {
            userEmail: u.email,
            emailMatch,
            passwordMatch,
            isActive,
            overallMatch: emailMatch && passwordMatch && isActive
          });
          
          return emailMatch && passwordMatch && isActive;
        });

        if (user) {
          console.log('✅ Login successful for user:', user.email);
          const token = `token_${user.id}_${Date.now()}`;
          const { password: _, ...userWithoutPassword } = user;
          return {
            success: true,
            user: userWithoutPassword as AnyUser,
            token,
            message: 'Login successful'
          };
        }

        console.log('❌ Login failed - no matching user found');
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('🚨 Login error:', error);
        return of({
          success: false,
          message: 'Network error occurred'
        });
      })
    );
  }

  register(userData: Partial<AnyUser> & { role: UserRole }): Observable<{success: boolean; user?: AnyUser; message: string}> {
    console.log('📝 Registration attempt:', userData);
    
    return this.getAllUsers().pipe(
      switchMap((allUsers: AnyUser[]) => {
        if (allUsers.some(u => u.email?.toLowerCase() === userData.email?.toLowerCase())) {
          return of({
            success: false,
            message: 'User already exists'
          });
        }

        // Generate ID based on role
        const generateId = () => {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 4);
          return `${userData.role}_${timestamp}_${random}`;
        };

        const newUser: AnyUser = {
          id: generateId(),
          ...userData,
          createdAt: new Date().toISOString(),
          isActive: true,
          ...(userData.role === 'customer' && { 
            totalPackagesSent: 0, 
            totalPackagesReceived: 0 
          }),
          ...(userData.role === 'courier' && { 
            isAvailable: true, 
            rating: 0, 
            totalDeliveries: 0 
          })
        } as AnyUser;

        let endpoint = '';
        if (userData.role === 'admin') endpoint = 'admins';
        else if (userData.role === 'customer') endpoint = 'customers';
        else if (userData.role === 'courier') endpoint = 'couriers';

        console.log('🎯 Posting to endpoint:', `${this.apiUrl}/${endpoint}`, newUser);

        return this.http.post<AnyUser>(`${this.apiUrl}/${endpoint}`, newUser).pipe(
          map((createdUser) => {
            console.log('✅ User created successfully:', createdUser);
            return {
              success: true,
              user: { ...createdUser, password: undefined },
              message: 'Registration successful'
            };
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('🚨 Registration error:', error);
            return of({
              success: false,
              message: 'Registration failed'
            });
          })
        );
      })
    );
  }

  validateToken(token: string): boolean {
    return !!token && token.startsWith('token_');
  }

  // Test connection to API
  testConnection(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/admins`).pipe(
      map(() => {
        console.log('✅ API connection successful');
        return true;
      }),
      catchError((error) => {
        console.error('🚨 API connection failed:', error);
        return of(false);
      })
    );
  }

  // Get dummy credentials for testing
  getDummyCredentials() {
    return [
      { email: 'admin@courier.com', password: 'admin123', role: 'admin' },
      { email: 'mary@gmail.com', password: 'password123', role: 'customer' },
      { email: 'james@yahoo.com', password: 'password123', role: 'customer' },
      { email: 'grace@gmail.com', password: 'password123', role: 'customer' },
      { email: 'peter@courier.com', password: 'courier123', role: 'courier' },
      { email: 'sarah@courier.com', password: 'courier123', role: 'courier' },
      { email: 'david@courier.com', password: 'courier123', role: 'courier' }
    ];
  }

  // Improved getAllUsers with better error handling
  private getAllUsers(): Observable<AnyUser[]> {
    console.log('📡 Fetching all users from API...');
    
    // Use forkJoin to make all requests in parallel
    return forkJoin({
      admins: this.http.get<Admin[]>(`${this.apiUrl}/admins`).pipe(
        catchError(error => {
          console.error('❌ Failed to fetch admins:', error);
          return of([]);
        })
      ),
      customers: this.http.get<Customer[]>(`${this.apiUrl}/customers`).pipe(
        catchError(error => {
          console.error('❌ Failed to fetch customers:', error);
          return of([]);
        })
      ),
      couriers: this.http.get<Courier[]>(`${this.apiUrl}/couriers`).pipe(
        catchError(error => {
          console.error('❌ Failed to fetch couriers:', error);
          return of([]);
        })
      )
    }).pipe(
      map(({ admins, customers, couriers }) => {
        const allUsers = [...admins, ...customers, ...couriers] as AnyUser[];
        console.log('📊 Users fetched:', {
          admins: admins.length,
          customers: customers.length,
          couriers: couriers.length,
          total: allUsers.length
        });
        return allUsers;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('🚨 Critical error fetching users:', error);
        return throwError(() => error);
      })
    );
  }
}