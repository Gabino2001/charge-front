import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private toast = inject(ToastService);
  private router = inject(Router);
  authService = inject(AuthService);

  saving = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.accountService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show('Mot de passe mis à jour ✓');
        this.form.reset();
        this.goBack();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err?.status === 401 ? 'Mot de passe actuel incorrect.' : "Impossible de changer le mot de passe."
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate([this.authService.role() === 'COACH' ? '/coach' : '/player']);
  }
}
