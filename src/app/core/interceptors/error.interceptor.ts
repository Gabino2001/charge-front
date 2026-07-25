import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(

    catchError((error) => {

      switch (error.status) {

        case 401:
          // Token absent ou expiré
          authService.logout();
          router.navigate(['/login']);
          break;


        case 403:
          // Accès interdit
          console.error("Accès refusé");
          break;


        case 404:
          // Ressource inexistante
          console.error("Ressource introuvable");
          break;


        case 400:
          // Erreur de validation backend
          console.error(
            "Erreur validation : ",
            error.error?.details
          );
          break;


        case 500:
          // Erreur serveur
          console.error(
            "Erreur serveur : ",
            error.error?.message
          );
          break;


        default:
          console.error(
            "Erreur inconnue : ",
            error
          );
      }


      return throwError(() => error);

    })

  );
};
