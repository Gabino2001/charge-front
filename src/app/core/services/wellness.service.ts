import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitWellnessRequest, WellnessResponse, WellnessStatus } from '../models/wellness.model';

@Injectable({ providedIn: 'root' })
export class WellnessService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** Côté joueur : statut du questionnaire du jour (utilisé pour bloquer l'accès aux exercices). */
  todayStatus(): Observable<WellnessStatus> {
    return this.http.get<WellnessStatus>(`${this.baseUrl}/wellness/today`);
  }

  submit(request: SubmitWellnessRequest): Observable<WellnessResponse> {
    return this.http.post<WellnessResponse>(`${this.baseUrl}/wellness`, request);
  }

  /** Côté préparateur : historique de bien-être d'un joueur de l'effectif. */
  historyForPlayer(playerId: number): Observable<WellnessResponse[]> {
    return this.http.get<WellnessResponse[]>(`${this.baseUrl}/players/${playerId}/wellness`);
  }
}
