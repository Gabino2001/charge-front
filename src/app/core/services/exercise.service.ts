import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateExerciseRequest, Exercise, SubmitExerciseRpeRequest, UpdateExerciseRequest } from '../models/exercise.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** Côté préparateur : exercices d'un joueur de l'effectif. */
  listForPlayer(playerId: number): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.baseUrl}/players/${playerId}/exercises`);
  }

  /** Côté préparateur : assigner un nouvel exercice. */
  assign(playerId: number, request: CreateExerciseRequest): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.baseUrl}/players/${playerId}/exercises`, request);
  }

  /** Côté préparateur : corriger un exercice déjà envoyé. */
  update(exerciseId: number, request: UpdateExerciseRequest): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.baseUrl}/exercises/${exerciseId}`, request);
  }

  /** Côté joueur : mes exercices (428 si le bien-être du jour n'est pas rempli). */
  listMine(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.baseUrl}/exercises/mine`);
  }

  /** Côté joueur : cocher/décocher un exercice. */
  toggleComplete(exerciseId: number): Observable<Exercise> {
    return this.http.patch<Exercise>(`${this.baseUrl}/exercises/${exerciseId}/complete`, {});
  }

  /** Côté joueur : noter le ressenti (RPE) juste après un exercice précis. */
  submitRpe(exerciseId: number, request: SubmitExerciseRpeRequest): Observable<Exercise> {
    return this.http.patch<Exercise>(`${this.baseUrl}/exercises/${exerciseId}/rpe`, request);
  }

  /** Côté préparateur : supprimer un exercice de la séance. */
  delete(exerciseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/exercises/${exerciseId}`);
  }

  /** Côté préparateur : réordonner les exercices d'un atelier. */
  reorder(orderedExerciseIds: number[]): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/exercises/reorder`, { orderedExerciseIds });
  }
}
