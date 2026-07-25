import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RPE_LABELS } from '../../core/models/rpe.model';

@Component({
  selector: 'app-rpe-scale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rpe-scale.component.html',
})
export class RpeScaleComponent {
  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number>();

  levels = Array.from({ length: 11 }, (_, i) => i); // 0 à 10

  labelFor(n: number): string {
    return RPE_LABELS[n] ?? '';
  }
}
