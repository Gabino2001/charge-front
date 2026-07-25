import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/auth.model';

export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    const role = authService.role();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Connecté mais mauvais rôle : renvoyer vers son propre espace.
    router.navigate([role === 'COACH' ? '/coach' : '/player']);
    return false;
  };
}
