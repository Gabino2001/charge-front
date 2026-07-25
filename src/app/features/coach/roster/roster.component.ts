import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PlayerService } from '../../../core/services/player.service';
import { Player } from '../../../core/models/player.model';
import { ToastService } from '../../../core/services/toast.service';
import { AcwrBadgeComponent } from '../../../shared/components/acwr-badge.component';

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AcwrBadgeComponent],
  templateUrl: './roster.component.html',
})
export class RosterComponent implements OnInit {
  private playerService = inject(PlayerService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  authService = inject(AuthService);
  private router = inject(Router);

  players = signal<Player[]>([]);
  loading = signal(true);
  saving = signal(false);
  showAddForm = signal(false);
  pendingDeleteId = signal<number | null>(null);
  deleting = signal(false);

  /** Vue cartes (par défaut, met en avant les priorités du jour) ou tableau de comparaison triable. */
  viewMode = signal<'cards' | 'table'>('cards');
  sortColumn = signal<'fullName' | 'acwrRatio' | 'exercisesDone' | 'wellnessSubmittedToday'>('fullName');
  sortDirection = signal<1 | -1>(1);

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    poste: [''],
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.playerService.list().subscribe({
      next: (players) => {
        this.players.set(players);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Trie l'effectif pour faire remonter en premier les joueurs qui ont besoin d'attention aujourd'hui. */
  sortedPlayers(): Player[] {
    return [...this.players()].sort((a, b) => this.priority(b) - this.priority(a));
  }

  private priority(p: Player): number {
    let score = 0;
    if (p.hasActiveAlerts) score += 8;
    if (p.acwrZone === 'HIGH_RISK') score += 6;
    if (p.acwrZone === 'ELEVATED') score += 3;
    if (!p.wellnessSubmittedToday) score += 2;
    return score;
  }

  playersWithAlerts(): number {
    return this.players().filter((p) => p.hasActiveAlerts).length;
  }

  playersMissingWellness(): number {
    return this.players().filter((p) => !p.wellnessSubmittedToday).length;
  }

  /** Vue tableau : tri par colonne, cliquable pour inverser le sens. */
  setSortColumn(column: 'fullName' | 'acwrRatio' | 'exercisesDone' | 'wellnessSubmittedToday'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 1 ? -1 : 1);
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(1);
    }
  }

  tablePlayers(): Player[] {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    return [...this.players()].sort((a, b) => {
      let cmp = 0;
      if (col === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
      else if (col === 'acwrRatio') cmp = (a.acwrRatio ?? -1) - (b.acwrRatio ?? -1);
      else if (col === 'exercisesDone') {
        const ratioA = a.exercisesTotal ? a.exercisesDone / a.exercisesTotal : -1;
        const ratioB = b.exercisesTotal ? b.exercisesDone / b.exercisesTotal : -1;
        cmp = ratioA - ratioB;
      } else if (col === 'wellnessSubmittedToday') cmp = Number(a.wellnessSubmittedToday) - Number(b.wellnessSubmittedToday);
      return cmp * dir;
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.playerService.create(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAddForm.set(false);
        this.form.reset();
        this.toast.show('Joueur ajouté ✓');
        this.refresh();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(playerId: number): void {
    this.deleting.set(true);
    this.playerService.delete(playerId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDeleteId.set(null);
        this.players.set(this.players().filter((p) => p.id !== playerId));
        this.toast.show('Joueur supprimé');
      },
      error: () => {
        this.deleting.set(false);
        this.toast.show("Impossible de supprimer ce joueur");
      },
    });
  }
}
