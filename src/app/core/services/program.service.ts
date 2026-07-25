import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssignProgramRequest,
  AssignProgramResponse,
  CreateProgramRequest,
  Program,
} from '../models/program.model';

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly baseUrl = `${environment.apiUrl}/programs`;

  constructor(private http: HttpClient) {}

  list(): Observable<Program[]> {
    return this.http.get<Program[]>(this.baseUrl);
  }

  create(request: CreateProgramRequest): Observable<Program> {
    return this.http.post<Program>(this.baseUrl, request);
  }

  update(programId: number, request: CreateProgramRequest): Observable<Program> {
    return this.http.put<Program>(`${this.baseUrl}/${programId}`, request);
  }

  delete(programId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${programId}`);
  }

  assign(programId: number, request: AssignProgramRequest): Observable<AssignProgramResponse> {
    return this.http.post<AssignProgramResponse>(`${this.baseUrl}/${programId}/assign`, request);
  }

  /** Renvoie la version actuelle du programme à tous les joueurs qui l'avaient déjà reçu. */
  resend(programId: number): Observable<AssignProgramResponse> {
    return this.http.post<AssignProgramResponse>(`${this.baseUrl}/${programId}/resend`, {});
  }
}
