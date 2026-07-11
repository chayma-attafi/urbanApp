# PWA — Progressive Web App (Contrainte C1)

## Qu'est-ce qu'une PWA ?

Une PWA transforme une application web en application native installable.
L'utilisateur peut l'ajouter à son écran d'accueil (mobile ou bureau) et
l'utiliser même sans connexion internet.

---

## Ce qui a été implémenté

### 1. Manifest (`public/manifest.json`)
Fichier JSON décrivant l'application au navigateur :
- Nom, description, couleur de thème (`#22C55E`)
- Mode d'affichage `standalone` (sans barre d'adresse)
- Icônes PNG (192×192 et 512×512) + SVG fallback

### 2. Service Worker (`public/sw.js`)
Script en arrière-plan qui intercepte les requêtes réseau :
- **Install** : pré-cache l'app shell (HTML, manifest, icônes)
- **Activate** : supprime les anciens caches automatiquement
- **Fetch** :
  - Appels `/api/*` → réseau uniquement (jamais mis en cache)
  - App shell → cache d'abord, réseau en fallback (fonctionne hors ligne)

### 3. Enregistrement (`src/main.tsx`)
```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
```

### 4. Icônes (`public/icons/`)
| Fichier | Taille | Usage |
|---------|--------|-------|
| `icon-192.png` | 192×192 | Android home screen, manifest |
| `icon-512.png` | 512×512 | Splash screen, maskable |
| `icon-192.svg` | vectoriel | Fallback navigateurs modernes |
| `icon-512.svg` | vectoriel | Fallback navigateurs modernes |

---

## Vérification dans Chrome DevTools

1. Ouvrir l'app sur `http://localhost:5173`
2. `F12` → onglet **Application**
3. **Manifest** — vérifie que toutes les propriétés sont valides et les icônes chargées
4. **Service Workers** — statut doit être `activated and is running`
5. **Cache storage** — voir les fichiers mis en cache par `urbanflow-v1`

---

## Installer l'app (Desktop)

1. Ouvrir `http://localhost:5173` dans Chrome
2. Dans la barre d'adresse (à droite) → icône d'installation (écran + flèche)
3. Cliquer **"Installer UrbanFlow"**
4. L'app s'ouvre en fenêtre standalone sans barre d'adresse

---

## Installer l'app (Mobile — même réseau WiFi)

1. Trouver l'IP locale du Mac :
   ```bash
   ipconfig getifaddr en0
   ```
2. Sur le téléphone → Chrome ou Safari → `http://[IP]:5173`
3. Chrome : menu **⋮** → **"Ajouter à l'écran d'accueil"**
4. Safari : bouton **Partager** → **"Sur l'écran d'accueil"**

---

## Tester le mode hors ligne

1. DevTools → **Application** → **Service Workers**
2. Cocher **"Offline"**
3. Recharger la page → l'app s'affiche toujours (depuis le cache)
4. Les appels API retournent `{ "detail": "Hors ligne" }` proprement

---

## Lien avec les contraintes du projet

| Contrainte | Exigence | Couvert par |
|------------|----------|-------------|
| C1 — PWA | Manifest, service worker, installable | `manifest.json` + `sw.js` |
| C2 — Responsive | Fonctionne sur tous supports | CSS responsive (breakpoints 960px / 680px) |
| C10 — Performances | Connectivité variable | Cache-first strategy + offline fallback |
