export interface SubmitRpeRequest {
  rpe: number;
  durationMinutes?: number | null;
  comment?: string | null;
}

export interface RpeResponse {
  id: number;
  entryDate: string;
  rpe: number;
  durationMinutes: number | null;
  trainingLoad: number | null;
  comment: string | null;
}

export interface RpeStatus {
  submittedToday: boolean;
  today: RpeResponse | null;
}

/** Échelle de Borg CR10 : 0 = repos total, 10 = effort maximal. */
export const RPE_LABELS: Record<number, string> = {
  0: 'Repos',
  1: 'Très très facile',
  2: 'Facile',
  3: 'Modéré',
  4: 'Un peu dur',
  5: 'Dur',
  6: 'Dur',
  7: 'Très dur',
  8: 'Très dur',
  9: 'Très très dur',
  10: 'Maximal',
};
