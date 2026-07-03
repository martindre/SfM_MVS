# SfM & MVS: Von Fotos zu präzisen 3D-Modellen

Quarto-Website für das Vertiefungsthema im Modul Visual Computing.

## Lokale Vorschau

```bash
quarto preview
```

Falls Quarto noch nicht installiert ist:

```bash
brew install --cask quarto
```

## Struktur

- `index.qmd`: Startseite und Überblick
- `einleitung.qmd`: Motivation und Use-Cases
- `theorie.qmd`: SfM/MVS-Theorie und interaktive Punktwolken-Demo
- `vergleich.qmd`: Vergleich mit NeRF und 3D Gaussian Splatting
- `hands-on.qmd`: praktischer Workflow mit COLMAP, openMVG/OpenMVS und Open3D
- `eigener-scan.qmd`: Konzept für den eigenen Scan als X-Teil
- `quellen.qmd`: interne Dokumente und priorisierte Quellen
- `assets/`: Bilder, JavaScript, Modelle und spätere Web-Assets

## Rendern

```bash
quarto render
```

Die fertige Website landet in `_site/`.
