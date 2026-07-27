export type TrainingSessionStatus = 'IN_PROGRESS' | 'COMPLETED';

export type AcwrZone = 'LOW' | 'OPTIMAL' | 'ELEVATED' | 'HIGH_RISK' | 'INSUFFICIENT_DATA';

/** Un point de la courbe d'évolution ACWR : le ratio calculé pour un jour donné. */
export interface AcwrHistoryPoint {
  date: string;
  ratio: number | null;
  zone: AcwrZone;
}

export interface TrainingSession {
  id: number;
  sessionDate: string;
  sessionNumber: number;
  status: TrainingSessionStatus;
  rpe: number | null;
  durationMinutes: number | null;
  trainingLoad: number | null;
  comment: string | null;
  completedAt: string | null;
}

/** Le joueur note son ressenti global (0 à 10) une fois toute la séance terminée. */
export interface SubmitSessionRpeRequest {
  rpe: number;
  durationMinutes?: number | null;
  comment?: string | null;
}
