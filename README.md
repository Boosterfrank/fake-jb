# liveboot

A fake iPhone "liveboot": a pongoOS-style console, a wall of verbose boot text, then the Apple logo with a boot progress bar. It is a one-shot prop that runs for 45 seconds and then stops. Nothing loops, no line is ever repeated, and nothing is real: it is plain HTML, CSS and JavaScript drawing text on a black page.

It is packaged as a Progressive Web App and **only runs when launched from the Home Screen**. Opened in a normal browser tab it shows install instructions instead, so the boot can never play inside Safari's chrome. Once installed it opens full screen on black and works offline.

## What happens when you open it

| From | Phase | What you see |
|---|---|---|
| 0 s | black | screen stays dark for a moment |
| 0.6 s | pongoOS console | the whole banner at once, then `sep pwn` / `sep boot`, then the pixel logo centred on screen |
| 10 s | verbose boot | about 300 kernel/driver style lines flying by in bursts, with a few short stalls |
| 33 s | Apple logo | logo centred, progress bar below it filling in steps |
| 45 s | done | bar is full; a few seconds later a dim "tap to run again" appears |

After it finishes, a tap anywhere starts a fresh run. It never restarts on its own.

## Install on an iPhone

1. Host the folder over HTTPS (see below) and open the URL in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open it from the Home Screen. It launches full screen on a black background and starts immediately.

Everything is cached by a service worker on the first visit, so later launches work with no network.

## Hosting

Any static host works; nothing needs building. The repository includes a GitHub Pages workflow (`.github/workflows/pages.yml`):

1. In the repository settings, under **Pages**, set the source to **GitHub Actions**.
2. Push to `main` (or run the workflow manually). The site appears at `https://<user>.github.io/<repo>/`.

All paths are relative, so it also works from a sub-folder.

To try it locally:

```sh
python3 -m http.server 8123
# then open http://localhost:8123/
```

## Customising

- **Text and timing** live at the top of `app.js`: `PONGO_A` / `PONGO_B` are `[line, pause-after-ms]` pairs, `XNU` is a list of lines with numbers for pauses between bursts (some sections are generated from small tables with a fixed seed, so every run prints the same lines), `PROGRESS` holds the progress-bar steps. The total length is the sum of those pauses; `window.LIVEBOOT.totalMs` reports it in the console.
- **Home Screen only**: the gate is `isStandalone()` in `app.js`. To preview in a desktop browser while editing, temporarily make it return `true`.
- **Font sizes** are the `--fs` variables in `style.css` (`#screen.pongo`, `#screen.xnu`).
- **Logo** is generated in code in `logo.js` (Apple silhouette, rook cut-out, chessboard dither). Regenerate the icons after changing it with `node tools/make-icons.mjs` (needs Playwright).

Bump `CACHE` in `sw.js` whenever you change files, so installed copies pick up the new version.

## Limits worth knowing

- iOS always draws the clock, signal and battery over Home Screen web apps. The only control a page has is the status-bar *style* (default, black, black-translucent); none of them hides it, and iPhone has no Fullscreen API for page content. This app uses black-translucent so the icons float over the black console rather than sitting in a separate bar.
- The screen wake lock is requested where the browser supports it (iOS 16.4+); otherwise the normal auto-lock timer applies.
- If the app is sent to the background mid-run, the timeline pauses and continues from the same point when it returns.
