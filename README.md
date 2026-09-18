# Portfolio — Alexandre Saakachvili

Site vitrine statique. **Aucune installation, aucun build** : tu édites un fichier, tu pousses, c'est en ligne.

---

## Mettre en ligne

1. Sur GitHub : **Settings → Pages → Source : `Deploy from a branch` → `main` / `root`** → Save
2. Attendre ~1 minute

### L'adresse du site

**https://alexandresaakachvili.github.io/** — le compte GitHub s'appelle `alexandresaakachvili` et le dépôt porte exactement ce nom suivi de `.github.io`, GitHub le sert donc à la racine du domaine. Tous les chemins du site sont relatifs, rien n'est à changer si l'adresse bouge un jour — sauf ceux de `404.html`, qui commencent par `/` : GitHub Pages sert cette page à n'importe quelle adresse manquante, y compris sous `/work/`, et des chemins relatifs y chercheraient `/work/assets/…`.

---

## Structure

```
index.html            Accueil — les 4 catégories de projets, la carte cadenas
profil.html           Profil + jeux préférés
contact.html          Contact
404.html              Page d'erreur
robots.txt            Tout est indexable
.nojekyll             GitHub Pages sert les fichiers tels quels
serve.ps1             Serveur local (voir « Aperçu en local »)
resize.ps1            Redimensionne une photo (voir « La photo de profil »)
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
  js/app.js           Scroll fluide, révélations, curseur, transitions, succès, boutique, shoot 'em up, scores
  js/i18n.js          Traductions anglaises uniquement
  img/                Images (.avif + .webp pour chaque visuel, .webm + .mp4 pour les boucles)
  img/favicon.png     Logo du site (onglet, favoris, écran d'accueil mobile)
  img/portrait*.jpg   Photo de profil, en deux tailles, avec sa version taguée
  img/galagax.jpg     Affiche de la carte cadenas (masque de luminance)
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

Le site n'a **pas de largeur maximale** (`--maxw: none`) : la mise en page est en pourcentages et en `vw`, elle occupe donc toute la largeur sur n'importe quel écran, sans bandes vides sur les côtés. Pour la recentrer avec une largeur bornée, remets une valeur, par exemple `--maxw: 1680px`.

### Modifier un texte français

Directement dans le fichier HTML concerné. Rien d'autre à faire.

### Modifier un texte anglais

Le sélecteur `FR / EN` de la barre est un seul bouton à bascule : un clic n'importe où dessus (FR, EN ou le `/`) passe à l'autre langue, sur ordinateur comme sur mobile. La langue est mémorisée (`localStorage`, clé `as-lang`).

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

Le son est coupé parce qu'aucun navigateur n'autorise la lecture automatique avec son, et le lecteur intégré n'a pas de commandes (`controls=0`, cadre sans pointeur) : pour entendre une vidéo, on clique dessus et elle s'ouvre sur YouTube dans un nouvel onglet.

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

Son **coin bas droit** porte ce qui prolonge le projet : la page Steam ou itch.io, les règles en PDF, ou le badge des Rookie Awards. Un logo, rien d'autre. Sur ordinateur, un clic **n'importe où sur la fiche** ouvre ce lien (`data-href` sur l'`<aside>`) ; sur tactile, seul le logo l'ouvre — la fiche ne s'incline pas, elle s'enfonce sous le doigt.

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
| `external` | flèche sortante |
| `close` | croix |
| `top` | flèche vers le haut |
| `trophy` | trophée (bouton des succès) |
| `lock` | cadenas (carte « Ne pas ouvrir ») |
| `secret` | point d'interrogation (lien « secrets » du profil) |
| `coin` | pièce (succès à réclamer) |
| `swear` | bulle (boutons FR / EN) |

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

**Aucun lien ne télécharge un fichier.** Les quatorze liens vers un PDF — CV et règles de jeu — l'ouvrent dans un nouvel onglet :

```html
<a href="../assets/files/regles-xxx.pdf" target="_blank" rel="noopener" data-cursor="external">…</a>
```

L'attribut `download` n'est plus utilisé nulle part, et l'icône `download` du curseur a été retirée avec lui. Si tu veux qu'un lien force le téléchargement, remets `download` à la place de `target`/`rel`, repasse `data-cursor` à `download`, et rétablis son icône dans l'objet `ICONS`, en haut de `assets/js/app.js`.

---

## Notes techniques

- **Images** : chaque visuel existe en `.avif` (léger, navigateurs récents) et `.webp` (repli universel), servis via `<picture>`. La photo de profil, l'affiche de la carte cadenas et les miniatures de vidéo font exception : un seul format (JPEG) chacune.
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

Le contenu visible est intégralement traduit (324 clés), titres d'onglet et méta-descriptions inclus. Restent en français, volontairement ou par choix de périmètre :

- les **textes alternatifs des images** (`alt`) et les `aria-label` écrits dans le HTML, lus uniquement par les lecteurs d'écran (ceux que le JavaScript fabrique — fermer, succès, diapositives — suivent la langue) ;
- la **page 404**, qui n'a pas de sélecteur de langue ;
- les noms propres (Panthéon → Pantheon est traduit, Tri'Nytia et Kokoro Renzu non — ce sont les titres des jeux).

### Les jeux préférés

Chaque carte de `profil.html` qui existe sur Steam porte `data-href` (la page du jeu) et un logo Steam en bas à droite (`fav__store`). Même règle que la fiche technique : sur ordinateur toute la carte est cliquable, sur mobile seul le logo. Les jeux absents de Steam (Magic, Shadow of the Colossus, League of Legends) n'ont ni l'un ni l'autre.

### Sur mobile

- **Barre** : pas de menu. Les pages autres que la page courante restent dans la barre ; `FR / EN` reste affiché tel quel.
- **Cartes** : pas de suivi du doigt ni de gyroscope — la carte s'enfonce légèrement sous le doigt (`html.is-coarse .card:active`, même chose pour les jeux préférés et la fiche technique) et revient d'un ressort.
- **Particules** : un tap fait éclater quelques losanges, un glissé rapide laisse une traînée (`initTouchFx()`, même calque `.fx` que le curseur PC via `makeFx()`) ; coupé en mouvement réduit. Les taps rapprochés comptent pour les succès de clics.
- **Images agrandies** : pincer ou taper l'image pour zoomer, glisser pour se déplacer, taper à côté pour fermer. Le bouton **Retour** referme l'image au lieu de quitter la page (une entrée d'historique est ajoutée à l'ouverture). À la souris : molette pour zoomer, clic sur l'image pour zoomer/dézoomer, Échap pour fermer.
- **Ordre des blocs** : dans les techniques de LD comme dans les jeux mobiles (`.game__body`), le titre passe au-dessus de la vidéo et le texte en dessous ; dans le combat d'Abandon West, chaque capture précède son explication (`.quad`).

### Le niveau du curseur (ordinateur seulement)

Le curseur dessiné porte un **niveau**, affiché au coin de l'anneau (`LV 7`), mémorisé dans le navigateur (`localStorage`, clé `as-level`) et plafonné à **100 = MAX**.

- **Clic** : +1, éclat de particules, le chiffre rebondit.
- **Paliers 30 et 100** : triple onde, rafale, petite secousse, et le curseur change d'allure (classes `cursor-tier-1` / `cursor-tier-2` sur `<html>`). À 30 : le point **bat** comme un cœur en lâchant une onde fine à chaque battement, et laisse une **traînée** de losanges quand la souris va vite. À 100 : trait plein qui tourne vite autour du point + **halo doré** pulsé ; le point garde un battement doux et la traînée reste. Au survol d'un lien, l'anneau reprend le style du palier (battement, ou halo + trait tournant). Pendant la charge, le rythme et la rotation s'accélèrent avec `--charge`.
- **Maintien** : après 0,26 s, charge de 0,9 s (le point grossit et tourne de plus en plus vite, l'anneau se contracte, des particules convergent — `--charge` de 0 à 1, classes `is-charging` puis `is-charged`). **Relâcher** : grosse rafale, une onde (trois au palier MAX), secousse d'écran, +5 niveaux, et les cartes visibles sont repoussées en vague depuis le curseur (`is-shocked`) avant de revenir par ressort.

Tout vit dans `initLevel()` (`app.js`) et le bloc `.cursor-level` / `.fx` du CSS. Rien de tout cela n'existe sur tactile ni en mouvement réduit : la mécanique est attachée au curseur dessiné, qui n'y est pas.

### Les succès

Cachés au départ. Au premier succès débloqué, un carré avec un trophée apparaît en bas à droite et y reste sur toutes les pages. Sur ordinateur la liste tient sans défiler (panneau jusqu'à 94 % de la hauteur d'écran). Tant qu'une pièce attend d'être réclamée, le carré porte une pastille avec le nombre (`ach__badge`, classe `has-badge` sur le bouton) : ses bords clignotent lentement (2,6 s, pseudo-élément `::after` sous l'icône qui prend au pic l'aspect du survol : bord ambre plein, fond `--ink-3`) et la pastille pulse vite et court (0,4 s, ×1,1). Deux **invitations vers la boutique** passent dans la même file de notifications, étiquetées « Nouveau » au lieu de « Succès débloqué » : « Boutique débloquée » au premier succès, « Nouveautés en boutique » une fois le mini-jeu lancé (au chargement de page ou à la fermeture de l'arène). Chacune ne sort qu'une fois (`noticed` dans `as-ach`) ; tant que l'onglet Boutique n'a pas été ouvert (`shopSeen`, puis `shopSeenNew` après le mini-jeu), l'onglet porte un point ambre qui pulse (`is-new`) et le bouton clignote comme pour une pièce à réclamer (`has-news`). Tableau `NOTICES` dans `app.js`, clés `notice.*` dans `i18n.js`. Chaque nouveau succès transforme ce carré en notification (trophée + « Succès débloqué » + nom, 4,2 s, décomptées seulement onglet visible et fenêtre au premier plan ; une notification en cours survit au changement de page via `sessionStorage`, clé `as-toast`) puis le referme. Un clic sur le carré l'envoie au centre et ouvre la liste : les succès débloqués sont cochés en ambre avec leur nom, les autres affichent `???` et leur condition grisée. Fermeture : croix, clic à côté, Échap.

Mémorisé dans le navigateur (`localStorage`, clé `as-ach` : succès débloqués + pages projet visitées).

La liste est le tableau `ACHIEVEMENTS` (`app.js`, juste avant `initAchievements()`), dans l'ordre d'affichage. Les déclencheurs :

| id | Condition | Où c'est branché |
|---|---|---|
| `profil`, `kokoro`, `trinytia`, `inmachina`, `abandon`, `mobile`, `pyramid`, `pantheon` | ouvrir la page | `PAGE_ACHIEVEMENT` (nom de fichier → succès) |
| `all` | les 7 pages projet visitées | idem, via `visited` |
| `doc` | clic sur un lien `.pdf` | écouteur `click` |
| `zoom` | ouvrir une image en grand | `ouvrir()` du lightbox |
| `lang` | changer de langue | clic sur `FR / EN` (`I18N.init`) |
| `charge` | relâcher une charge du curseur (maintien) | `release()` de `initLevel()` |
| `lvl10` / `lvl30` / `lvl100` | niveau du curseur | `initLevel()` |
| `clicks7` / `clicks15` / `clicks22` | clics (ou taps) en moins de 2 s | `countClick()`, appelé par `initLevel()` à la souris et `initTouchFx()` au doigt |
| `color` | équiper un thème autre que Vanilla dans la boutique | boutique |
| `key` | acheter la clé | boutique |
| `secret` | vaincre le boss | `win()` du combat |

Les succès marqués `pc: true` (niveau, décharge) n'apparaissent pas sur tactile, où le curseur n'existe pas ; ceux des clics rapides se gagnent aussi au doigt. Indices et noms ont leur traduction anglaise dans `i18n.js` (`ach.hint.*`, `ach.name.*`) ; un nom sans clé reste tel quel — c'est le cas des jeux de mots déjà en anglais (« Trust or Shoot ? », « World Builder »…).

### Les pièces et la boutique

Chaque succès débloqué rapporte **une pièce**, mais il faut la **réclamer** : dans la liste, un succès non réclamé montre une pièce qui pulse ; un clic sur la ligne la fait voler jusqu'au compteur en haut à droite du panneau. Le panneau a trois onglets, **Succès**, **Boutique** et **Scores** (le troisième apparaît après le premier lancement du mini-jeu). La pièce est un `.coin` (contour et « A » à deux barres façon ¥ en ambre, rotation continue).

Les produits sont le tableau `PRODUCTS` (`app.js`), avec leur prix et leur genre :

| Produit | Prix | Effet |
|---|---|---|
| Vanilla | possédé et équipé d'office | site orange (`--amber` d'origine) |
| Type psy (« Rain Prince » en anglais) | 2 | site violet (`html[data-theme="psy"]`) |
| Écolo (« In the Matrix » en anglais) | 2 | site vert (`html[data-theme="eco"]`) |
| Encadré | possédé et équipé d'office | le curseur d'origine (`diamond` dans le code) — c'est lui qu'on rééquipe pour quitter Sniper |
| Sniper | 1 | curseur rond : point, carré, ornements et particules en cercles (`html[data-cursor-shape="round"]`) |
| Taggeur | 0 | la photo du profil est remplacée par sa version taguée (`portrait-tag.jpg` / `portrait-tag-sm.jpg` : moustache et cache-œil). Se retire et se remet à volonté (bouton « Retirer » / « Équiper », `tagOn` dans `as-ach`) |
| Clé de cuivre / de jade / de cristal | 5 | une clé — le nom suit le thème équipé (`KEY_NAMES` : Vanilla → cuivre, Écolo → jade, Type psy → cristal ; « Copper / Jade / Crystal key » en anglais), le titre se termine par une icône de clé à la taille du texte (`ICONS.key`, `.shop-item__key`), la description dit « Autant symbole de possibilité que de mystère ». L'achat fait glitcher l'écran un instant et débloque le succès « Et maintenant ? » |
| C'est dans les vieux vaisseaux qu'on fait les meilleurs runs | offert au premier lancement | le sprite de départ, équipé d'office — ajouté aux possessions par `Achievements.played()` et **masqué** (`???`) tant que le mini-jeu n'a pas été lancé une fois, comme les quatre produits ci-dessous |
| Pimp my ride | 1 | autre sprite, flamme de réacteur, tirs ambre avec traînée — verrouillé idem |
| Free hug | 3 | le vaisseau part avec 3 cœurs — **verrouillé** tant que le mini-jeu n'a pas été lancé une fois (`played` dans `as-ach`, posé à l'ouverture de l'arène). Le libellé du verrou dit volontairement « Finir la phase 1 pour débloquer » : c'est un leurre, pour ne pas révéler qu'un mini-jeu existe |
| Nuke | 6 | **Espace** efface tous les ennemis à l'écran (boss excepté) et leurs projectiles, une fois par tentative, pas pendant l'intro — verrouillé idem |
| Mode combat activé | 9 | décharge de clic à 4 dégâts, explosion de charge à 10 — verrouillé idem |

Les thèmes s'équipent l'un à la place de l'autre, les curseurs et les vaisseaux aussi ; le bouton « Équipé » est inactif, on change en équipant l'autre. Le thème et le curseur sont appliqués **avant le premier rendu** par le script en ligne du `<head>` de chaque page (il lit `as-ach`), pour ne pas voir la couleur d'origine clignoter. Tout l'état (succès, pièces réclamées, achats, thème, curseur, vaisseau, dépenses, `played`, `door`) vit dans la même clé `as-ach` ; le bouton « Tout remettre à zéro et relancer le chrono » de l'onglet Scores efface tout, score en attente compris.

#### Sur tactile

La carte cadenas n'existe pas (`html.is-coarse .card--locked{display:none}`), donc ni la clé ni le shoot 'em up. Dans la boutique, les produits marqués `pc: true` (Encadré, Sniper, la clé, les deux vaisseaux, Free hug, Mode combat, Nuke) sont **regroupés à la fin** sous un bandeau « Déblocable sur la version PC du site », sans prix ni bouton — les verrouillés y restent en `???`. Même chose dans la liste des succès : ceux marqués `pc: true` ou `touch: true` (niveau, décharge, « Et maintenant ? », « Content que ça vous ait plu ! ») sont **regroupés à la fin** sous le même bandeau, en `???` avec leur condition, sans pièce à réclamer. Sur ordinateur sans curseur dessiné (mouvement réduit), ceux marqués `pc: true` restent simplement cachés. Le lien « secrets » du profil, qui mène à la carte cadenas, est désactivé sur tactile (`pointer-events:none`). La classe `is-coarse` est posée sur `<html>` par `app.js` d'après `(hover: none), (pointer: coarse)`.

### La carte cadenas et le compteur caché

Dans « Jeux Mobile et Web », la dernière carte est un cadenas fermé (`card--locked`, pas de lien). Son titre « Ne pas ouvrir » **glitche** : par rafales espacées de 0,1 à 1,8 s, quelques lettres sont remplacées un instant par des glyphes ou des majuscules au hasard (`[data-glitch]`, `initGlitch()`). À la place de la description, un **compteur** `HH:MM:SS` (`[data-active-timer]`).

Ce compteur totalise le temps passé sur le site **onglet visible et fenêtre au premier plan** (`initActiveTimer()`, vérification 4×/s, clé `as-time`, toutes les pages). Il ne s'affiche que sur cette carte ; il continue de compter partout ailleurs. Le bouton « Tout remettre à zéro » de l'onglet Scores le remet à zéro aussi.

### Le shoot 'em up

Le clic qui **déverrouille** la carte cadenas (le premier, avec la clé) fait **glitcher l'écran un instant** (`blink()`, 180 ms, `glitch()` en court — coupé en mouvement réduit) — pas les clics refusés ni ceux qui lancent le jeu ; le lien « secrets » du profil fait de même avant de lancer la transition de page. Cliquer la carte **avec la clé** (achat « Clé de cuivre / jade / cristal ») : au premier clic le cadenas **explose** en éclats et laisse place à l'affiche rétro (`assets/img/galagax.jpg`, utilisée comme masque de luminance sur un fond couleur du site : les lignes prennent la couleur du thème), le titre devient « GALAGAX » (toujours glitché) et ce nouvel état est mémorisé (`door` dans `as-ach`). Ce premier clic n'ouvre pas le jeu ; les clics suivants font de la carte une arène de 1240 × 820 (ou 96 % × 92 % de l'écran) sur fond d'espace étoilé (`initFight()`, `app.js`). Sans clé, la carte tremble. Le curseur dessiné est masqué dans l'arène : **le vaisseau suit la souris**.

**Tirer** — tir automatique vers le haut (2,5 coups/s, 1 dégât) ; clic = champ de force autour du vaisseau (rayon 72 px, 2 dégâts aux ennemis proches et au boss s'il est dedans, 0,22 s de recharge — ne touche pas aux projectiles) ; maintien = charge (plus de tir pendant) puis explosion dans un rayon de 300 px autour du vaisseau : tue net tous les ennemis (sbires, tourelles, générateurs…) dans la zone et inflige 5 dégâts au boss s'il est dedans — ni l'un ni l'autre ne détruit les projectiles : on les esquive.

**Vaisseau** — 2 cœurs. Le HUD en bas à gauche empile, de bas en haut : les cœurs, les balles (`↑`, 5 pastilles), la cadence (`»`, 5 barres croissantes), puis le rappel des commandes : `[ MAINTIEN ] : décharge`, `[ CLIC ] : champ de force` et, si le perk est acheté, `[ ESPACE ]` avec la bombe tout en haut (clés `fight.click`, `fight.hold`, `fight.*.what` dans `i18n.js`). Un coup (contact ou projectile) retire un cœur, donne 1,2 s d'invulnérabilité et **retire un cran de balles et un cran de cadence** (pas tout). Pour marquer l'impact : arrêt sur image de 0,12 s (la simulation se fige, le rendu continue), secousse forte et glitch plein écran de 0,2 s — le même que celui de la défaite, en court (`g.freeze`, `glitch(200)` dans `hurtShip()`).

**Bonus** (14 % de chance par ennemi tué, 28 % pour les fonceurs, à ramasser en passant dessus) : `↑` balle +1 (jusqu'à 5 en parallèle, ne tombe plus au maximum), un cœur en pixels (ne tombe plus à pleine vie), un écusson = bouclier 3 s (plein, puis clignote de plus en plus vite dans sa dernière seconde), une bombe à tête de mort (tue tout, 10 dégâts au boss), la pièce « A » (ajoutée à la réserve, clé `coins` dans `as-ach`), `»` cadence +1 (5 crans, de 2,5 à 5,5 coups/s).

**Ennemis** — chercheurs (phase 1 seulement, toutes les 6,7 s : 10 PV, tête chercheuse à 90 px/s, explosent à la mort dans 110 px — ça blesse le vaisseau et tue les ennemis proches — et lâchent **toujours** un bonus), drones (1 PV, sprite « insecte », forte ondulation de ±90 px), fonceurs (traversent vite en diagonale), suiveurs (visent le vaisseau), vagues en formation (2 lignes de 7 invaders à 1 PV), tourelles (5 PV, aux deux angles hauts dès la phase 2 — elles arrivent en premier dans le créneau « lourd », toutes les 9 s, 7 s en phase 3 —, tir visé toutes les 1,2 s), générateurs (15 PV, gros hexagone qui ondule et crache des vagues de 3 drones toutes les 3,2 s ; un seul à la fois, une fois les deux tourelles en place).

**Boss** — toujours vulnérable, 3 phases cumulatives (100 / 125 / 150 PV, la barre de vie affiche les points ; « PHASE 2 » et « PHASE 3 » s'affichent 1,6 s au changement). En phase 1, tous les ennemis vont 1,5× plus vite : ① tirs visés, drones, fonceurs, formations, chercheurs ; ② + éventails de 5 balles, suiveurs, tourelles puis générateur, cadence accrue ; à chaque changement de phase le boss garde sa position et devient invulnérable 2 s en clignotant ; ③ + double spirale bullet hell, triple tir visé, mouvement rapide. À partir de la phase 2, un léger glitch permanent (bandes et blocs, `softGlitch`, plus fort en phase 3) ; en phase 3, l'écran est en plus secoué toutes les 4 à 7 s.

**Défaite** : « VAISSEAU DÉTRUIT », glitch 1 s, faux écran 404 persistant avec un bouton **Relancer** (`crash__retry`, EN « Retry ») qui recharge la page sur la carte GALAGAX (`index.html#galagax`, la carte cadenas porte cet `id` et un `scroll-margin-top` pour passer sous la barre) ; le cadenas reste ouvert, la partie repart de zéro. La flèche système est rendue sur cet écran, le curseur dessiné y étant masqué. **Victoire** : explosion, feux d'artifice, « Bravo, vous avez résolu le secret en 9:29 » (minutes:secondes, heures devant si besoin), couronne sur le `LV` du curseur et succès « Content que ça vous ait plu ! ».

Les constantes sont groupées au début de `initFight()` (`BOSS_HP`, `TYPES`) et dans `step()`. Pas de croix : Échap abandonne sans conséquence tant que la partie est en cours ; une fois gagnée ou perdue, ni Échap ni rien d'autre ne ferme l'arène (la victoire la referme seule après 6,5 s, la défaite laisse le faux 404). **W** déclenche la victoire — uniquement quand le site est servi depuis `localhost` (`serve.ps1`), pour tester la fin de partie ; en ligne la touche ne fait rien.

### Le tableau des scores

Troisième onglet du panneau, **Scores**, visible dès que le mini-jeu a été lancé une fois (comme les produits verrouillés). Il liste les **20 meilleurs temps** pour percer le secret — le temps est le compteur caché au moment de la victoire. Quand tu gagnes avec un temps qui entre dans le top 20, le panneau s'ouvre sur cet onglet avec une ligne « ton temps + ton nom + Enregistrer » ; le nom est mémorisé pour la prochaine fois (`as-name`). Le bouton **« Tout remettre à zéro et relancer le chrono »** efface niveau, succès, achats, compteur et score en attente (mais pas le tableau ni la langue) puis recharge la page : départ propre pour un speedrun.

#### Local ou mondial

Le tableau est **mondial** : il vit dans un projet **Supabase** (gratuit) configuré dans `app.js` (`SCORES_API`, juste avant l'objet `Scores` : URL du projet + clé publique `sb_publishable_…`). Une copie locale (`as-scores`) sert de cache si le réseau manque. Pour recréer le projet ailleurs :

1. Créer un projet sur supabase.com, puis dans *SQL editor* :
   ```sql
   create table scores (id bigserial primary key, name text not null, time integer not null, date text not null, created_at timestamptz default now());
   alter table scores enable row level security;
   create policy "read" on scores for select using (true);
   create policy "insert" on scores for insert with check (char_length(name) <= 16 and time > 0);
   ```
2. Dans *Settings → API*, copier l'URL du projet et la clé publique (`sb_publishable_…`).
3. Dans `app.js`, remplacer les deux valeurs de `SCORES_API` :
   ```js
   var SCORES_API = { url: "https://xxxx.supabase.co", key: "sb_publishable_..." };
   ```

Dès lors, chaque page charge le top 20 distant au démarrage, un score enregistré est envoyé puis le tableau relu, et l'onglet ouvert se rafraîchit toutes les 30 s. La clé est publique par nature : n'importe qui peut donc envoyer un score forgé — c'est la limite d'un classement sans serveur de confiance ; la policy ci-dessus borne au moins le nom à 16 caractères et le temps à une valeur positive.
