import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcwrHistoryPoint } from '../../core/models/training-session.model';

/**
 * Courbe d'évolution du ratio ACWR (charge aiguë/chronique) avec des bandes de couleur
 * représentant les zones de risque — pensée pour qu'un coach comprenne l'état du joueur
 * en un coup d'œil, sans avoir à interpréter des chiffres bruts.
 *
 * Zones (de bas en haut) :
 *  - Bleu   : < 0.8   → sous-charge (désentraînement)
 *  - Vert   : 0.8–1.3 → zone optimale
 *  - Jaune  : 1.3–1.5 → à surveiller
 *  - Rouge  : > 1.5   → risque élevé de blessure
 */
@Component({
  selector: 'app-acwr-trend-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acwr-trend-chart.component.html',
})
export class AcwrTrendChartComponent {
  private pointsSignal = signal<AcwrHistoryPoint[]>([]);

  @Input() emptyLabel = 'Pas encore assez de données pour calculer la charge.';

  @Input() set points(value: AcwrHistoryPoint[]) {
    this.pointsSignal.set(value ?? []);
  }
  get points(): AcwrHistoryPoint[] {
    return this.pointsSignal();
  }

  readonly width = 300;
  readonly height = 140;
  private readonly padding = 6;

  // Échelle fixe de 0 à 2.0 : au-delà, on considère que c'est déjà largement en zone rouge.
  private readonly scaleMax = 2.0;

  private yFor(ratio: number): number {
    const usableHeight = this.height - this.padding * 2;
    const clamped = Math.min(ratio, this.scaleMax);
    const y = this.height - this.padding - (clamped / this.scaleMax) * usableHeight;
    return y;
  }

  /** Position Y (haut du rectangle) et hauteur de chaque bande de couleur, précalculées une fois. */
  readonly bands = [
    { from: 1.5, to: this.scaleMax, color: '#E5484D', opacity: 0.16 }, // rouge — risque élevé
    { from: 1.3, to: 1.5, color: '#E8B93B', opacity: 0.16 }, // jaune — à surveiller
    { from: 0.8, to: 1.3, color: '#4C9A6A', opacity: 0.16 }, // vert — optimal
    { from: 0, to: 0.8, color: '#3E7CB1', opacity: 0.16 }, // bleu — sous-charge
  ].map((b) => {
    const yTop = this.yFor(b.to);
    const yBottom = this.yFor(b.from);
    return { ...b, y: yTop, height: yBottom - yTop };
  });

  /** Les points valides (ratio non-null) uniquement, pour tracer la ligne. */
  private validPoints = computed(() =>
    this.pointsSignal()
      .map((p, i) => ({ ...p, index: i }))
      .filter((p) => p.ratio !== null)
  );

  hasData = computed(() => this.validPoints().length > 0);

  polylinePoints = computed<string>(() => {
    const all = this.pointsSignal();
    const valid = this.validPoints();
    if (valid.length === 0 || all.length < 2) return '';
    const usableWidth = this.width - this.padding * 2;
    const step = usableWidth / (all.length - 1);

    return valid
      .map((p) => {
        const x = this.padding + p.index * step;
        const y = this.yFor(p.ratio!);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  lastValid = computed(() => {
    const valid = this.validPoints();
    return valid.length > 0 ? valid[valid.length - 1] : null;
  });

  lastPointCoords = computed<{ x: number; y: number } | null>(() => {
    const all = this.pointsSignal();
    const last = this.lastValid();
    if (!last || all.length < 2) return null;
    const usableWidth = this.width - this.padding * 2;
    const step = usableWidth / (all.length - 1);
    const x = this.padding + last.index * step;
    const y = this.yFor(last.ratio!);
    return { x, y };
  });

  viewBox = `0 0 ${this.width} ${this.height}`;

  labelFor(zone: string): string {
    switch (zone) {
      case 'LOW': return 'sous-charge';
      case 'OPTIMAL': return 'charge optimale';
      case 'ELEVATED': return 'à surveiller';
      case 'HIGH_RISK': return 'risque élevé';
      default: return '—';
    }
  }

  colorFor(zone: string): string {
    switch (zone) {
      case 'LOW': return '#3E7CB1';
      case 'OPTIMAL': return '#4C9A6A';
      case 'ELEVATED': return '#E8B93B';
      case 'HIGH_RISK': return '#E5484D';
      default: return '#8A8F98';
    }
  }
}
