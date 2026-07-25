import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlayerService } from '../../../core/services/player.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { FicheService } from '../../../core/services/fiche.service';
import { WellnessService } from '../../../core/services/wellness.service';
import { TrainingSessionService } from '../../../core/services/training-session.service';
import { AlertService } from '../../../core/services/alert.service';
import { InjuryService } from '../../../core/services/injury.service';
import { GoalService } from '../../../core/services/goal.service';
import { ToastService } from '../../../core/services/toast.service';
import { Player } from '../../../core/models/player.model';
import { Exercise, LOAD_FEEDBACK_LABELS } from '../../../core/models/exercise.model';
import { FicheEntry } from '../../../core/models/fiche.model';
import { WellnessResponse } from '../../../core/models/wellness.model';
import { RpeResponse } from '../../../core/models/rpe.model';
import { PlayerAlert } from '../../../core/models/alert.model';
import { TrendPoint } from '../../../core/models/trend.model';
import { Injury, InjuryStatus } from '../../../core/models/injury.model';
import { Goal } from '../../../core/models/goal.model';
import { PlateStackComponent } from '../../../shared/components/plate-stack.component';
import { RmChipsComponent } from '../../../shared/components/rm-chips.component';
import { TrendChartComponent } from '../../../shared/components/trend-chart.component';
import { suggestedWeightFor } from '../../../shared/utils/suggested-weight.util';
import { AcwrBadgeComponent } from '../../../shared/components/acwr-badge.component';
import { exportPlayerReportPdf } from '../../../shared/utils/pdf-report.util';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, PlateStackComponent, RmChipsComponent, TrendChartComponent, AcwrBadgeComponent],
  templateUrl: './player-detail.component.html',
})
export class PlayerDetailComponent implements OnInit {
  loadFeedbackLabels = LOAD_FEEDBACK_LABELS;
  /** Onglet affiché : tendance (bien-être/RPE/blessures/objectifs/courbes), fiche RM, ou exercices. */
  activeTab = signal<'trend' | 'fiche' | 'exercises'>('trend');
  private route = inject(ActivatedRoute);
  private playerService = inject(PlayerService);
  private exerciseService = inject(ExerciseService);
  private ficheService = inject(FicheService);
  private wellnessService = inject(WellnessService);
  private sessionService = inject(TrainingSessionService);
  private alertService = inject(AlertService);
  private injuryService = inject(InjuryService);
  private goalService = inject(GoalService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  playerId = Number(this.route.snapshot.paramMap.get('id'));

  player = signal<Player | null>(null);
  exercises = signal<Exercise[]>([]);
  fiche = signal<FicheEntry[]>([]);
  todayWellness = signal<WellnessResponse | null>(null);
  wellnessHistory = signal<WellnessResponse[]>([]);
  todayRpe = signal<RpeResponse | null>(null);
  rpeHistory = signal<RpeResponse[]>([]);
  alerts = signal<PlayerAlert[]>([]);
  injuries = signal<Injury[]>([]);
  goals = signal<Goal[]>([]);

  wellnessTrend = signal<TrendPoint[]>([]);
  rpeTrend = signal<TrendPoint[]>([]);
  oneRmTrend = signal<TrendPoint[]>([]);
  selectedExercise = signal<string | null>(null);

  editingExerciseId = signal<number | null>(null);
  editingFicheId = signal<number | null>(null);

  exerciseForm = this.fb.group({
    title: ['', Validators.required],
    sets: [null as number | null],
    reps: [''],
    videoUrl: [''],
    scheduledFor: [''],
    recoveryTimeSeconds: [null as number | null],
    sessionType: ['ATELIER' as 'ATELIER' | 'SUPERSET'],
    blockIndex: [null as number | null],
    blockRecoveryTimeSeconds: [null as number | null],
    percentRm: [null as number | null],
  });

  editExerciseForm = this.fb.group({
    title: ['', Validators.required],
    sets: [null as number | null],
    reps: [''],
    videoUrl: [''],
    scheduledFor: [''],
    recoveryTimeSeconds: [null as number | null],
    sessionType: ['ATELIER' as 'ATELIER' | 'SUPERSET'],
    blockIndex: [null as number | null],
    blockRecoveryTimeSeconds: [null as number | null],
    percentRm: [null as number | null],
  });

  ficheForm = this.fb.group({
    exerciseName: ['', Validators.required],
    weight: [null as number | null, [Validators.required, Validators.min(1)]],
    reps: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  /** Depuis le ressenti d'un exercice (trop lourd/léger), ouvre l'onglet Fiche RM pré-rempli pour ajuster le 1RM. */
  suggestFicheUpdate(ex: Exercise): void {
    this.activeTab.set('fiche');
    this.ficheForm.patchValue({ exerciseName: ex.title, weight: null, reps: null });
  }

  editFicheForm = this.fb.group({
    weight: [null as number | null, [Validators.required, Validators.min(1)]],
    reps: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  showInjuryForm = signal(false);
  injuryForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    startDate: [''],
  });

  showGoalForm = signal(false);
  goalForm = this.fb.group({
    exerciseName: ['', Validators.required],
    targetOneRepMax: [null as number | null, [Validators.required, Validators.min(1)]],
    targetDate: [''],
  });

  ngOnInit(): void {
    this.playerService.get(this.playerId).subscribe((p) => this.player.set(p));
    this.refreshExercises();
    this.refreshFiche();
    this.refreshWellness();
    this.refreshRpe();
    this.refreshAlerts();
    this.refreshInjuries();
    this.refreshGoals();
  }

  // ---- Chargement ----

  refreshAlerts(): void {
    this.alertService.forPlayer(this.playerId).subscribe((alerts) => this.alerts.set(alerts));
  }

  /**
   * Source les courbes/carte de RPE depuis les séances d'entraînement (une séance peut avoir son propre RPE,
   * un joueur pouvant avoir plusieurs séances le même jour). Reformaté en RpeResponse pour rester compatible
   * avec l'export PDF existant.
   */
  refreshRpe(): void {
    this.sessionService.historyForPlayer(this.playerId).subscribe((sessions) => {
      const completed = sessions.filter((s) => s.rpe !== null);
      const mapped: RpeResponse[] = completed.map((s) => ({
        id: s.id,
        entryDate: s.sessionNumber > 1 ? `${s.sessionDate} (séance ${s.sessionNumber})` : s.sessionDate,
        rpe: s.rpe!,
        durationMinutes: s.durationMinutes,
        trainingLoad: s.trainingLoad,
        comment: s.comment,
      }));
      this.rpeHistory.set(mapped);
      const today = new Date().toISOString().slice(0, 10);
      this.todayRpe.set(mapped.find((r) => r.entryDate.startsWith(today)) ?? null);
      this.rpeTrend.set([...mapped].reverse().map((r) => ({ date: r.entryDate, value: r.rpe })));
    });
  }

  refreshExercises(): void {
    this.exerciseService.listForPlayer(this.playerId).subscribe((ex) => this.exercises.set(ex));
  }

  refreshFiche(): void {
    this.ficheService.listForPlayer(this.playerId).subscribe((f) => {
      this.fiche.set(f);
      if (!this.selectedExercise() && f.length > 0) {
        this.selectExercise(f[0].exerciseName);
      }
    });
  }

  refreshWellness(): void {
    this.wellnessService.historyForPlayer(this.playerId).subscribe((history) => {
      this.wellnessHistory.set(history);
      const today = new Date().toISOString().slice(0, 10);
      this.todayWellness.set(history.find((w) => w.entryDate === today) ?? null);
      this.wellnessTrend.set(
        [...history].reverse().map((w) => ({
          date: w.entryDate,
          value: (w.mood + w.sleep + w.fatigue + w.soreness + w.stress) / 5,
        }))
      );
    });
  }

  refreshInjuries(): void {
    this.injuryService.listForPlayer(this.playerId).subscribe((injuries) => this.injuries.set(injuries));
  }

  refreshGoals(): void {
    this.goalService.listForPlayer(this.playerId).subscribe((goals) => this.goals.set(goals));
  }

  selectExercise(exerciseName: string): void {
    this.selectedExercise.set(exerciseName);
    this.ficheService.history(this.playerId, exerciseName).subscribe((points) => this.oneRmTrend.set(points));
  }

  wellnessStats(w: WellnessResponse): { label: string; value: number }[] {
    return [
      { label: 'mood', value: w.mood },
      { label: 'sleep', value: w.sleep },
      { label: 'fatigue', value: w.fatigue },
      { label: 'soreness', value: w.soreness },
      { label: 'stress', value: w.stress },
    ];
  }

  // ---- Exercices : envoi, planification, édition ----

  /** Ateliers ouverts par le coach (clic pour voir le détail des exercices), comme côté joueur. */
  openAtelierKeys = signal<Set<string>>(new Set());

  /** Regroupe les exercices par séance (date + n° de séance) puis par atelier, comme côté joueur. */
  groupedExercises(): {
    key: string;
    label: string;
    ateliers: { key: string; label: string; items: Exercise[] }[];
  }[] {
    const bySession = new Map<string, Exercise[]>();
    for (const ex of this.exercises()) {
      const sessionKey = ex.sessionId != null ? `s${ex.sessionId}` : `d${ex.scheduledFor}`;
      if (!bySession.has(sessionKey)) bySession.set(sessionKey, []);
      bySession.get(sessionKey)!.push(ex);
    }

    return Array.from(bySession.entries())
      .sort((a, b) => {
        const dateA = a[1][0]?.scheduledFor ?? '';
        const dateB = b[1][0]?.scheduledFor ?? '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b[1][0]?.sessionNumber ?? 1) - (a[1][0]?.sessionNumber ?? 1);
      })
      .map(([sessionKey, items]) => {
        const date = items[0]?.scheduledFor ?? '';
        const sessionNumber = items[0]?.sessionNumber;
        const label = sessionNumber && sessionNumber > 1 ? `${date} — Séance ${sessionNumber}` : date;

        const byAtelier = new Map<number, Exercise[]>();
        for (const ex of items) {
          const key = ex.blockIndex ?? 0;
          if (!byAtelier.has(key)) byAtelier.set(key, []);
          byAtelier.get(key)!.push(ex);
        }
        const ateliers = Array.from(byAtelier.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([blockIndex, exs]) => ({
            key: `${sessionKey}-${blockIndex}`,
            label: blockIndex === 0 ? 'Exercices' : `Atelier ${blockIndex}`,
            items: [...exs].sort((a, b) => (a.orderIndex ?? a.id) - (b.orderIndex ?? b.id)),
          }));

        return { key: sessionKey, label, ateliers };
      });
  }

  toggleAtelierOpen(key: string): void {
    const next = new Set(this.openAtelierKeys());
    next.has(key) ? next.delete(key) : next.add(key);
    this.openAtelierKeys.set(next);
  }

  isAtelierOpen(key: string): boolean {
    return this.openAtelierKeys().has(key);
  }

  atelierDoneCount(items: Exercise[]): number {
    return items.filter((e) => e.done).length;
  }

  /** Change l'ordre d'un exercice au sein de son atelier et le sauvegarde côté serveur. */
  moveExercise(atelierItems: Exercise[], index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= atelierItems.length) return;
    const reordered = [...atelierItems];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    this.exerciseService.reorder(reordered.map((e) => e.id)).subscribe(() => this.refreshExercises());
  }

  /** Poids suggéré pour cet exercice, calculé à partir du %RM et du 1RM connu du joueur. */
  suggestedWeight(ex: Exercise): number | null {
    return suggestedWeightFor(ex.title, ex.percentRm, this.fiche());
  }

  resetExerciseForm(): void {
    if (!confirm("Vider le formulaire ? L'atelier, la récup et le %RM déjà remplis seront perdus.")) return;
    this.exerciseForm.reset({ sessionType: 'ATELIER' });
  }

  submitExercise(): void {
    if (this.exerciseForm.invalid) return;
    const raw = this.exerciseForm.getRawValue();
    this.exerciseService.assign(this.playerId, { ...raw, scheduledFor: raw.scheduledFor || null } as any).subscribe(() => {
      // On ne vide que les champs propres à cet exercice précis : le contexte (atelier, récup, séance,
      // % RM) reste rempli pour enchaîner l'ajout des exercices suivants du même atelier sans tout retaper.
      this.exerciseForm.patchValue({ title: '', sets: null, reps: '', videoUrl: '' });
      this.toast.show('Exercice envoyé ✓');
      this.refreshExercises();
    });
  }

  startEditExercise(ex: Exercise): void {
    this.editingExerciseId.set(ex.id);
    this.editExerciseForm.setValue({
      title: ex.title,
      sets: ex.sets,
      reps: ex.reps ?? '',
      videoUrl: ex.videoUrl ?? '',
      scheduledFor: ex.scheduledFor ?? '',
      recoveryTimeSeconds: ex.recoveryTimeSeconds,
      sessionType: ex.sessionType ?? 'ATELIER',
      blockIndex: ex.blockIndex,
      blockRecoveryTimeSeconds: ex.blockRecoveryTimeSeconds,
      percentRm: ex.percentRm,
    });
  }

  cancelEditExercise(): void {
    this.editingExerciseId.set(null);
  }

  saveEditExercise(exerciseId: number): void {
    if (this.editExerciseForm.invalid) return;
    const raw = this.editExerciseForm.getRawValue();
    this.exerciseService.update(exerciseId, { ...raw, scheduledFor: raw.scheduledFor || null } as any).subscribe(() => {
      this.editingExerciseId.set(null);
      this.toast.show('Exercice modifié ✓');
      this.refreshExercises();
    });
  }

  deleteExercise(exerciseId: number): void {
    if (!confirm('Supprimer cet exercice ? Le joueur ne le verra plus.')) return;
    this.exerciseService.delete(exerciseId).subscribe(() => {
      this.exercises.set(this.exercises().filter((e) => e.id !== exerciseId));
      this.toast.show('Exercice supprimé');
    });
  }

  // ---- Fiche musculation : ajout et édition ----

  submitFiche(): void {
    if (this.ficheForm.invalid) return;
    this.ficheService.addEntry(this.playerId, this.ficheForm.getRawValue() as any).subscribe(() => {
      this.ficheForm.reset();
      this.toast.show('Charges calculées ✓');
      this.refreshFiche();
    });
  }

  startEditFiche(f: FicheEntry): void {
    this.editingFicheId.set(f.id);
    this.editFicheForm.setValue({ weight: f.weight, reps: f.reps });
  }

  cancelEditFiche(): void {
    this.editingFicheId.set(null);
  }

  saveEditFiche(entryId: number): void {
    if (this.editFicheForm.invalid) return;
    this.ficheService.updateEntry(entryId, this.editFicheForm.getRawValue() as any).subscribe(() => {
      this.editingFicheId.set(null);
      this.toast.show('Test corrigé ✓');
      this.refreshFiche();
    });
  }

  // ---- Blessures ----

  submitInjury(): void {
    if (this.injuryForm.invalid) return;
    const raw = this.injuryForm.getRawValue();
    this.injuryService.create(this.playerId, { ...raw, startDate: raw.startDate || null } as any).subscribe(() => {
      this.injuryForm.reset();
      this.showInjuryForm.set(false);
      this.toast.show('Blessure enregistrée');
      this.refreshInjuries();
    });
  }

  markInjuryHealed(injury: Injury): void {
    this.injuryService
      .update(injury.id, { status: 'RETABLI', endDate: new Date().toISOString().slice(0, 10) })
      .subscribe(() => {
        this.toast.show('Joueur marqué rétabli ✓');
        this.refreshInjuries();
      });
  }

  // ---- Objectifs ----

  submitGoal(): void {
    if (this.goalForm.invalid) return;
    const raw = this.goalForm.getRawValue();
    this.goalService.create(this.playerId, { ...raw, targetDate: raw.targetDate || null } as any).subscribe(() => {
      this.goalForm.reset();
      this.showGoalForm.set(false);
      this.toast.show('Objectif fixé ✓');
      this.refreshGoals();
    });
  }

  deleteGoal(goalId: number): void {
    this.goalService.delete(goalId).subscribe(() => {
      this.goals.set(this.goals().filter((g) => g.id !== goalId));
    });
  }

  // ---- Export PDF ----

  exportPdf(): void {
    const p = this.player();
    if (!p) return;
    exportPlayerReportPdf({
      player: p,
      wellnessHistory: this.wellnessHistory(),
      rpeHistory: this.rpeHistory(),
      fiche: this.fiche(),
      injuries: this.injuries(),
      goals: this.goals(),
      exercises: this.exercises(),
    });
  }
}
