# I outlive — implementation plan

## Intent

A single age input becomes a small autumnal scene: burgundy type, ivory paper, branches growing from the sentence, and falling leaves representing lives shorter than the visitor's. Keep the interface quiet and the interaction discoverable.

## Milestone 1: local botanical experiment (implemented)

- Buildless HTML, CSS, and JavaScript. No installation, account, backend, or runtime API calls.
- Responsive editable title with positive whole-year ages and no upper bound; BigInt comparisons and immediate input-driven growth.
- Six parent limbs with recursive forks, curling tendrils, broad leaves, and bounded age-dependent foliage density.
- Timestamp-driven growth and falling animation; one autumn leaf per eligible seed record.
- Settled leaf buttons, source-linked details, keyboard-accessible names list, replay, and a motion control.
- Respect the system reduced-motion setting with an immediate settled scene.
- A 100-person collection, starting at a completed lifespan of two years, plus four cosmic comparisons: the Stingray fading interval and estimated remnant ages for Simeis 147, Vela, and IC 443. Each comparison identifies its measured quantity rather than claiming a completed lifespan. The 76 human additions carry Wikidata date-source links; the original 24 remain editorial seed records.
- Seventeen playful age-based status lines in English and Chinese, including the skincare question for six-digit ages. Cosmic entries use the ordinary sorted leaves, with no separate shortcut button.
- Fourteen animated foreground sprigs and 42 tiny leaves; stem reveal and leaf unfolding share the scene clock. Reduced motion still shows the settled composition immediately.
- Large portrait leaves pass in front of the title, with always-visible names and ages. Descending lifespan/interval order in the fall sequence, ground layout, and names list. Each row is centered by its rotated bounds; replay changes scatter while preserving order and centering. Airborne leaves allow pointer events through to the input.
- English / Simplified Chinese selector, with translated interface text, all names and descriptions, validation, accessible labels, and open details dialogs. Age and animation progress survive a language change.
- Locally cached thumbnails with original image-page credits, a refresh helper, and initials if a portrait fails to load.

## Milestone 2: validate the illusion

- Inspect desktop, narrow phone, landscape, and high-density displays in actual browsers.
- Tune branch origins so they emerge from the letterforms; protect the title's negative space.
- Refine leaf unfurling, color transition, and drift. Currently autumn leaves appear at branch anchors before falling; implement a continuous green-to-autumn handoff.
- Tune text-to-animation timing and verify the permanent on-leaf portrait/name treatment at phone sizes.
- Profile on a midrange phone. Keep SVG unless observed performance requires Canvas for falling particles.
- Check resize during growth, repeated inputs, same-age replay, 1/27/28/130/20001, arbitrarily large integers, empty input, decimal rejection, keyboard focus, and reduced motion.
- Current motion control settles the scene when paused; resuming restarts the sequence. Decide whether a true freeze/resume is preferable.

## Milestone 3: reliable content

- Independently verify seed dates, descriptions, and source links before launch. Replace weak sources with authoritative biographies where available.
- Exclude approximate records from strict date comparisons, or show a clear approximate designation. The prototype uses documented conventional ages for three uncertain birth dates and labels them approximately.
- Compare completed calendar years: a death at 27 qualifies for input 28, not 27.
- Implemented: 100 names across several disciplines and regions, with stable IDs and original short descriptions.
- Implemented: an offline, resumable Wikidata import helper with batched requests and checks for day precision, deprecated claims, preferred ranks, and conflicting dates. The browser uses a static snapshot.
- For a much larger collection, separate visual density from total results and introduce bounded batches. Never imply every match was animated if it was not.
- Add animals later. Give icebergs explicit lifetime definitions. A named nebula currently compares an observed fading interval, not an unverified death. Isotope half-lives require a distinct comparison explanation; do not label them individual lifespans. See SCIENCE_NOTES.md for sourced findings.

## Milestone 4: launch

- Complete browser and assistive-technology QA; verify source links and content.
- Add social metadata, favicon, and final botanical polish.
- Deploy the static files to the selected host and configure ioutlive.com after hosting/domain decisions.
- No age storage or analytics needed for the core experience.

## Architecture

- `index.html`: semantic form, SVG scene, names list, native details dialog.
- `style.css`: responsive typography, paper surface, leaf pile, focus states.
- `data.js`: source-linked seed records with date uncertainty flags.
- `app.js`: age comparison, deterministic scene generation, animation, and interactions.
- `i18n.js`: English and Simplified Chinese interface strings and translated descriptions.
- `portraits.js` and `assets/portraits/`: local image cache and image-page credit links.
- `fetch-portraits.ps1`: network-enabled thumbnail cache refresh helper.
- `scripts/`: candidate and portrait manifests, Wikidata import helper, and imported source-date snapshot.

## Verification status

Implementation is an initial experiment. Record actual checks and limitations in README.md; browser appearance and frame rate must be observed rather than assumed.
