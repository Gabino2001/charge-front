export type SessionType = 'ATELIER' | 'SUPERSET';

export interface ProgramExerciseRequest {
  title: string;
  sets?: number | null;
  reps?: string | null;
  /** Tempo d'exécution au format 4 temps (ex. "3-1-1-0", "4-0-X-0"). */
  tempo?: string | null;
  /** Charge de travail en kilogrammes (ex. 60 pour 60 kg). */
  loadKg?: number | null;
  videoUrl?: string | null;
  /** Temps de récupération (en secondes) après cet exercice, donné par le coach (surtout en mode ATELIER). */
  recoveryTimeSeconds?: number | null;
  /** Pourcentage du 1RM auquel le joueur doit travailler (ex. 75 pour 75%). */
  percentRm?: number | null;
}

export interface ProgramExercise {
  id: number;
  title: string;
  sets: number | null;
  reps: string | null;
  tempo: string | null;
  loadKg: number | null;
  videoUrl: string | null;
  recoveryTimeSeconds: number | null;
  percentRm: number | null;
}

/** Un bloc ("atelier") : les exercices qu'on enchaîne ensemble avant de récupérer. */
export interface ProgramBlockRequest {
  /** Temps de récupération (en secondes) une fois le bloc terminé, avant de reprendre un tour. */
  recoveryTimeSeconds?: number | null;
  exercises: ProgramExerciseRequest[];
}

export interface ProgramBlock {
  id: number;
  recoveryTimeSeconds: number | null;
  exercises: ProgramExercise[];
}

export interface CreateProgramRequest {
  name: string;
  description?: string | null;
  /** Type de séance du jour choisi par le coach : atelier ou super set. */
  sessionType: SessionType;
  /** Les ateliers (blocs) de la séance ; le coach peut en créer autant qu'il veut. */
  blocks: ProgramBlockRequest[];
}

export interface Program {
  id: number;
  name: string;
  description: string | null;
  sessionType: SessionType;
  blocks: ProgramBlock[];
}

export interface AssignProgramRequest {
  playerIds: number[];
}

export interface AssignProgramResponse {
  playersCount: number;
  exercisesCreatedPerPlayer: number;
}
