import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePlayerRequest, Player } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly baseUrl = `${environment.apiUrl}/players`;

  constructor(private http: HttpClient) {}

  list(): Observable<Player[]> {
    return this.http.get<Player[]>(this.baseUrl);
  }

  get(playerId: number): Observable<Player> {
    return this.http.get<Player>(`${this.baseUrl}/${playerId}`);
  }

  create(request: CreatePlayerRequest): Observable<Player> {
    return this.http.post<Player>(this.baseUrl, request);
  }

  delete(playerId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${playerId}`);
  }
}
