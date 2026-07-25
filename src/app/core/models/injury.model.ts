export type InjuryStatus = 'EN_COURS' | 'RETABLI';

export interface CreateInjuryRequest {
  title: string;
  description?: string | null;
  startDate?: string | null;
}

export interface UpdateInjuryRequest {
  status: InjuryStatus;
  endDate?: string | null;
}

export interface Injury {
  id: number;
  title: string;
  description: string | null;
  status: InjuryStatus;
  startDate: string;
  endDate: string | null;
}
