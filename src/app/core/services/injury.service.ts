import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateInjuryRequest, Injury, UpdateInjuryRequest } from '../models/injury.model';

@Injectable({ providedIn: 'root' })
export class InjuryService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  listForPlayer(playerId: number): Observable<Injury[]> {
    return this.http.get<Injury[]>(`${this.baseUrl}/players/${playerId}/injuries`);
  }

  create(playerId: number, request: CreateInjuryRequest): Observable<Injury> {
    return this.http.post<Injury>(`${this.baseUrl}/players/${playerId}/injuries`, request);
  }

  update(injuryId: number, request: UpdateInjuryRequest): Observable<Injury> {
    return this.http.patch<Injury>(`${this.baseUrl}/injuries/${injuryId}`, request);
  }
}
