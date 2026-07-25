import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RMEntry } from '../../core/models/fiche.model';

@Component({
  selector: 'app-rm-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rm-chips.component.html',
})
export class RmChipsComponent {
  @Input() rmTable: RMEntry[] = [];
}
