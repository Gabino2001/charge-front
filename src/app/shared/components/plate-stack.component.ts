import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getPlates, PlateBlock } from '../utils/plates.util';

@Component({
  selector: 'app-plate-stack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plate-stack.component.html',
})
export class PlateStackComponent {
  private weightSignal = signal(0);

  @Input() set weight(value: number) {
    this.weightSignal.set(value ?? 0);
  }
  get weight(): number {
    return this.weightSignal();
  }

  plates = computed<PlateBlock[]>(() => getPlates(this.weightSignal()));
}
