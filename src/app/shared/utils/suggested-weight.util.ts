import { FicheEntry } from '../../core/models/fiche.model';

/**
 * Calcule le poids suggéré pour un exercice à partir de son %RM et du 1RM connu du joueur pour
 * cet exercice (recherché par nom, insensible à la casse/aux espaces). Arrondi au 2.5 kg le plus proche
 * (le plus petit incrément courant de disques), retourne null si aucune correspondance n'est trouvée.
 */
export function suggestedWeightFor(exerciseTitle: string, percentRm: number | null | undefined, fiche: FicheEntry[]): number | null {
  if (!percentRm) return null;
  const match = findFicheMatch(exerciseTitle, fiche);
  if (!match) return null;
  const raw = (match.oneRepMax * percentRm) / 100;
  return Math.round(raw / 2.5) * 2.5;
}

function findFicheMatch(exerciseTitle: string, fiche: FicheEntry[]): FicheEntry | null {
  const normalize = (s: string) => s.trim().toLowerCase();
  const target = normalize(exerciseTitle);
  const exact = fiche.find((f) => normalize(f.exerciseName) === target);
  if (exact) return exact;
  // Correspondance partielle (ex. "Squat" trouve "Squat arrière")
  const partial = fiche.find((f) => normalize(f.exerciseName).includes(target) || target.includes(normalize(f.exerciseName)));
  return partial ?? null;
}
