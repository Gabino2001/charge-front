export type TrainingSessionStatus = 'IN_PROGRESS' | 'COMPLETED';

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
