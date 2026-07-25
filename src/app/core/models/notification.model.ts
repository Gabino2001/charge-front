export interface Notification {
  id: number;
  message: string;
  read: boolean;
  relatedExerciseId: number | null;
  createdAt: string;
}
