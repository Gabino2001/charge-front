import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Petit badge coloré affichant la zone de risque ACWR (charge aiguë/chronique) d'un joueur. */
@Component({
  selector: 'app-acwr-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      *ngIf="zone && zone !== 'INSUFFICIENT_DATA'"
      class="text-[10px] px-2 py-0.5 rounded-full font-display tracking-wide shrink-0"
      [ngClass]="classesFor(zone)"
      [title]="labelFor(zone) + (ratio != null ? ' — ratio ' + ratio : '')"
    >
      {{ ratio != null ? (ratio | number: '1.1-1') : '—' }} · {{ labelFor(zone) }}
    </span>
  `,
})
export class AcwrBadgeComponent {
  @Input() ratio: number | null = null;
  @Input() zone: 'LOW' | 'OPTIMAL' | 'ELEVATED' | 'HIGH_RISK' | 'INSUFFICIENT_DATA' | null = null;

  labelFor(zone: string): string {
    switch (zone) {
      case 'LOW': return 'sous-charge';
      case 'OPTIMAL': return 'charge optimale';
      case 'ELEVATED': return 'à surveiller';
      case 'HIGH_RISK': return 'risque élevé';
      default: return '—';
    }
  }

  classesFor(zone: string): string {
    switch (zone) {
      case 'LOW': return 'bg-plate-blue/20 text-plate-blue';
      case 'OPTIMAL': return 'bg-plate-green/20 text-plate-green';
      case 'ELEVATED': return 'bg-plate-yellow/20 text-plate-yellow';
      case 'HIGH_RISK': return 'bg-plate-red/20 text-plate-red';
      default: return 'bg-surface-alt text-steel';
    }
  }
}
