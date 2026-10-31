# I outlive

A small, deliberately useless autumn garden. Enter your age, watch a little foliage grow, and discover people whose lives were shorter than yours.

## Run locally

Open `index.html` in a browser. The collection and portrait cache are local; there are no dependencies or external fonts.

No development server is required. Portrait thumbnails are cached under `assets/portraits/`; their original image pages and credits are linked from the details dialog. `fetch-portraits.ps1` refreshes that cache and requires network access.

## The experiment

Ivory paper, burgundy typography, forked SVG branches, curling tendrils, and broad foliage. Fourteen foreground twigs draw themselves over the title backing as their 42 tiny leaves unfurl. Growth begins as you type a positive whole-number age. There is no upper age bound: comparisons use BigInt, while visual density stays bounded. Try `3`, `28`, `100`, or `100000`. Seventeen age ranges have their own playful status lines in both languages; the skincare question appears from 100,000 through 999,999.

Every matching record becomes a large autumn leaf with a portrait, name, and age. Leaves pass in front of the title and settle in descending age order. Each row, including a partially filled last row, is centered using its rotated bounds. **Another breeze** changes the scatter while preserving order and centering. Select a leaf or use **Read the names** for details and sources. The collection contains **100 people**, whose completed lifespans range from **2 to 98**, plus the named **Stingray Nebula (Hen 3-1357)**. Its approximately 20-year value is explicitly an observed fading interval between 1996 and 2016, based on [NASA's account](https://science.nasa.gov/missions/hubble/hubble-captures-unprecedented-fading-of-stingray-nebula/), rather than a claim that it died at twenty. A person who died at two first appears for input three: comparisons are strictly younger.

Use the **English / 中文** selector in the header to switch the interface, leaf names, accessible labels, and all 104 descriptions to Simplified Chinese. Switching preserves the input age and animation progress; an open details dialog also updates. Source pages retain their original language. The text lives in `i18n.js`; the selected language is not stored.

There are now **104 active entries**: 100 people and four cosmic comparisons. In addition to the Stingray fading interval, the ordinary leaf list includes the **Spaghetti Nebula / Simeis 147 (≈40,000 years)**, **Vela remnant (≈11,000 years)**, and **Jellyfish Nebula / IC 443 (≈10,000 years)**. These three compare estimated remnant ages, explicitly labeled in both languages, rather than completed lifespans. Enter `100000` to put them at the top. Every active entry has a cached image and Chinese description; there is no separate cosmic shortcut button.

The system reduced-motion preference skips the animation. **Pause motion** settles the scene; **Resume motion** restarts it. Ages stay in the page and are not stored.

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for milestones, content rules, known gaps, and launch work. Seed biographies still need an independent source audit before public launch. Three uncertain birth dates use conventional lifespan ages and are marked approximately.

The 76 added biographies include Wikidata date-source links and a retrieval date. `scripts/candidates.json` defines that addition; `scripts/import-people.ps1` retrieves exact day-precision birth/death claims into `scripts/imported-people.json`, preserving progress and rejecting unresolved date conflicts. The app uses the reviewed snapshot in `data.js`, with no date lookups at runtime. The portrait helper uses `scripts/portrait-manifest.json`, batches metadata queries, and preserves existing cached images.

## Verification

JavaScript syntax, data structure, active portrait assets, simulated twig growth, desktop/mobile row centering, Chinese translation coverage, and language switching with an open dialog are verified. Visual browser QA is still needed, particularly branch placement, mobile performance, and animation timing. The app requires no installed runtime. Cached images preserve their original image-page credit links; review each file's reuse terms before public launch.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` validates and publishes the site whenever `main` is pushed. Set the repository's **Settings → Pages → Source** to **GitHub Actions**. The default address is `https://<owner>.github.io/<repository>/`; all assets use relative paths so project URLs work.

To validate and produce the same static package locally with Node.js:

```sh
node scripts/build-pages.mjs
```

Only the application and active portrait images are packaged into the ignored `_site/` directory. Import scripts, documentation, and Git metadata are excluded from the hosted site. The `ioutlive.com` custom domain can be connected later through Pages settings and DNS.
