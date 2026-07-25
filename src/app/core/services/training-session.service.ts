import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitSessionRpeRequest, TrainingSession } from '../models/training-session.model';

@Injectable({ providedIn: 'root' })
export class TrainingSessionService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** Côté joueur : les séances d'aujourd'hui (il peut y en avoir plusieurs). */
  today(): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.baseUrl}/sessions/mine/today`);
  }

  /** Côté joueur : l'historique complet de ses séances passées. */
  mine(): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.baseUrl}/sessions/mine`);
  }

  submitRpe(sessionId: number, request: SubmitSessionRpeRequest): Observable<TrainingSession> {
    return this.http.post<TrainingSession>(`${this.baseUrl}/sessions/${sessionId}/rpe`, request);
  }

  /** Corrige le ressenti déjà envoyé pour cette séance (erreur de saisie). */
  updateRpe(sessionId: number, request: SubmitSessionRpeRequest): Observable<TrainingSession> {
    return this.http.put<TrainingSession>(`${this.baseUrl}/sessions/${sessionId}/rpe`, request);
  }

  /** Côté préparateur : historique des séances d'un joueur de l'effectif (courbes de charge). */
  historyForPlayer(playerId: number): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.baseUrl}/players/${playerId}/sessions`);
  }
}
