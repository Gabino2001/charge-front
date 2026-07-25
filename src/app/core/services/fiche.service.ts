import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateFicheEntryRequest, FicheEntry, UpdateFicheEntryRequest } from '../models/fiche.model';
import { TrendPoint } from '../models/trend.model';

@Injectable({ providedIn: 'root' })
export class FicheService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** Côté préparateur : fiche d'un joueur de l'effectif (1RM et tableau de charges par palier de %RM calculés côté serveur). */
  listForPlayer(playerId: number): Observable<FicheEntry[]> {
    return this.http.get<FicheEntry[]>(`${this.baseUrl}/players/${playerId}/fiche`);
  }

  addEntry(playerId: number, request: CreateFicheEntryRequest): Observable<FicheEntry> {
    return this.http.post<FicheEntry>(`${this.baseUrl}/players/${playerId}/fiche`, request);
  }

  updateEntry(entryId: number, request: UpdateFicheEntryRequest): Observable<FicheEntry> {
    return this.http.put<FicheEntry>(`${this.baseUrl}/fiche/${entryId}`, request);
  }

  /** Historique du 1RM pour un exercice donné (graphique de progression). */
  history(playerId: number, exerciseName: string): Observable<TrendPoint[]> {
    return this.http.get<TrendPoint[]>(`${this.baseUrl}/players/${playerId}/fiche/history`, {
      params: { exerciseName },
    });
  }

  /** Côté joueur : ma fiche. */
  listMine(): Observable<FicheEntry[]> {
    return this.http.get<FicheEntry[]>(`${this.baseUrl}/fiche/mine`);
  }
}
