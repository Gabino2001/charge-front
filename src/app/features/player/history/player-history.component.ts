import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { TrainingSessionService } from '../../../core/services/training-session.service';
import { Exercise } from '../../../core/models/exercise.model';
import { TrainingSession } from '../../../core/models/training-session.model';

interface PastSessionGroup {
  session: TrainingSession;
  items: Exercise[];
}

@Component({
  selector: 'app-player-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-history.component.html',
})
export class PlayerHistoryComponent implements OnInit {
  authService = inject(AuthService);
  private exerciseService = inject(ExerciseService);
  private sessionService = inject(TrainingSessionService);

  loading = signal(true);
  sessions = signal<TrainingSession[]>([]);
  exercises = signal<Exercise[]>([]);
  expandedSessionId = signal<number | null>(null);

  ngOnInit(): void {
    this.sessionService.mine().subscribe((sessions) => {
      this.sessions.set(sessions);
      this.loading.set(false);
    });
    this.exerciseService.listMine().subscribe((ex) => this.exercises.set(ex));
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Séances passées, la plus récente en premier (celle du jour reste sur l'écran principal). */
  pastSessions(): PastSessionGroup[] {
    const today = this.today();
    return this.sessions()
      .filter((s) => s.sessionDate !== today)
      .map((session) => ({
        session,
        items: this.exercises().filter((e) => e.sessionId === session.id),
      }));
  }

  toggleExpand(sessionId: number): void {
    this.expandedSessionId.set(this.expandedSessionId() === sessionId ? null : sessionId);
  }

  doneCount(group: PastSessionGroup): number {
    return group.items.filter((e) => e.done).length;
  }
}
