import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgramService } from '../../../core/services/program.service';
import { PlayerService } from '../../../core/services/player.service';
import { ToastService } from '../../../core/services/toast.service';
import { Program } from '../../../core/models/program.model';
import { Player } from '../../../core/models/player.model';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './programs.component.html',
})
export class ProgramsComponent implements OnInit {
  private programService = inject(ProgramService);
  private playerService = inject(PlayerService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  programs = signal<Program[]>([]);
  players = signal<Player[]>([]);
  loading = signal(true);
  saving = signal(false);
  showCreateForm = signal(false);

  /** Programme en cours de modification (null = création d'un nouveau programme). */
  editingProgramId = signal<number | null>(null);

  /** Programme en cours d'assignation (affiche la liste de joueurs à cocher). */
  assigningProgramId = signal<number | null>(null);
  selectedPlayerIds = signal<Set<number>>(new Set());
  assigning = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    sessionType: ['ATELIER' as 'ATELIER' | 'SUPERSET', Validators.required],
    blocks: this.fb.array([this.buildBlockGroup()]),
  });

  get blocks(): FormArray {
    return this.form.get('blocks') as FormArray;
  }

  /** Ouvre le formulaire vierge pour créer un nouveau programme (annule une éventuelle édition en cours). */
  openCreateForm(): void {
    if (this.showCreateForm() && !this.editingProgramId()) {
      this.showCreateForm.set(false);
      return;
    }
    this.editingProgramId.set(null);
    this.form.reset({ sessionType: 'ATELIER' });
    this.blocks.clear();
    this.blocks.push(this.buildBlockGroup());
    this.showCreateForm.set(true);
  }

  exercisesOf(block: FormGroup | any): FormArray {
    return block.get('exercises') as FormArray;
  }

  ngOnInit(): void {
    this.refreshPrograms();
    this.playerService.list().subscribe((players) => this.players.set(players));
  }

  refreshPrograms(): void {
    this.loading.set(true);
    this.programService.list().subscribe({
      next: (programs) => {
        this.programs.set(programs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  buildExerciseGroup() {
    return this.fb.group({
      title: ['', Validators.required],
      sets: [null as number | null],
      reps: [''],
      tempo: [''],
      loadKg: [null as number | null],
      videoUrl: [''],
      recoveryTimeSeconds: [null as number | null],
      percentRm: [null as number | null],
    });
  }

  /** Un atelier démarre avec 2 exercices (le format le plus courant), le coach peut en ajouter. */
  buildBlockGroup() {
    return this.fb.group({
      recoveryTimeSeconds: [null as number | null],
      exercises: this.fb.array([this.buildExerciseGroup(), this.buildExerciseGroup()]),
    });
  }

  addBlock(): void {
    this.blocks.push(this.buildBlockGroup());
  }

  removeBlock(index: number): void {
    if (this.blocks.length > 1) {
      this.blocks.removeAt(index);
    }
  }

  /** Change l'ordre des ateliers (glisse cet atelier vers le haut ou le bas de la liste). */
  moveBlock(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.blocks.length) return;
    const control = this.blocks.at(index);
    this.blocks.removeAt(index);
    this.blocks.insert(target, control);
  }

  addExerciseToBlock(blockIndex: number): void {
    this.exercisesOf(this.blocks.at(blockIndex)).push(this.buildExerciseGroup());
  }

  removeExerciseFromBlock(blockIndex: number, exerciseIndex: number): void {
    const exercises = this.exercisesOf(this.blocks.at(blockIndex));
    if (exercises.length > 1) {
      exercises.removeAt(exerciseIndex);
    }
  }

  /** Change l'ordre des exercices au sein d'un atelier (utile pour un circuit training à faire dans l'ordre). */
  moveExercise(blockIndex: number, exerciseIndex: number, direction: -1 | 1): void {
    const exercises = this.exercisesOf(this.blocks.at(blockIndex));
    const target = exerciseIndex + direction;
    if (target < 0 || target >= exercises.length) return;
    const control = exercises.at(exerciseIndex);
    exercises.removeAt(exerciseIndex);
    exercises.insert(target, control);
  }

  /** Ouvre le formulaire pré-rempli pour modifier un programme existant. */
  startEditProgram(program: Program): void {
    this.editingProgramId.set(program.id);
    this.blocks.clear();
    for (const block of program.blocks) {
      const blockGroup = this.buildBlockGroup();
      const exercisesArray = this.exercisesOf(blockGroup);
      exercisesArray.clear();
      for (const ex of block.exercises) {
        exercisesArray.push(
          this.fb.group({
            title: [ex.title, Validators.required],
            sets: [ex.sets],
            reps: [ex.reps ?? ''],
            tempo: [ex.tempo ?? ''],
            loadKg: [ex.loadKg],
            videoUrl: [ex.videoUrl ?? ''],
            recoveryTimeSeconds: [ex.recoveryTimeSeconds],
            percentRm: [ex.percentRm],
          })
        );
      }
      blockGroup.patchValue({ recoveryTimeSeconds: block.recoveryTimeSeconds });
      this.blocks.push(blockGroup);
    }
    this.form.patchValue({
      name: program.name,
      description: program.description ?? '',
      sessionType: program.sessionType,
    });
    this.showCreateForm.set(true);
  }

  /** Prérempli le formulaire de création à partir d'un programme existant, pour créer une variante. */
  duplicateProgram(program: Program): void {
    this.editingProgramId.set(null);
    this.blocks.clear();
    for (const block of program.blocks) {
      const blockGroup = this.buildBlockGroup();
      const exercisesArray = this.exercisesOf(blockGroup);
      exercisesArray.clear();
      for (const ex of block.exercises) {
        exercisesArray.push(
          this.fb.group({
            title: [ex.title, Validators.required],
            sets: [ex.sets],
            reps: [ex.reps ?? ''],
            tempo: [ex.tempo ?? ''],
            loadKg: [ex.loadKg],
            videoUrl: [ex.videoUrl ?? ''],
            recoveryTimeSeconds: [ex.recoveryTimeSeconds],
            percentRm: [ex.percentRm],
          })
        );
      }
      blockGroup.patchValue({ recoveryTimeSeconds: block.recoveryTimeSeconds });
      this.blocks.push(blockGroup);
    }
    this.form.patchValue({
      name: `${program.name} (copie)`,
      description: program.description ?? '',
      sessionType: program.sessionType,
    });
    this.showCreateForm.set(true);
  }

  cancelEditProgram(): void {
    this.editingProgramId.set(null);
    this.showCreateForm.set(false);
    this.form.reset({ sessionType: 'ATELIER' });
    this.blocks.clear();
    this.blocks.push(this.buildBlockGroup());
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const editingId = this.editingProgramId();
    const request$ = editingId
      ? this.programService.update(editingId, this.form.getRawValue() as any)
      : this.programService.create(this.form.getRawValue() as any);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreateForm.set(false);
        this.editingProgramId.set(null);
        this.form.reset({ sessionType: 'ATELIER' });
        this.blocks.clear();
        this.blocks.push(this.buildBlockGroup());
        this.toast.show(editingId ? 'Programme modifié ✓' : 'Programme créé ✓');
        this.refreshPrograms();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteProgram(programId: number): void {
    if (!confirm('Supprimer ce programme ? Cette action ne supprime pas les exercices déjà envoyés aux joueurs.')) return;
    this.programService.delete(programId).subscribe(() => {
      this.programs.set(this.programs().filter((p) => p.id !== programId));
      this.toast.show('Programme supprimé');
    });
  }

  /** Renvoie la version actuelle du programme (après modification) à tous les joueurs qui l'avaient déjà reçu. */
  resendingProgramId = signal<number | null>(null);

  resendProgram(programId: number): void {
    this.resendingProgramId.set(programId);
    this.programService.resend(programId).subscribe({
      next: (res) => {
        this.resendingProgramId.set(null);
        this.toast.show(`Programme renvoyé à ${res.playersCount} joueur(s) ✓`);
      },
      error: (err) => {
        this.resendingProgramId.set(null);
        this.toast.show(err?.error?.message ?? 'Ce programme n\'a encore été assigné à personne.');
      },
    });
  }

  openAssign(programId: number): void {
    this.assigningProgramId.set(programId);
    this.selectedPlayerIds.set(new Set());
  }

  closeAssign(): void {
    this.assigningProgramId.set(null);
  }

  togglePlayer(playerId: number): void {
    const current = new Set(this.selectedPlayerIds());
    if (current.has(playerId)) {
      current.delete(playerId);
    } else {
      current.add(playerId);
    }
    this.selectedPlayerIds.set(current);
  }

  confirmAssign(): void {
    const programId = this.assigningProgramId();
    const playerIds = Array.from(this.selectedPlayerIds());
    if (!programId || playerIds.length === 0) return;

    this.assigning.set(true);
    this.programService.assign(programId, { playerIds }).subscribe({
      next: (res) => {
        this.assigning.set(false);
        this.closeAssign();
        this.toast.show(`Programme assigné à ${res.playersCount} joueur(s) ✓`);
      },
      error: () => this.assigning.set(false),
    });
  }
  getExerciseTitles(block: any): string {
  if (!block?.exercises?.length) {
    return '';
  }

  return block.exercises
    .map((exercise: any) => exercise.title)
    .join(' + ');
}
}
