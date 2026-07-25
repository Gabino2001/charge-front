import { SessionType } from './program.model';

export interface CreateExerciseRequest {
  title: string;
  sets?: number | null;
  reps?: string | null;
  videoUrl?: string | null;
  scheduledFor?: string | null;
  /** Temps de récupération (en secondes) après cet exercice, donné par le coach. */
  recoveryTimeSeconds?: number | null;
  /** Type de séance du jour : atelier ou super set (optionnel pour un exercice isolé). */
  sessionType?: SessionType | null;
  /** Numéro de l'atelier (bloc) auquel appartient cet exercice (optionnel pour un exercice isolé). */
  blockIndex?: number | null;
  /** Temps de récupération (en secondes) une fois l'atelier terminé. */
  blockRecoveryTimeSeconds?: number | null;
  /** Pourcentage du 1RM auquel le joueur doit travailler (ex. 75 pour 75%). */
  percentRm?: number | null;
}

export interface UpdateExerciseRequest {
  title: string;
  sets?: number | null;
  reps?: string | null;
  videoUrl?: string | null;
  scheduledFor?: string | null;
  recoveryTimeSeconds?: number | null;
  sessionType?: SessionType | null;
  blockIndex?: number | null;
  blockRecoveryTimeSeconds?: number | null;
  percentRm?: number | null;
}

export interface Exercise {
  id: number;
  title: string;
  sets: number | null;
  reps: string | null;
  videoUrl: string | null;
  scheduledFor: string;
  done: boolean;
  playerId: number;
  createdAt: string;
  completedAt: string | null;
  recoveryTimeSeconds: number | null;
  sessionType: SessionType | null;
  blockIndex: number | null;
  blockRecoveryTimeSeconds: number | null;
  exerciseRpe: number | null;
  /** Séance d'entraînement à laquelle appartient cet exercice (un joueur peut avoir plusieurs séances/jour). */
  sessionId: number | null;
  sessionNumber: number | null;
  /** Pourcentage du 1RM auquel le joueur doit travailler cet exercice. */
  percentRm: number | null;
  /** Ressenti du joueur sur la charge donnée : TOO_HEAVY, PERFECT ou TOO_LIGHT. */
  loadFeedback: LoadFeedback | null;
  /** Commentaire libre du joueur sur la charge (ex. "je pouvais encore faire 2 à 3 répétitions de plus"). */
  loadComment: string | null;
  /** Ordre d'affichage au sein de l'atelier (modifiable par le coach). */
  orderIndex: number | null;
}

export type LoadFeedback = 'TOO_HEAVY' | 'PERFECT' | 'TOO_LIGHT';

export const LOAD_FEEDBACK_LABELS: Record<LoadFeedback, string> = {
  TOO_HEAVY: 'Trop lourd',
  PERFECT: 'Charge parfaite',
  TOO_LIGHT: 'Trop léger',
};

/** Le joueur note son ressenti (0 à 10) et, en option, son ressenti sur la charge juste après un exercice précis. */
export interface SubmitExerciseRpeRequest {
  rpe: number;
  loadFeedback?: LoadFeedback | null;
  loadComment?: string | null;
}
