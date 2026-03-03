# Dino Runner

A browser game inspired by the Chrome offline dinosaur game.

## Run locally

### Option 1 (recommended): local static server

From this repository folder:

```bash
python3 -m http.server 4173
```

Then open:

- <http://localhost:4173>

### Option 2: open directly

Open `index.html` in a browser.

## Controls

- `SPACE`: jump
- `SPACE` (after game over): restart

## Features

- `requestAnimationFrame` game loop
- Separate input / update / render flow
- Random obstacle spawning and collision-based game over
- Score increases over time
- High score saved in `localStorage`
- Speed increases gradually over time
- Simple jump / game-over sound effects (if browser audio is available)
