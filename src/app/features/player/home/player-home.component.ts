import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { FicheService } from '../../../core/services/fiche.service';
import { WellnessService } from '../../../core/services/wellness.service';
import { ToastService } from '../../../core/services/toast.service';
import { GoalService } from '../../../core/services/goal.service';
import { TrainingSessionService } from '../../../core/services/training-session.service';
import { Exercise, LoadFeedback, LOAD_FEEDBACK_LABELS } from '../../../core/models/exercise.model';
import { FicheEntry } from '../../../core/models/fiche.model';
import { TrainingSession } from '../../../core/models/training-session.model';
import { Goal } from '../../../core/models/goal.model';
import { SubmitWellnessRequest, WELLNESS_QUESTIONS } from '../../../core/models/wellness.model';
import { PlateStackComponent } from '../../../shared/components/plate-stack.component';
import { RmChipsComponent } from '../../../shared/components/rm-chips.component';
import { RpeScaleComponent } from '../../../shared/components/rpe-scale.component';
import { WellnessScaleComponent } from '../../../shared/components/wellness-scale.component';
import { suggestedWeightFor } from '../../../shared/utils/suggested-weight.util';
import { youtubeEmbedUrl } from '../../../shared/utils/youtube.util';
import { SafeEmbedPipe } from '../../../shared/pipes/safe-embed.pipe';
import { exportFichePdf } from '../../../shared/utils/fiche-pdf.util';

/** Un atelier au sein d'une séance, avec les exercices qu'il regroupe. */
interface AtelierGroup {
  key: number;
  label: string;
  items: Exercise[];
}

/** Une séance du jour et les exercices qu'elle contient. */
interface SessionGroup {
  session: TrainingSession;
  items: Exercise[];
}

@Component({
  selector: 'app-player-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PlateStackComponent,
    RmChipsComponent,
    RpeScaleComponent,
    WellnessScaleComponent,
    SafeEmbedPipe,
  ],
  templateUrl: './player-home.component.html',
})
export class PlayerHomeComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private exerciseService = inject(ExerciseService);
  private ficheService = inject(FicheService);
  private wellnessService = inject(WellnessService);
  private sessionService = inject(TrainingSessionService);
  private goalService = inject(GoalService);
  private toast = inject(ToastService);

  questions = WELLNESS_QUESTIONS;
  loadFeedbackLabels = LOAD_FEEDBACK_LABELS;
  checked = signal(false);
  wellnessDone = signal(false);
  submitting = signal(false);

  draft: { [key: string]: number | undefined } = {};
  painLocation = '';

  exercises = signal<Exercise[]>([]);
  fiche = signal<FicheEntry[]>([]);
  goals = signal<Goal[]>([]);
  sessions = signal<TrainingSession[]>([]);

  /** Séance sélectionnée quand il y en a plusieurs aujourd'hui (null = à choisir, ou séance unique auto-sélectionnée). */
  selectedSessionId = signal<number | null>(null);
  /** Atelier actuellement ouvert dans la séance active (null = vue liste des ateliers). */
  selectedAtelierKey = signal<number | null>(null);

  /** Séances validées localement par le joueur (bouton cliqué), en attendant l'envoi effectif du RPE. */
  validatedSessionIds = signal<Set<number>>(new Set());

  /** Exercice qui vient d'être coché, en attente d'un ressenti (RPE) avant de continuer. */
  pendingRpeExercise = signal<Exercise | null>(null);
  pendingRpeDraft: number | null = null;
  pendingRpeSubmitting = signal(false);
  /** Ressenti optionnel sur la charge donnée par le coach (trop lourde, parfaite, trop légère). */
  pendingLoadFeedback: LoadFeedback | null = null;
  pendingLoadComment = '';

  /** Minuteur de récupération : soit après un exercice (circuit training), soit après tout un atelier (superset). */
  restTimer = signal<{ key: string; label: string; remaining: number; total: number } | null>(null);
  private restTimerInterval?: ReturnType<typeof setInterval>;

  rpeSubmitting = signal(false);
  rpeDraft: number | null = null;
  rpeDuration: number | null = null;
  rpeEditing = signal(false);

  private pollingInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.wellnessService.todayStatus().subscribe({
      next: (status) => {
        this.checked.set(true);
        this.wellnessDone.set(status.submittedToday);
        if (status.submittedToday) this.loadData();
        this.startPolling();
      },
      error: () => this.checked.set(true),
    });
  }

  ngOnDestroy(): void {
    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  /** Rafraîchit périodiquement pour détecter une nouvelle séance envoyée par le coach le même jour. */
  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      if (!this.wellnessDone()) return;
      const sessionsBefore = this.sessions().length;
      this.exerciseService.listMine().subscribe((ex) => this.exercises.set(ex));
      this.sessionService.today().subscribe((s) => {
        this.sessions.set(s);
        if (s.length > sessionsBefore) {
          this.toast.show('Nouveaux exercices reçus de ton préparateur 📋');
        }
      });
    }, 45000);
  }

  setDraft(id: string, value: number): void {
    this.draft = { ...this.draft, [id]: value };
  }

  allAnswered(): boolean {
    return this.questions.every((q) => this.draft[q.id] !== undefined);
  }

  submitWellness(): void {
    if (!this.allAnswered()) return;
    this.submitting.set(true);
    const payload: SubmitWellnessRequest = {
      mood: this.draft['mood']!,
      sleep: this.draft['sleep']!,
      fatigue: this.draft['fatigue']!,
      soreness: this.draft['soreness']!,
      stress: this.draft['stress']!,
      painLocation: this.painLocation || null,
    };
    this.wellnessService.submit(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.wellnessDone.set(true);
        this.toast.show('Merci ! Bonne séance 💪');
        this.loadData();
      },
      error: () => this.submitting.set(false),
    });
  }

  loadData(): void {
    this.exerciseService.listMine().subscribe((ex) => this.exercises.set(ex));
    this.ficheService.listMine().subscribe((f) => this.fiche.set(f));
    this.goalService.listMine().subscribe((g) => this.goals.set(g));
    this.sessionService.today().subscribe((s) => {
      this.sessions.set(s);
      this.restoreSessionState();
    });
  }

  // ---- Séances du jour ----

  /** Regroupe les exercices d'aujourd'hui par séance (un joueur peut avoir plusieurs séances/jour). */
  sessionGroups(): SessionGroup[] {
    const bySession = new Map<number, Exercise[]>();
    for (const ex of this.exercises()) {
      if (ex.sessionId == null) continue;
      if (!bySession.has(ex.sessionId)) bySession.set(ex.sessionId, []);
      bySession.get(ex.sessionId)!.push(ex);
    }
    return this.sessions()
      .filter((s) => bySession.has(s.id))
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .map((session) => ({ session, items: bySession.get(session.id)! }));
  }

  /** La séance actuellement affichée : auto-sélectionnée s'il n'y en a qu'une, sinon celle choisie par le joueur. */
  activeSessionGroup(): SessionGroup | null {
    const groups = this.sessionGroups();
    if (groups.length === 0) return null;
    if (groups.length === 1) return groups[0];
    const id = this.selectedSessionId();
    return id === null ? null : groups.find((g) => g.session.id === id) ?? null;
  }

  /** Vrai quand plusieurs séances existent aujourd'hui et qu'aucune n'est encore choisie : affiche la liste à choisir. */
  needsSessionPicker(): boolean {
    return this.sessionGroups().length > 1 && this.selectedSessionId() === null;
  }

  openSession(sessionId: number): void {
    this.selectedSessionId.set(sessionId);
    this.selectedAtelierKey.set(null);
    this.atelierSequence.set(null);
  }

  closeSession(): void {
    this.selectedSessionId.set(null);
    this.selectedAtelierKey.set(null);
  }

  sessionDoneCount(group: SessionGroup): number {
    return group.items.filter((e) => e.done).length;
  }

  // ---- Ateliers de la séance active ----

  ateliers(): AtelierGroup[] {
    const group = this.activeSessionGroup();
    if (!group) return [];
    const byBlock = new Map<number, Exercise[]>();
    for (const ex of group.items) {
      const key = ex.blockIndex ?? 0;
      if (!byBlock.has(key)) byBlock.set(key, []);
      byBlock.get(key)!.push(ex);
    }
    return Array.from(byBlock.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([key, items]) => ({
        key,
        label: key === 0 ? 'Exercices' : `Atelier ${key}`,
        items: [...items].sort((a, b) => (a.orderIndex ?? a.id) - (b.orderIndex ?? b.id)),
      }));
  }

  /**
   * Ordre de parcours des ateliers : le joueur choisit librement son atelier de départ (aucun ordre
   * imposé au premier choix), puis la suite s'enchaîne dans l'ordre naturel en bouclant sur les ateliers
   * restants. Ex. avec 3 ateliers, en commençant par le 2 : 2 → 3 → 1.
   */
  atelierSequence = signal<number[] | null>(null);

  orderedAteliers(): AtelierGroup[] {
    const all = this.ateliers();
    const seq = this.atelierSequence();
    if (!seq) return all;
    const byKey = new Map(all.map((a) => [a.key, a]));
    return seq.map((k) => byKey.get(k)).filter((a): a is AtelierGroup => !!a);
  }

  selectedAtelier(): AtelierGroup | null {
    const key = this.selectedAtelierKey();
    if (key === null) return null;
    return this.ateliers().find((a) => a.key === key) ?? null;
  }

  openAtelier(key: number): void {
    const group = this.ateliers().find((a) => a.key === key);
    if (!group) return;
    if (this.atelierSequence() === null) {
      // Premier choix du joueur : fixe l'ordre de parcours à partir de cet atelier.
      const keys = this.ateliers().map((a) => a.key);
      const startIdx = keys.indexOf(key);
      const sequence = startIdx >= 0 ? [...keys.slice(startIdx), ...keys.slice(0, startIdx)] : keys;
      this.atelierSequence.set(sequence);
      this.persistSequence(sequence);
    }
    if (!this.isAtelierUnlocked(group)) return;
    this.selectedAtelierKey.set(key);
  }

  closeAtelier(): void {
    this.selectedAtelierKey.set(null);
  }

  atelierDoneCount(group: AtelierGroup): number {
    return group.items.filter((e) => e.done).length;
  }

  /** Montre la liste des ateliers de la séance active tant qu'elle n'est pas terminée (côté serveur ou validée localement). */
  showAteliers(): boolean {
    if (!this.wellnessDone()) return false;
    const group = this.activeSessionGroup();
    if (!group) return false;
    if (group.session.status === 'COMPLETED') return false;
    if (this.validatedSessionIds().has(group.session.id)) return false;
    return true;
  }

  allActiveSessionDone(): boolean {
    const group = this.activeSessionGroup();
    return !!group && group.items.length > 0 && group.items.every((e) => e.done);
  }

  // ---- Verrouillage : ateliers et exercices ----
  // Le joueur choisit librement son atelier de départ ; les autres se verrouillent selon l'ordre
  // circulaire choisi. Un atelier n'est accessible que si le précédent (dans cet ordre) est entièrement
  // terminé ET, s'il a une récup de fin d'atelier, que ce temps s'est entièrement écoulé.
  // En circuit training, même logique mais entre chaque exercice au sein d'un même atelier.

  /** Clés (atelier ou exercice) dont la récupération requise (le cas échéant) est terminée. */
  clearedRecoveryKeys = signal<Set<string>>(new Set());

  isAtelierUnlocked(group: AtelierGroup): boolean {
    if (this.atelierSequence() === null) return true; // libre choix du premier atelier
    const all = this.orderedAteliers();
    const idx = all.findIndex((a) => a.key === group.key);
    if (idx <= 0) return true;
    const prev = all[idx - 1];
    if (this.atelierDoneCount(prev) < prev.items.length) return false;
    const recovery = this.atelierRecoveryTimeSeconds(prev);
    if (!recovery) return true;
    return this.isAtelierRecoveryCleared(prev);
  }

  nextAtelier(group: AtelierGroup): AtelierGroup | null {
    const all = this.orderedAteliers();
    const idx = all.findIndex((a) => a.key === group.key);
    if (idx < 0 || idx === all.length - 1) return null;
    return all[idx + 1];
  }

  previousAtelier(group: AtelierGroup): AtelierGroup | null {
    const all = this.orderedAteliers();
    const idx = all.findIndex((a) => a.key === group.key);
    if (idx <= 0) return null;
    return all[idx - 1];
  }

  goToNextAtelier(group: AtelierGroup): void {
    const next = this.nextAtelier(group);
    if (next) this.openAtelier(next.key);
    else this.closeAtelier();
  }

  /** En circuit training, un exercice n'est accessible que si le précédent est fait et sa récup écoulée. */
  isExerciseUnlocked(group: AtelierGroup, ex: Exercise): boolean {
    if (!this.isCircuitAtelier(group)) return true;
    const idx = group.items.findIndex((i) => i.id === ex.id);
    if (idx <= 0) return true;
    const prev = group.items[idx - 1];
    if (!prev.done) return false;
    if (!prev.recoveryTimeSeconds) return true;
    return this.isExerciseRecoveryCleared(prev);
  }

  toggle(ex: Exercise): void {
    this.exerciseService.toggleComplete(ex.id).subscribe((updated) => {
      this.exercises.set(this.exercises().map((e) => (e.id === updated.id ? updated : e)));
      if (updated.done) {
        this.toast.show('Exercice validé — ton préparateur est notifié ✓');
        if (updated.exerciseRpe === null) {
          this.pendingRpeExercise.set(updated);
          this.pendingRpeDraft = null;
        }
        this.handleAtelierCompletion(updated);
        this.handleExerciseRecoveryStart(updated);
      }
    });
  }

  /** Si cet exercice termine son atelier : démarre automatiquement la récup de fin d'atelier (ou lève le verrou si aucune). */
  private handleAtelierCompletion(ex: Exercise): void {
    const group = this.ateliers().find((g) => g.items.some((i) => i.id === ex.id));
    if (!group || this.atelierDoneCount(group) !== group.items.length) return;
    if (this.clearedRecoveryKeys().has(String(group.key))) return;

    const recovery = this.atelierRecoveryTimeSeconds(group);
    const hasNext = !!this.nextAtelier(group);
    if (!recovery || !hasNext) {
      // Pas de récup configurée, ou dernier atelier de la séance : rien à verrouiller.
      this.markRecoveryCleared(String(group.key));
      return;
    }
    this.startAtelierRestTimer(group);
  }

  /**
   * En circuit training : démarre automatiquement la récup après CET exercice précis, ce qui verrouille
   * le suivant dans l'atelier jusqu'à ce qu'elle s'écoule (même logique que pour la fin d'un atelier superset).
   */
  private handleExerciseRecoveryStart(ex: Exercise): void {
    const group = this.ateliers().find((g) => g.items.some((i) => i.id === ex.id));
    if (!group || !this.isCircuitAtelier(group)) return;
    if (this.clearedRecoveryKeys().has(`ex-${ex.id}`)) return;

    const idx = group.items.findIndex((i) => i.id === ex.id);
    const isLastInAtelier = idx === group.items.length - 1;
    if (!ex.recoveryTimeSeconds || isLastInAtelier) {
      // Pas de récup configurée, ou dernier exercice du circuit : rien à verrouiller après lui.
      this.markRecoveryCleared(`ex-${ex.id}`);
      return;
    }
    this.startExerciseRestTimer(ex);
  }

  // ---- RPE par exercice ----

  setLoadFeedback(value: LoadFeedback): void {
    this.pendingLoadFeedback = this.pendingLoadFeedback === value ? null : value;
  }

  submitPendingRpe(): void {
    const ex = this.pendingRpeExercise();
    if (!ex || this.pendingRpeDraft === null) return;
    this.pendingRpeSubmitting.set(true);
    this.exerciseService
      .submitRpe(ex.id, {
        rpe: this.pendingRpeDraft,
        loadFeedback: this.pendingLoadFeedback,
        loadComment: this.pendingLoadComment.trim() || null,
      })
      .subscribe({
        next: (updated) => {
          this.exercises.set(this.exercises().map((e) => (e.id === updated.id ? updated : e)));
          this.pendingRpeSubmitting.set(false);
          this.pendingRpeExercise.set(null);
          this.pendingLoadFeedback = null;
          this.pendingLoadComment = '';
          this.toast.show("Ressenti de l'exercice enregistré ✓");
        },
        error: () => this.pendingRpeSubmitting.set(false),
      });
  }

  skipPendingRpe(): void {
    this.pendingRpeExercise.set(null);
    this.pendingLoadFeedback = null;
    this.pendingLoadComment = '';
  }

  // ---- Minuteur de récupération ----
  // Circuit training (ATELIER) : récup après chaque exercice, via ex.recoveryTimeSeconds.
  // Superset (SUPERSET) : pas de récup entre les exercices d'un même atelier. Une fois l'atelier
  // terminé, la récup de fin d'atelier démarre automatiquement et verrouille l'atelier suivant
  // jusqu'à ce qu'elle s'écoule entièrement (via blockRecoveryTimeSeconds).

  /** Vrai si les exercices de cet atelier sont en mode "circuit training" (récup après chaque exercice). */
  isCircuitAtelier(group: AtelierGroup): boolean {
    // On regarde tous les exercices de l'atelier (pas seulement le premier ajouté) : si l'un d'eux
    // est marqué SUPERSET, tout l'atelier est traité comme un superset.
    return !group.items.some((e) => e.sessionType === 'SUPERSET');
  }

  /** Temps de récup (s) à prendre après tout l'atelier, une fois terminé. */
  atelierRecoveryTimeSeconds(group: AtelierGroup): number | null {
    // Un coach ajoute souvent les exercices d'un atelier un par un (le formulaire se réinitialise
    // à chaque envoi) : on prend la première valeur renseignée trouvée parmi tous les exercices de
    // l'atelier, pas seulement celle du premier exercice ajouté.
    for (const e of group.items) {
      if (e.blockRecoveryTimeSeconds) return e.blockRecoveryTimeSeconds;
    }
    return null;
  }

  /** Démarre (ou reprend, après un rechargement de page) la récup après cet exercice. Ne peut pas être passée. */
  startExerciseRestTimer(ex: Exercise): void {
    const total = ex.recoveryTimeSeconds ?? 60;
    this.startRestTimer(`ex-${ex.id}`, ex.title, total, `ex-${ex.id}`);
  }

  /** Démarre (ou reprend, après un rechargement de page) la récup de fin d'atelier. Ne peut pas être passée. */
  startAtelierRestTimer(group: AtelierGroup): void {
    const total = this.atelierRecoveryTimeSeconds(group) ?? 60;
    this.startRestTimer(`atelier-${group.key}`, group.label, total, String(group.key));
  }

  isRestTimerFor(key: string): boolean {
    return this.restTimer()?.key === key;
  }

  isAtelierRecoveryCleared(group: AtelierGroup): boolean {
    return this.clearedRecoveryKeys().has(String(group.key));
  }

  /** Poids suggéré pour cet exercice, calculé à partir du %RM et du 1RM connu du joueur. */
  suggestedWeight(ex: Exercise): number | null {
    return suggestedWeightFor(ex.title, ex.percentRm, this.fiche());
  }

  videoEmbedUrl(ex: Exercise): string | null {
    return youtubeEmbedUrl(ex.videoUrl);
  }

  downloadFichePdf(): void {
    exportFichePdf({ fullName: this.authService.fullName() ?? 'Joueur' }, this.fiche());
  }

  expandedVideoExerciseId = signal<number | null>(null);

  toggleVideo(exerciseId: number): void {
    this.expandedVideoExerciseId.set(this.expandedVideoExerciseId() === exerciseId ? null : exerciseId);
  }

  isExerciseRecoveryCleared(ex: Exercise): boolean {
    return this.clearedRecoveryKeys().has(`ex-${ex.id}`);
  }

  private markRecoveryCleared(key: string): void {
    const next = new Set(this.clearedRecoveryKeys());
    next.add(key);
    this.clearedRecoveryKeys.set(next);
    this.persistCleared(next);
  }

  private startRestTimer(key: string, label: string, total: number, gateKeyOnComplete?: string): void {
    this.clearRestTimer();
    this.restTimer.set({ key, label, remaining: total, total });
    this.persistTimer(key, label, Date.now() + total * 1000, gateKeyOnComplete);
    this.restTimerInterval = setInterval(() => {
      const current = this.restTimer();
      if (!current) return;
      if (current.remaining <= 1) {
        this.clearRestTimer();
        this.toast.show('Récupération terminée — c\'est reparti 💪');
        if (gateKeyOnComplete) this.markRecoveryCleared(gateKeyOnComplete);
      } else {
        this.restTimer.set({ ...current, remaining: current.remaining - 1 });
      }
    }, 1000);
  }

  /** Reprend un minuteur déjà en cours après un rechargement de page, à partir du temps réellement écoulé. */
  private resumeRestTimer(key: string, label: string, remainingSeconds: number, endsAt: number, gateKeyOnComplete?: string): void {
    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    this.restTimer.set({ key, label, remaining: remainingSeconds, total: remainingSeconds });
    this.restTimerInterval = setInterval(() => {
      const remaining = Math.round((endsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        this.clearRestTimer();
        this.toast.show('Récupération terminée — c\'est reparti 💪');
        if (gateKeyOnComplete) this.markRecoveryCleared(gateKeyOnComplete);
      } else {
        const current = this.restTimer();
        this.restTimer.set({ key, label, remaining, total: current?.total ?? remaining });
      }
    }, 1000);
  }

  clearRestTimer(): void {
    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    this.restTimerInterval = undefined;
    this.restTimer.set(null);
    this.clearPersistedTimer();
  }

  // ---- Persistance locale (survit à un rechargement de page pendant la séance) ----

  private storageKey(suffix: string): string {
    const group = this.activeSessionGroup();
    const sessionId = group ? group.session.id : 'none';
    return `charge:session:${sessionId}:${suffix}`;
  }

  private persistSequence(sequence: number[]): void {
    try { localStorage.setItem(this.storageKey('sequence'), JSON.stringify(sequence)); } catch {}
  }

  private persistCleared(cleared: Set<string>): void {
    try { localStorage.setItem(this.storageKey('cleared'), JSON.stringify(Array.from(cleared))); } catch {}
  }

  private persistTimer(key: string, label: string, endsAt: number, gateKeyOnComplete?: string): void {
    try { localStorage.setItem(this.storageKey('timer'), JSON.stringify({ key, label, endsAt, gateKeyOnComplete })); } catch {}
  }

  private clearPersistedTimer(): void {
    try { localStorage.removeItem(this.storageKey('timer')); } catch {}
  }

  private clearPersistedSessionState(sessionId: number): void {
    try {
      localStorage.removeItem(`charge:session:${sessionId}:sequence`);
      localStorage.removeItem(`charge:session:${sessionId}:cleared`);
      localStorage.removeItem(`charge:session:${sessionId}:timer`);
    } catch {}
  }

  /** Restaure l'ordre choisi, les verrous levés et un minuteur en cours après un rechargement de page. */
  private restoreSessionState(): void {
    try {
      const seqRaw = localStorage.getItem(this.storageKey('sequence'));
      if (seqRaw) this.atelierSequence.set(JSON.parse(seqRaw));

      const clearedRaw = localStorage.getItem(this.storageKey('cleared'));
      if (clearedRaw) this.clearedRecoveryKeys.set(new Set(JSON.parse(clearedRaw)));

      const timerRaw = localStorage.getItem(this.storageKey('timer'));
      if (timerRaw) {
        const t = JSON.parse(timerRaw);
        const remaining = Math.round((t.endsAt - Date.now()) / 1000);
        if (remaining > 0) {
          this.resumeRestTimer(t.key, t.label, remaining, t.endsAt, t.gateKeyOnComplete);
        } else {
          if (t.gateKeyOnComplete) this.markRecoveryCleared(t.gateKeyOnComplete);
          this.clearPersistedTimer();
        }
      }
    } catch {
      // Stockage local indisponible ou données corrompues : on repart simplement sans état restauré.
    }
  }

  // ---- Fin de séance ----

  finishSession(): void {
    const group = this.activeSessionGroup();
    if (!group || !this.allActiveSessionDone()) return;
    this.clearRestTimer();
    const next = new Set(this.validatedSessionIds());
    next.add(group.session.id);
    this.validatedSessionIds.set(next);
    this.selectedAtelierKey.set(null);
  }

  /** Permet de revenir sur les ateliers si le joueur a cliqué trop vite, tant que le RPE n'est pas envoyé. */
  cancelFinishSession(): void {
    const group = this.activeSessionGroup();
    if (!group) return;
    const next = new Set(this.validatedSessionIds());
    next.delete(group.session.id);
    this.validatedSessionIds.set(next);
  }

  // ---- RPE global de la séance active ----

  submitRpe(): void {
    const group = this.activeSessionGroup();
    if (!group || this.rpeDraft === null) return;
    this.rpeSubmitting.set(true);
    this.sessionService.submitRpe(group.session.id, { rpe: this.rpeDraft, durationMinutes: this.rpeDuration || null }).subscribe({
      next: (updatedSession) => {
        this.rpeSubmitting.set(false);
        this.sessions.set(this.sessions().map((s) => (s.id === updatedSession.id ? updatedSession : s)));
        this.rpeDraft = null;
        this.rpeDuration = null;
        this.toast.show('Ressenti envoyé — bonne récupération 🙌');
        this.clearPersistedSessionState(group.session.id);
      },
      error: () => this.rpeSubmitting.set(false),
    });
  }

  startEditRpe(): void {
    const group = this.activeSessionGroup();
    this.rpeDraft = group?.session.rpe ?? null;
    this.rpeDuration = group?.session.durationMinutes ?? null;
    this.rpeEditing.set(true);
  }

  cancelEditRpe(): void {
    this.rpeEditing.set(false);
  }

  saveEditRpe(): void {
    const group = this.activeSessionGroup();
    if (!group || this.rpeDraft === null) return;
    this.rpeSubmitting.set(true);
    this.sessionService.updateRpe(group.session.id, { rpe: this.rpeDraft, durationMinutes: this.rpeDuration || null }).subscribe({
      next: (updatedSession) => {
        this.rpeSubmitting.set(false);
        this.rpeEditing.set(false);
        this.sessions.set(this.sessions().map((s) => (s.id === updatedSession.id ? updatedSession : s)));
        this.toast.show('Ressenti corrigé ✓');
      },
      error: () => this.rpeSubmitting.set(false),
    });
  }
}
