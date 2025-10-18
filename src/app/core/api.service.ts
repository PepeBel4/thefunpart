import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  get<T>(path: string, options: any = {}): Observable<T> {
    const obs = this.http.get(`${this.base}${path}`, {
      withCredentials: environment.useCookieSession,
      ...(options || {}),
    });
    return obs as unknown as Observable<T>;
  }

  post<T>(path: string, body: unknown, options: any = {}): Observable<T> {
    const obs = this.http.post(`${this.base}${path}`, body, {
      withCredentials: environment.useCookieSession,
      ...(options || {}),
    });
    return obs as unknown as Observable<T>;
  }

  delete<T>(path: string, options: any = {}): Observable<T> {
    const obs = this.http.delete(`${this.base}${path}`, {
      withCredentials: environment.useCookieSession,
      ...(options || {}),
    });
    return obs as unknown as Observable<T>;
  }

  put<T>(path: string, body: unknown, options: any = {}): Observable<T> {
    const obs = this.http.put(`${this.base}${path}`, body, {
      withCredentials: environment.useCookieSession,
      ...(options || {}),
    });
    return obs as unknown as Observable<T>;
  }

  patch<T>(path: string, body: unknown, options: any = {}): Observable<T> {
    const obs = this.http.patch(`${this.base}${path}`, body, {
      withCredentials: environment.useCookieSession,
      ...(options || {}),
    });
    return obs as unknown as Observable<T>;
  }
}
