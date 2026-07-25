import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrendPoint } from '../../core/models/trend.model';

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trend-chart.component.html',
})
export class TrendChartComponent {
  private pointsSignal = signal<TrendPoint[]>([]);
  private minSignal = signal<number | null>(null);
  private maxSignal = signal<number | null>(null);

  @Input() color = '#3E7CB1';
  @Input() emptyLabel = 'Pas encore de données.';

  @Input() set points(value: TrendPoint[]) {
    this.pointsSignal.set(value ?? []);
  }
  get points(): TrendPoint[] {
    return this.pointsSignal();
  }

  @Input() set min(value: number | null) {
    this.minSignal.set(value);
  }
  @Input() set max(value: number | null) {
    this.maxSignal.set(value);
  }

  private readonly width = 280;
  private readonly height = 80;
  private readonly padding = 8;

  private range = computed<{ lo: number; hi: number }>(() => {
    const values = this.pointsSignal().map((p) => p.value);
    const lo = this.minSignal() ?? Math.min(...values);
    const hi = this.maxSignal() ?? Math.max(...values);
    return { lo, hi: hi === lo ? lo + 1 : hi };
  });

  polylinePoints = computed<string>(() => {
    const pts = this.pointsSignal();
    if (pts.length === 0) return '';
    const { lo, hi } = this.range();
    const usableWidth = this.width - this.padding * 2;
    const usableHeight = this.height - this.padding * 2;
    const step = pts.length > 1 ? usableWidth / (pts.length - 1) : 0;

    return pts
      .map((p, i) => {
        const x = this.padding + i * step;
        const ratio = (p.value - lo) / (hi - lo);
        const y = this.height - this.padding - ratio * usableHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  lastPoint = computed<{ x: number; y: number } | null>(() => {
    const pts = this.pointsSignal();
    if (pts.length === 0) return null;
    const coords = this.polylinePoints().split(' ');
    const [x, y] = coords[coords.length - 1].split(',').map(Number);
    return { x, y };
  });

  viewBox = `0 0 ${this.width} ${this.height}`;
}
