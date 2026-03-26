import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, RpgSystem } from '../types';

@Injectable({ providedIn: 'root' })
export class RpgSystemService {
  private readonly API_URL = `${environment.apiUrl}/rpg-systems`;

  constructor(private http: HttpClient) {}

  getSystems(): Observable<ApiResponse<RpgSystem[]>> {
    return this.http.get<ApiResponse<RpgSystem[]>>(this.API_URL);
  }

  getSystemBySlug(slug: string): Observable<ApiResponse<RpgSystem>> {
    return this.http.get<ApiResponse<RpgSystem>>(`${this.API_URL}/${slug}`);
  }
}
