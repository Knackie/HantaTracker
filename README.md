# HantaTracker

HantaTracker est un tableau de bord statique inspiré de CovidTracker, conçu pour suivre des signalements d’hantavirus avec une logique open data et une traçabilité GitHub.

Le MVP utilise comme source principale le bulletin OMS Disease Outbreak News du 8 mai 2026 :
https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600

## Déploiement GitHub Pages

Crée un dépôt GitHub, copie tous les fichiers à la racine, puis pousse le projet.

```bash
root@debian1:~/hantatracker# git init
root@debian1:~/hantatracker# git add .
root@debian1:~/hantatracker# git commit -m "Initial HantaTracker"
root@debian1:~/hantatracker# git branch -M main
root@debian1:~/hantatracker# git remote add origin https://github.com/TON_USER/hantatracker.git
root@debian1:~/hantatracker# git push -u origin main
```

Ensuite, dans GitHub : Settings > Pages > Build and deployment > Source > Deploy from a branch. Choisir la branche `main` et le dossier `/root`.

L’URL sera généralement :

```txt
https://TON_USER.github.io/hantatracker/
```

## Modifier les données

Les chiffres sont dans :

```txt
data/hantavirus.json
```

Chaque modification doit garder une source officielle, une date de publication et un lien.

## Structure

```txt
index.html
 data.html
 prevention.html
 github.html
 assets/styles.css
 assets/app.js
 assets/data.js
 data/hantavirus.json
 README.md
```

## Attention

Ce site n’est pas un outil médical. Il sert uniquement à présenter des données publiques de manière lisible.
