import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timeoutId?: ReturnType<typeof setTimeout>;

  show(message: string, durationMs = 2200): void {
    this.message.set(message);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.message.set(null), durationMs);
  }
}
