export interface PlateBlock {
  size: number;
  colorClass: string;
}

const BAR_WEIGHT = 20;
const DENOMINATIONS = [25, 20, 15, 10, 5, 2.5, 1.25];

const COLOR_CLASS: Record<number, string> = {
  25: 'bg-plate-red',
  20: 'bg-plate-blue',
  15: 'bg-plate-yellow',
  10: 'bg-plate-green',
  5: 'bg-chalk',
  2.5: 'bg-steel',
  1.25: 'bg-steel',
};

/** Décompose la charge totale (barre incluse) en plaques par côté, pour l'affichage. */
export function getPlates(totalWeight: number): PlateBlock[] {
  let perSide = Math.max(0, (totalWeight - BAR_WEIGHT) / 2);
  const plates: PlateBlock[] = [];
  for (const size of DENOMINATIONS) {
    while (perSide >= size - 0.01 && plates.length < 10) {
      plates.push({ size, colorClass: COLOR_CLASS[size] });
      perSide -= size;
    }
  }
  return plates;
}
