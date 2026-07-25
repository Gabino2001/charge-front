import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateGoalRequest, Goal } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  listForPlayer(playerId: number): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.baseUrl}/players/${playerId}/goals`);
  }

  create(playerId: number, request: CreateGoalRequest): Observable<Goal> {
    return this.http.post<Goal>(`${this.baseUrl}/players/${playerId}/goals`, request);
  }

  delete(goalId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/goals/${goalId}`);
  }

  listMine(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.baseUrl}/goals/mine`);
  }
}
