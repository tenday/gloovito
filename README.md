# GLOOVITO — Kinetic Cinema Webapp (Revision 2)

Campagna di Pre-Lancio Kickstarter per **GLOOVITO**: il sistema modulare di guanti termici (**GLOOVITO URBAN-01** e **GLOOVITO ALPINE-PRO**) con capsula inerziale magnetica rimovibile (**GLOOVITO POD-S1**) e controllo gestuale nativo **Bluetooth Low Energy HID** a schermo bloccato.

## Struttura del Progetto

- `index.html` — Landing page Pre-Lancio Kickstarter (Revisione 2 — Kinetic Cinema Edition).
- `styles.css` — Design system *Prada Linea Rossa × Arc'teryx Veilance × Teenage Engineering*, griglia architettonica svizzera, 3D Perspective Tilt e Shutter Reveal.
- `app.js` — Motore interattivo:
  - Cursore magnetico cinematografico.
  - 3D Tilt con riflesso speculare dinamico e parallasse sulle targhette modello.
  - Teatro animato **Swap Magnetico** (`URBAN-01 ⇄ ALPINE-PRO`).
  - Simulatore CAD del **GLOOVITO POD-S1** + 5 gesti con oscillogramma IMU a 6 assi e audio tattile (Web Audio API).
  - Sondaggio interattivo Co-Creazione per i Founding Backers.
- `assets/`
  - `urban-01-studio.jpg` — Fotografia editoriale **GLOOVITO URBAN-01**.
  - `alpine-pro-action.jpg` — Fotografia action **GLOOVITO ALPINE-PRO**.
  - `pack-2in1-flatlay.jpg` — Flat-lay zenitale **All-Winter Pack 2-in-1**.

## Avvio Locale

```bash
python -m http.server 8090
```

Poi apri `http://localhost:8090` nel browser.
