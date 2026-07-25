export interface CreatePlayerRequest {
  fullName: string;
  email: string;
  password: string;
  poste?: string;
}

export interface Player {
  id: number;
  fullName: string;
  poste: string | null;
  initials: string;
  exercisesDone: number;
  exercisesTotal: number;
  wellnessSubmittedToday: boolean;
  rpeSubmittedToday: boolean;
  hasActiveAlerts: boolean;
  /** Ratio de charge aiguë (7j) / chronique (28j) — indicateur de risque de blessure lié à la charge. */
  acwrRatio: number | null;
  acwrZone: 'LOW' | 'OPTIMAL' | 'ELEVATED' | 'HIGH_RISK' | 'INSUFFICIENT_DATA';
}
