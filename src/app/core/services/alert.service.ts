import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlayerAlert } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly baseUrl = `${environment.apiUrl}/players`;

  constructor(private http: HttpClient) {}

  forPlayer(playerId: number): Observable<PlayerAlert[]> {
    return this.http.get<PlayerAlert[]>(`${this.baseUrl}/${playerId}/alerts`);
  }
}
