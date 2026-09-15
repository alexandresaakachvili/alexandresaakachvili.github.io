# Portfolio — Alexandre Saakachvili

Site vitrine statique. **Aucune installation, aucun build** : tu édites un fichier, tu pousses, c'est en ligne.

---

## Mettre en ligne

1. Sur GitHub : **Settings → Pages → Source : `Deploy from a branch` → `main` / `root`** → Save
2. Attendre ~1 minute

### ⚠️ À propos de l'adresse du site

Un repo nommé `<pseudo>.github.io` ne donne l'adresse racine **que si `<pseudo>` est ton nom de compte GitHub**.

Ton compte s'appelle `trinytia`, donc le repo actuel sortira sur :

```
https://trinytia.github.io/alexandresaakachvili.github.io/
```

Pour obtenir **`https://alexandresaakachvili.github.io`**, renomme le compte GitHub en `alexandresaakachvili` (Settings → Account → Change username). Les anciens liens sont redirigés automatiquement.

Le site utilise des chemins relatifs : il fonctionne dans les deux cas.

---

## Structure

```
index.html            Accueil — les 4 catégories de projets
profil.html           Profil + jeux préférés
contact.html          Contact
404.html              Page d'erreur
work/
  pyramid-shadow.html
  kokoro-renzu.html
  abandon-west.html
  in-machina.html
  mobile-games.html
  tri-nytia.html
  pantheon.html
assets/
  css/main.css        Tout le style (variables CSS en haut du fichier)
  js/app.js           Scroll fluide, révélations, curseur, transitions
  js/i18n.js          Traductions anglaises uniquement
  img/                Images (.avif + .webp pour chaque visuel, .gif pour les animations)
  img/video/          Miniatures des vidéos YouTube (une par identifiant)
  files/              CV et règles de jeux en PDF
```

---

## Tâches courantes

### Changer une couleur, une police, un espacement

Tout est en haut de `assets/css/main.css`, dans le bloc `:root`. Par exemple, passer le site en fond clair :

```css
--ink: #F4E6D0;    /* fond */
--cream: #0A0A0A;  /* texte */
```

### Modifier un texte français

Directement dans le fichier HTML concerné. Rien d'autre à faire.

### Modifier un texte anglais

Dans `assets/js/i18n.js`. Chaque élément traduisible porte un attribut `data-i18n="une.cle"` dans le HTML ; retrouve la même clé dans `i18n.js` et modifie la valeur.

```html
<p data-i18n="hero.scroll">Faire défiler</p>
```
```js
"hero.scroll": "Scroll",
```

Si tu ajoutes un texte et que tu veux qu'il soit traduit : mets-lui un `data-i18n="ma.nouvelle.cle"` et ajoute la clé dans `i18n.js`. Sans clé, le texte reste identique dans les deux langues.

### Ajouter ou remplacer une vidéo

Les 33 vidéos du site sont tes vidéos YouTube en **non répertoriées**. Elles se **lancent seules, en boucle et sans son** dès qu'elles entrent dans l'écran, et continuent de tourner ensuite — y compris quand on remonte plus haut. Tant qu'elles n'ont pas démarré, la page n'affiche qu'une miniature stockée en local : rien n'est demandé à YouTube.

Les captures de jeux mobiles sont en portrait. Elles portent la classe `video--portrait`, qui passe le cadre en 9/16 et borne sa largeur.

Le son est coupé au départ parce qu'aucun navigateur n'autorise la lecture automatique avec son — le visiteur l'active dans les contrôles du lecteur. C'est une contrainte des navigateurs, pas un réglage du site.

Pour ajouter une vidéo :

1. Récupère son identifiant — les 11 caractères après `youtu.be/` ou `?v=`
2. Télécharge sa miniature dans `assets/img/video/<identifiant>.jpg` :
   `https://i.ytimg.com/vi/<identifiant>/maxresdefault.jpg`
3. Colle ce bloc à l'endroit voulu (depuis une page de `work/`) :

```html
<figure class="video-figure" data-reveal>
  <div class="video" data-video="IDENTIFIANT" data-title="Titre du jeu" data-cursor="play">
    <img class="video__poster" src="../assets/img/video/IDENTIFIANT.jpg" alt="" loading="lazy" decoding="async">
  </div>
</figure>
```

Pour démarrer la vidéo ailleurs qu'au début, ajoute `data-start="112"` sur le `<div class="video">` — la valeur est en **secondes** (112 = 1 min 52).

```html
```

Pour deux vidéos côte à côte, enveloppe-les dans `<div class="media-grid media-grid--2">` (ou `--3` pour trois).

Les vidéos et les images n'ont pas de légende : le site n'affiche que les textes du site Wix d'origine, sans rien y ajouter.

Le cadre YouTube ne prend **jamais** le pointeur. Un `<iframe>` est un document à part : ni la molette ni les mouvements de souris qui le survolent ne reviennent à la page. Le laisser capter le pointeur bloquait le défilement et figeait le curseur dessiné, la flèche Windows réapparaissant par-dessus. Le clic sur une vidéo **ouvre donc YouTube dans un nouvel onglet**.

**Attention** : si tu repasses une vidéo en *privée* sur YouTube, l'embed cesse de fonctionner. *Non répertoriée* est le bon réglage — c'est déjà le cas.

### Les captures en boucle

Trois séquences tournent en boucle sans son, comme le faisaient des GIF : le gameplay et le marchand d'In_Machina, et le blockout de la Pyramide. Ce ne sont plus des GIF — un GIF stocke chaque image entière, sans compression d'une image à l'autre, d'où son poids. Les mêmes séquences en vidéo sont **quinze à vingt fois plus légères** :

| | GIF | WebM | MP4 |
|---|---|---|---|
| `inmachina-gameplay` | 12 Mo | 1,3 Mo | 676 Ko |
| `inmachina-shopkeeper` | 7,3 Mo | 364 Ko | 372 Ko |
| `pyramid-blockout` | 712 Ko | 64 Ko | 164 Ko |

```html
<video class="loop" autoplay muted loop playsinline preload="metadata"
       poster="../assets/img/NOM-poster.webp" aria-label="Titre du jeu">
  <source src="../assets/img/NOM.webm" type="video/webm">
  <source src="../assets/img/NOM.mp4" type="video/mp4">
</video>
```

Le WebM passe en premier, le MP4 sert de repli : c'est le seul format qu'aucun navigateur ne refuse, y compris les Firefox compilés sans H.264. La classe `loop` coupe les événements de pointeur — la séquence se comporte comme une image, pas comme une vidéo : ni commandes, ni son, ni clic. Le `poster` est la première image, pour ne pas montrer un cadre noir le temps du chargement.

Pour en convertir une nouvelle, il faut `ffmpeg` :

```
ffmpeg -i entree.gif -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" \
       -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -an sortie.webm
ffmpeg -i entree.gif -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" \
       -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an sortie.mp4
ffmpeg -i entree.gif -frames:v 1 -q:v 78 sortie-poster.webp
```

`format=yuv420p` aplatit le canal alpha que les GIF déclarent et que ni l'un ni l'autre encodeur ne prend ; `trunc(iw/2)*2` force des dimensions paires, exigées par le 4:2:0.

### La fiche technique d'une page projet

En haut à droite de chaque page projet, en face de la phrase de présentation, une petite carte donne le rôle, le moteur, l'effectif et la durée : un pictogramme et une valeur par ligne, le moins de texte possible. Elle réagit au survol comme les cartes de l'accueil.

Son **coin bas droit** porte ce qui prolonge le projet : la page Steam ou itch.io, les règles en PDF, ou le badge des Rookie Awards. Un logo, rien d'autre. Sur ordinateur, un clic **n'importe où sur la fiche** ouvre ce lien (`data-href` sur l'`<aside>`) ; sur mobile, seul le logo l'ouvre, le doigt posé sur la fiche servant à l'incliner.

```html
<aside class="spec" data-tilt="soft" data-reveal data-reveal-delay=".1" aria-label="Fiche technique"
       data-href="https://store.steampowered.com/app/…" data-cursor="external">  <!-- data-href : facultatif -->
  <span class="spec__inner">
    <span class="meta-chip"><svg …>mallette</svg> <span data-i18n="xx.role">Game Design</span></span>
    <span class="meta-chip"><svg class="meta-chip__logo" …>logo moteur</svg> Unity</span>
    <span class="meta-chip"><svg …>silhouettes</svg> 6</span>
    <span class="meta-chip"><svg …>horloge</svg> <span data-i18n="xx.duration">5 mois</span></span>
  </span>
</aside>
```

Le coin bas droit est un `spec__corner`, placé en dernier dans `spec__inner`. Lien (Steam, itch.io, PDF) ou simple badge :

```html
<a class="spec__corner" href="../assets/files/regles-xxx.pdf" target="_blank" rel="noopener" aria-label="Règles (PDF)" data-cursor="external">
  <svg …>icône document</svg>          <!-- ou <svg class="spec__corner-logo">logo Steam / itch.io</svg> -->
</a>
<span class="spec__corner spec__corner--badge"><img src="../assets/img/badge-rookie-awards.webp" alt="…"></span>
```

Les logos Steam et itch.io viennent de Simple Icons ; ils se recopient depuis `work/abandon-west.html` et `work/in-machina.html`.

Les pictogrammes se recopient d'une page à l'autre. Les logos de marque (Unity, Unreal) portent la classe `meta-chip__logo` : ce sont des aplats, pas des dessins au trait.

### Un carrousel d'images

Plusieurs visuels dans le même cadre, avec des flèches et une pastille par vue. Le JavaScript fabrique les pastilles tout seul : il suffit de laisser le `<div class="carousel__dots">` vide.

Il **tourne seul toutes les 3 secondes** et se met en pause tant que le pointeur reste dessus — ainsi que pendant qu’on regarde un autre onglet. Une flèche ou une pastille cliquée relance le compte à zéro. Si le visiteur a demandé de réduire les animations, le carrousel ne bouge plus tout seul.

```html
<div class="carousel" data-carousel data-reveal>
  <div class="carousel__win">
    <div class="carousel__track">
      <figure class="carousel__slide">…première image…</figure>
      <figure class="carousel__slide">…deuxième image…</figure>
    </div>
  </div>
  <button type="button" class="carousel__nav carousel__nav--prev" aria-label="Visuel précédent">…</button>
  <button type="button" class="carousel__nav carousel__nav--next" aria-label="Visuel suivant">…</button>
  <div class="carousel__dots"></div>
</div>
```

### Agrandir une image au clic

Tous les visuels de contenu s’agrandissent sur toute la page quand on clique dessus : ceux qui sont dans un `<figure class="figure">` ou dans une diapositive de carrousel. Rien à ajouter dans le HTML, le JavaScript s’en charge et pose lui-même l’œil du curseur sur les visuels concernés.

Sont écartés : les vignettes de vidéo, le badge de la fiche technique, et tout visuel déjà contenu dans un lien — le clic doit continuer d’y mener. Pour retirer un visuel de l’agrandissement, sors-le de `.figure` ou enveloppe-le dans un lien.

On referme avec la croix, la touche Échap, ou un clic n’importe où sur le voile.

### Le pied de page et le retour en haut

Une seule rangée en bas de chaque page : les coordonnées à gauche, la flèche de retour en haut au milieu. La rangée compte **trois colonnes dont la dernière reste vide** — sans quoi la flèche se centrerait sur la place laissée par les liens, et non sur la page.

Le mail et le téléphone sont des `<button data-copy>` : cliquer copie la valeur dans le presse-papiers, sans rien afficher en retour. Ils gardent leur casse d'origine, contrairement aux libellés LinkedIn et CV qui sont en capitales.

La flèche n'a ni filet ni fond : elle ne doit pas concurrencer les liens. Elle monte et redescend en continu pour attirer l'œil. Son libellé reste dans le code en `sr-only` — invisible à l'écran, mais il nomme le bouton pour les lecteurs d'écran et suit le changement de langue.

```html
<div class="shell footer-row" data-reveal>
  <div class="footer-links">…mail, téléphone, LinkedIn, CV…</div>
  <button type="button" class="to-top" data-to-top data-cursor="top">
    <svg …>flèche vers le haut</svg>
    <span class="sr-only" data-i18n="ui.top">Haut de page</span>
  </button>
</div>
```

### Le curseur personnalisé

Au survol, l'anneau du curseur grandit et affiche une **icône** (pas de texte, donc rien à traduire). L'icône est choisie par l'attribut `data-cursor` :

| Valeur | Icône |
|---|---|
| `home` | maison |
| `view` | œil |
| `play` | triangle de lecture |
| `copy` | copier |
| `download` | flèche de téléchargement |
| `external` | flèche sortante |
| `phone` | téléphone |
| `scroll` | flèche vers le bas |

Sans attribut, un lien externe prend `external` et tout le reste `view`. Pour ajouter une icône, complète l'objet `ICONS` en haut de `assets/js/app.js` (un fragment SVG en `viewBox="0 0 24 24"`, tracé au trait ; ajoute `class="solid"` sur un `path` qui doit être rempli).

### La page contact

Le mail et le téléphone **copient l'information dans le presse-papiers** au lieu d'ouvrir une application. Le texte copié est dans l'attribut `data-copy` — pense à le mettre à jour si tu changes le numéro affiché. Aucun élément de cette liste ne déclenche la transition de page, grâce au `data-no-transition` porté par le conteneur.

### La transition entre les pages

Écrite à la main dans `runTransition()` (`assets/js/app.js`) : la page en cours recule à 92 % et s'arrondit comme une carte, pendant qu'un panneau monte du bas et la recouvre. La page suivante enchaîne en remontant. Une seule durée à régler :

```js
var SLIDE = 540;  // millisecondes
```

Deux détails qui ont leur raison d'être : le panneau est accroché à `<html>` et non à `<body>`, parce que `body` est justement mis à l'échelle et qu'un enfant rétrécirait avec lui ; et `<html>` a un fond noir, sans quoi le fond de `body` se propagerait au canevas du navigateur et les coins arrondis de la carte ne se verraient pas.

Si le visiteur a demandé moins d'animations, la transition est remplacée par une navigation directe.

### La photo de profil

`assets/img/portrait.jpg` (1000 px) et `portrait-sm.jpg` (600 px) pour les petits écrans. Le cadre est carré et borné sur ses deux dimensions :

```css
aspect-ratio:1/1;
max-width:min(52vh,470px);
max-height:min(52vh,470px);
```

Les deux bornes vont ensemble : avec un `aspect-ratio`, ne limiter que la hauteur laisserait la colonne imposer la largeur et le cadre cesserait d'être carré.

Pour remplacer la photo, le script de redimensionnement est réutilisable :

```
powershell -File resize.ps1 -Source "photo.jpg" -Destination "assets\img\portrait.jpg" -MaxWidth 1000 -Quality 84
```

### Les conventions d'espacement

Aucune valeur d'espacement n'est écrite dans le HTML : tout passe par ces classes, pour que le rythme reste le même d'une page à l'autre.

| Classe | À quoi elle sert |
|---|---|
| `.block` | Une section de page. Gouttière haute et basse identiques, de 2,6 à 6 rem selon la hauteur de l'écran. Deux sections voisines laissent donc le double. |
| `.block--flush-bottom` | Annule la gouttière basse : la section suivante se colle. À poser sur la **vidéo d'ouverture**, pour que le texte qui la commente lui reste attaché. |
| `.block--flush-top` | L'inverse, quand c'est la section du bas qui doit se rapprocher. |
| `.mt-l` / `.mb-l` | Un intervalle large **à l'intérieur** d'une section, entre deux groupes. |
| `.stack` | Espace régulier entre les enfants d'un bloc — à préférer à une marge posée sur un paragraphe. |
| `.page-top` / `.page-bottom` | Marges d'une page qui n'a pas d'en-tête de projet (accueil, profil). `.page-top` dégage la barre de navigation. |

Les quatre pages qui commencent par une vidéo suivent toutes la même ouverture :

```html
<section class="shell block block--flush-bottom">…la vidéo…</section>
<section class="shell block">…le texte d'introduction…</section>
```

Les délais de révélation suivent une échelle courte : `.05` pour la phrase qui suit le titre, `.1` pour la fiche technique, `.08` pour la seconde colonne d'un duo, `.06` puis `.12` pour les éléments successifs d'une grille.

### Ajouter un projet

1. Duplique la page la plus proche dans `work/` et renomme-la
2. Ajoute une carte dans `index.html`, dans la bonne catégorie (`<section class="cat">`), en copiant un bloc `<a class="card">` existant
3. Ajoute son visuel de couverture dans `assets/img/` en `.avif` et `.webp`
4. Renseigne les pictogrammes de moteur, d'effectif et de durée dans le `<span class="card__meta">`

L'apparition en cascade et les délais se calculent tout seuls : la grille porte `data-stagger` et le JS en déduit le nombre de colonnes.

### Remplacer le CV

Écrase `assets/files/cv-alexandre-saakachvili.pdf` en gardant le même nom : tous les liens continuent de fonctionner.

**Aucun lien ne télécharge un fichier.** Les treize liens vers un PDF — CV et règles de jeu — l'ouvrent dans un nouvel onglet :

```html
<a href="../assets/files/regles-xxx.pdf" target="_blank" rel="noopener" data-cursor="external">…</a>
```

L'attribut `download` n'est plus utilisé nulle part, et l'icône `download` du curseur a été retirée avec lui. Si tu veux qu'un lien force le téléchargement, remets `download` à la place de `target`/`rel`, repasse `data-cursor` à `download`, et rétablis son icône dans l'objet `ICONS`, en haut de `assets/js/app.js`.

---

## Notes techniques

- **Images** : chaque visuel existe en `.avif` (léger, navigateurs récents) et `.webp` (repli universel), servis via `<picture>`. Les GIF animés, la photo de profil et les miniatures de vidéo font exception : un seul format chacun.
- **Librairies** : [Lenis](https://github.com/darkroomengineering/lenis) pour le scroll fluide et [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) pour la parallaxe, chargées depuis un CDN. Si elles ne se chargent pas, le site reste entièrement lisible et navigable — les animations disparaissent, c'est tout.
- **Polices** : Archivo pour tout le texte — la hiérarchie se fait par la graisse et la chasse, pas par un changement de famille — et JetBrains Mono pour les petits libellés. Via Google Fonts.
- **Accessibilité** : `prefers-reduced-motion` est respecté — toutes les animations, le curseur personnalisé et le scroll fluide sont désactivés pour les personnes qui en ont besoin.
- **`.nojekyll`** : présent pour que GitHub Pages serve les fichiers tels quels.
### Aperçu en local — ⚠️ ne pas double-cliquer sur index.html

Ouvrir le fichier en double-clic utilise le protocole `file://`, sans origine HTTP. **YouTube refuse alors de lire les vidéos intégrées et affiche l'erreur 153.** Ce n'est pas un bug du site.

Lance le serveur fourni :

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

puis ouvre **http://localhost:8080**. `Ctrl+C` pour arrêter. Le script n'a besoin d'aucune installation ni de droits administrateur (il utilise un `TcpListener`, pas `HttpListener`).

En production sur GitHub Pages, le problème ne se pose pas : le site est servi en HTTPS.

### Ce qui reste en français quand on passe en anglais

Le contenu visible est intégralement traduit (289 clés), titres d'onglet et méta-descriptions inclus. Restent en français, volontairement ou par choix de périmètre :

- les **textes alternatifs des images** (`alt`) et les `aria-label`, lus uniquement par les lecteurs d'écran ;
- la **page 404**, qui n'a pas de sélecteur de langue ;
- les noms propres (Panthéon → Pantheon est traduit, Tri'Nytia et Kokoro Renzu non — ce sont les titres des jeux).

### L'adresse du site

**https://alexandresaakachvili.github.io/**

Le compte GitHub a été renommé `alexandresaakachvili`, et le dépôt porte exactement ce nom suivi de `.github.io` : GitHub le sert donc à la racine du domaine. Tous les chemins du site sont relatifs, rien n'est à changer si l'adresse bouge un jour.

### Les jeux préférés

Chaque carte de `profil.html` qui existe sur Steam porte `data-href` (la page du jeu) et un logo Steam en bas à droite (`fav__store`). Même règle que la fiche technique : sur ordinateur toute la carte est cliquable, sur mobile seul le logo. Les jeux absents de Steam (Magic, Shadow of the Colossus, League of Legends) n'ont ni l'un ni l'autre.

### Sur mobile

- **Barre** : pas de menu. Les pages autres que la page courante restent dans la barre ; la langue se replie en `FR ▾`, qui se déroule vers le bas.
- **Cartes** : elles suivent l'inclinaison du téléphone quand le gyroscope est accessible (sur iPhone, l'autorisation est demandée au premier toucher d'une carte). Sans capteur, elles oscillent seules (`html.tilt-idle`). Un doigt posé sur une carte l'incline comme la souris le ferait, sans bloquer le défilement ; un appui long n'ouvre pas le lien.
- **Images agrandies** : pincer ou taper l'image pour zoomer, glisser pour se déplacer, taper à côté pour fermer. Le bouton **Retour** referme l'image au lieu de quitter la page (une entrée d'historique est ajoutée à l'ouverture). À la souris : molette pour zoomer, clic sur l'image pour zoomer/dézoomer, Échap pour fermer.
- **Ordre des blocs** : dans les techniques de LD, le titre passe au-dessus de la vidéo ; dans les jeux mobiles, la capture passe au-dessus du texte ; dans le combat d'Abandon West, chaque capture précède son explication (`.quad`).
