import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'coach',
    canActivate: [authGuard, roleGuard(['COACH'])],
    loadComponent: () => import('./features/coach/roster/roster.component').then((m) => m.RosterComponent),
  },
  {
    path: 'coach/players/:id',
    canActivate: [authGuard, roleGuard(['COACH'])],
    loadComponent: () =>
      import('./features/coach/player-detail/player-detail.component').then((m) => m.PlayerDetailComponent),
  },
  {
    path: 'coach/programs',
    canActivate: [authGuard, roleGuard(['COACH'])],
    loadComponent: () => import('./features/coach/programs/programs.component').then((m) => m.ProgramsComponent),
  },
  {
    path: 'player',
    canActivate: [authGuard, roleGuard(['PLAYER'])],
    loadComponent: () => import('./features/player/home/player-home.component').then((m) => m.PlayerHomeComponent),
  },
  {
    path: 'player/history',
    canActivate: [authGuard, roleGuard(['PLAYER'])],
    loadComponent: () => import('./features/player/history/player-history.component').then((m) => m.PlayerHistoryComponent),
  },
  {
    path: 'account/password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  { path: '**', redirectTo: 'login' },
];
