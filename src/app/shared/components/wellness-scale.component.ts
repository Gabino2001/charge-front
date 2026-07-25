import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WellnessQuestion } from '../../core/models/wellness.model';

@Component({
  selector: 'app-wellness-scale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wellness-scale.component.html',
})
export class WellnessScaleComponent {
  @Input() question!: WellnessQuestion;
  @Input() value: number | null | undefined = null;
  @Output() valueChange = new EventEmitter<number>();
}
