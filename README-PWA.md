# Installation PWA — CHARGE.

## 1. Copier les fichiers
Copie ces fichiers dans ton projet Angular, en gardant la même arborescence :

```
src/manifest.webmanifest          → src/manifest.webmanifest
ngsw-config.json                  → ngsw-config.json (racine du projet, à côté de angular.json)
src/app/app.config.ts             → remplace ton src/app/app.config.ts existant
src/index.html                    → remplace ton src/index.html existant
```

## 2. Installer le package du service worker
Dans ton terminal, à la racine du projet :
```bash
npm install @angular/service-worker
```

## 3. Modifier angular.json
Ouvre `angular.json`, trouve la section `architect.build.options` de ton projet, et ajoute ces deux lignes :

```json
"serviceWorker": true,
"ngswConfigPath": "ngsw-config.json",
```

Ajoute aussi `"src/manifest.webmanifest"` dans la liste `"assets"` :
```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  "src/manifest.webmanifest"
],
```

⚠️ Fais bien attention à ajouter ces lignes dans la config `build`, sans casser le reste de ton fichier (virgules, accolades).

## 4. Ajouter tes icônes (TON LOGO)
Place ton logo dans `src/assets/icons/` avec **exactement ces noms et tailles** (PNG, fond carré, pas de transparence pour les icônes "maskable") :

| Fichier | Taille |
|---|---|
| icon-72x72.png | 72×72 |
| icon-96x96.png | 96×96 |
| icon-128x128.png | 128×128 |
| icon-144x144.png | 144×144 |
| icon-152x152.png | 152×152 |
| icon-192x192.png | 192×192 |
| icon-384x384.png | 384×384 |
| icon-512x512.png | 512×512 |
| icon-192x192-maskable.png | 192×192 (logo centré avec ~20% de marge autour, pour l'effet "maskable" sur Android) |
| icon-512x512-maskable.png | 512×512 (même principe) |

**Astuce rapide pour générer toutes les tailles à partir d'un seul logo** : va sur https://realfavicongenerator.net ou https://www.pwabuilder.com/imageGenerator, uploade ton logo en haute résolution (au moins 512×512), télécharge le pack généré, et place les fichiers renommés dans `src/assets/icons/`.

## 5. Build & déploiement
```bash
ng build --configuration production
```
Rien à changer côté Vercel — le build inclut automatiquement le service worker (`ngsw-worker.js`) et le manifest.

## 6. Vérifier que ça marche
Une fois déployé, ouvre le site sur mobile (Chrome Android ou Safari iOS) : un bouton "Ajouter à l'écran d'accueil" doit apparaître. Sur desktop Chrome, une icône d'installation apparaît dans la barre d'adresse.

Pour vérifier techniquement : DevTools → onglet **Application** → **Manifest** (doit afficher ton logo et le nom de l'app) et **Service Workers** (doit montrer `ngsw-worker.js` actif).

## Notes
- Le service worker met en cache les fichiers statiques (JS/CSS/images) et les appels `/api/**` avec une stratégie "freshness" (10s de timeout, fallback sur le cache si le backend Render est en cold start).
- `registerWhenStable:30000` : le service worker s'active 30s après le chargement, pour ne pas ralentir le premier affichage.
