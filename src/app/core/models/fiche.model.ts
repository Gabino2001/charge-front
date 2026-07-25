export interface CreateFicheEntryRequest {
  exerciseName: string;
  weight: number;
  reps: number;
}

export interface UpdateFicheEntryRequest {
  weight: number;
  reps: number;
}

/** Une ligne du tableau de charges : palier de %RM -> poids correspondant. */
export interface RMEntry {
  percentage: number;
  weight: number;
}

export interface FicheEntry {
  id: number;
  exerciseName: string;
  weight: number;
  reps: number;
  oneRepMax: number;
  rmTable: RMEntry[];
  /** Date du dernier test (création ou correction de la ligne). */
  testedAt: string;
}
