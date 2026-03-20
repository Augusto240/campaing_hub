import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RpgSystemService {
  private readonly API_URL = `${environment.apiUrl}/rpg-systems`;

  constructor(private http: HttpClient) {}

  getSystems(): Observable<any> {
    return this.http.get<any>(this.API_URL);
  }
}

