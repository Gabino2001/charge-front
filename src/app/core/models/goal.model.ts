export interface CreateGoalRequest {
  exerciseName: string;
  targetOneRepMax: number;
  targetDate?: string | null;
}

export interface Goal {
  id: number;
  exerciseName: string;
  targetOneRepMax: number;
  targetDate: string | null;
  currentOneRepMax: number | null;
  progressPercent: number | null;
  achieved: boolean;
}
