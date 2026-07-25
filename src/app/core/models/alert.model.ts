export interface PlayerAlert {
  type: 'FATIGUE' | 'DOULEUR' | string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
}
