# Cyberswitch website

A static marketing site for the Cyberswitch app: plain HTML, CSS and TypeScript. No framework and no runtime dependencies.

## Run it

Open `index.html` in a browser. That works straight from the folder.

To serve it locally instead:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Edit the TypeScript

The compiled JavaScript is already in `js/`, so you only need Node if you change the code in `src/`.

```bash
npm install      # installs TypeScript
npm run build    # compiles src/*.ts to js/*.js
npm run watch    # recompiles on save
```

## Project layout

```
index.html           Page markup (semantic landmarks, one h1, ARIA where needed)
css/styles.css       Design tokens, layout and components (dark theme)
src/shader.ts        GLSL fragment shader for the 3D background
src/webgl.ts         WebGL setup and scroll-driven keyframes for the 3D object
src/ui.ts            Motion toggle, video control, pinned scroll scene, reveal-on-scroll
src/main.ts          Entry point
js/                  Compiled output (loaded by index.html, in this order:
                     shader.js, ui.js, webgl.js, main.js)
assets/img/          Logo and app screenshots
assets/video/        Onboarding walkthrough (silent, looped)
tsconfig.json        Strict TypeScript config
```

## Things to fill in

- `index.html`, FAQ: the answers for pricing and for platforms other than Google Play are placeholders.
- Brand blue: `--brand: #0c22b5` in `css/styles.css` was matched by eye. Replace it with your exact value.
- Logo: `assets/img/logo-mark.png` was cropped from a screen recording. Swap in your original SVG or a larger PNG.
- Screens: the app screenshots contain sample data and a few typos from the design files ("Mange other Cards", "USD Recieved", "Swap USDC" on an AVAX to XPR swap). Replace them with corrected exports.

## Accessibility notes

- Skip link, landmarks, ordered headings, native `details` for the FAQ.
- Text colours are checked against WCAG AA contrast on the dark background.
- A visible "Pause motion" button stops the ticker, floating cards and the 3D scene. Motion starts paused when the visitor's device asks for reduced motion.
- The onboarding video has its own pause button and a text alternative; the steps are written out next to it.
- Decorative visuals (3D canvas, coin ticker, phone illustration details) are hidden from screen readers.
- Forced-colors (high contrast) styles are included.

## Notes

- The Inter font loads from Google Fonts. Offline, the page falls back to the system font.
- The 3D background needs WebGL. Without it the page uses a CSS orb instead.
- Dark theme only.
