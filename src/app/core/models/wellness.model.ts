export interface SubmitWellnessRequest {
  mood: number;
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  painLocation?: string | null;
}

export interface WellnessResponse {
  id: number;
  entryDate: string;
  mood: number;
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  painLocation: string | null;
}

export interface WellnessStatus {
  submittedToday: boolean;
  today: WellnessResponse | null;
}

export interface WellnessQuestion {
  id: 'mood' | 'sleep' | 'fatigue' | 'soreness' | 'stress';
  label: string;
  low: string;
  high: string;
}

export const WELLNESS_QUESTIONS: WellnessQuestion[] = [
  { id: 'mood', label: "Comment te sens-tu aujourd'hui ?", low: 'Pas top', high: 'Excellent' },
  { id: 'sleep', label: 'As-tu bien dormi cette nuit ?', low: 'Mauvaise nuit', high: 'Très bien dormi' },
  { id: 'fatigue', label: 'Ton niveau de fatigue ?', low: 'Épuisé', high: "Plein d'énergie" },
  { id: 'soreness', label: 'As-tu mal quelque part ?', low: 'Beaucoup mal', high: 'Aucune douleur' },
  { id: 'stress', label: 'Ton niveau de stress ?', low: 'Très stressé', high: 'Détendu' },
];
