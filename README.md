# CHARGE. — Frontend Angular

Interface web (Angular 17, standalone components) + Tailwind CSS, connectée à
l'API Spring Boot du dossier `charge-backend`.

## Stack

- Angular 17 (standalone components, signals, lazy-loaded routes)
- Tailwind CSS 3 (tokens de marque dans `tailwind.config.js`)
- RxJS pour les appels HTTP

## Installation

```bash
npm install
```

## Configuration de l'API

L'URL de l'API se règle dans `src/environments/environment.ts` (dev) et
`src/environments/environment.prod.ts` (prod) :

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
```

Par défaut, pointe vers le backend Spring Boot lancé en local sur le port 8080.
Pense à mettre `CORS_ORIGINS=http://localhost:4200` côté backend (déjà la
valeur par défaut).

## Lancer en développement

```bash
npm start
```

Ouvre `http://localhost:4200`.

## Build de production

```bash
npm run build
```

Les fichiers sont générés dans `dist/charge-frontend`.

## Structure

```
src/app/
  core/
    models/         DTOs TypeScript (alignés sur l'API backend)
    services/        appels HTTP (auth, joueurs, exercices, fiche, bien-être, notifications)
    guards/          authGuard, roleGuard (COACH / PLAYER)
    interceptors/    ajout du token JWT, déconnexion automatique sur 401
  features/
    auth/            connexion, inscription préparateur
    coach/           effectif (roster) + détail joueur (exercices, fiche, bien-être)
    player/          questionnaire de bien-être bloquant + exercices + charges
  shared/
    components/      plate-stack (visuel charges), rm-chips (tableau 1RM-20RM), wellness-scale, toast
```

## Comportement à connaître

- Le joueur doit remplir le questionnaire de bien-être du jour avant d'accéder
  à ses exercices. Ce n'est pas qu'un blocage visuel : si l'API renvoie
  HTTP 428 (bien-être manquant), l'écran est prêt à afficher automatiquement
  le questionnaire.
- Le préparateur voit un point vert/jaune sur chaque joueur de l'effectif
  selon que le bien-être du jour a été rempli ou non.
- Les charges (1RM à 20RM) sont calculées côté serveur — le frontend affiche
  simplement `oneRepMax` et `rmTable` renvoyés par l'API, il ne refait pas
  le calcul.

## Vérifié dans cet environnement

Contrairement au backend Java (pas d'accès à Maven Central ici), le registre
npm était accessible : ce projet a été réellement compilé avec succès
(`ng build --configuration development`). Les budgets de taille de bundle en
configuration `production` ont été assouplis ; relance `npm run build` en
local pour la première vérification de la build de prod.
