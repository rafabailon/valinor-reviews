# Valinor Reviews

A responsive, bilingual fantasy book-review site built with plain HTML, CSS, and JavaScript. No build step, no framework, and no backend: the whole archive can be served from any static host.

**Stories beyond the map.**

## Features

- **English and Spanish editions** with matching pages and a language switch that keeps the current review, filters, and reading path.
- **Full-text review catalogue** searching titles, authors, genres, tags, excerpts, verdicts, and review body text.
- **Genre filters and sorting** by featured order, highest score, or title, with shareable URL parameters (`q`, `genre`, `sort`).
- **Random review picker** for readers who want the archive to choose for them.
- **Personal reading shelf** that saves reviews in `localStorage` (key `valinor-reviews:shelf`) with no account, network request, or tracking.
- **Review detail pages** with council scores, verdicts, estimated reading time, tags, and related reviews.
- **Accessible interaction**: skip links, keyboard-friendly navigation, visible focus states, `aria-live` results, and reduced-motion support.
- **Responsive layouts** for desktop, tablet, and small screens without changing the established visual style.

## Pages

- `index.html` — language selector.
- `en/` — English edition.
- `es/` — Spanish edition.

Each language folder contains the same pages:

- `index.html` — landing page, featured reviews, and newsletter demo.
- `reviews.html` — searchable, filterable catalogue with sorting and random pick.
- `review.html?id=<review-id>` — full review with rating, tags, and related books.
- `reading-list.html` — curated reading paths by mood and genre.
- `shelf.html` — reviews saved in the current browser.
- `about.html` — editorial story, values, and catalogue links.

Open the root `index.html` to choose a language, or go directly to `en/index.html` / `es/index.html`. Language links on matching pages switch editions while preserving the current review ID and filters.

## Project layout

```text
assets/
  css/site.css          Shared design system and responsive styles
  js/site.js            Navigation, catalogue, detail, shelf, and form behaviour
  js/reviews.en.js      English review data
  js/reviews.es.js      Spanish review data
en/                     English pages
es/                     Spanish pages
tests/test_site.py      Static checks for pages, links, data, copy, and accessibility
Makefile                Test and local-server helpers
index.html              Language selector
```

This is a root-deployed static site: the HTML pages must remain at the publish root beside `assets/`. Shared code lives in `assets/` by convention, so there is no extra `src/` wrapper to flatten.

## Run locally

```sh
make serve
```

Or use Python directly:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Google Fonts and Unsplash images are external resources and need an internet connection; the site falls back to system fonts if they are unavailable. Newsletter forms are demonstrations and do not store or submit addresses.

## Editing reviews

Review content lives in `assets/js/reviews.en.js` and `assets/js/reviews.es.js`. Both files must contain the same review IDs in the same language pair. Each review includes:

```js
{
  "id": "moss-and-moonlight",
  "title": "The Moss & Moonlight",
  "author": "Elowen Marr",
  "category": "Wilderness fantasy",
  "score": 94,
  "date": "14 October 2026",
  "image": "https://images.unsplash.com/...",
  "alt": "Misty green woodland beneath a quiet sky",
  "excerpt": "...",
  "body": "...",
  "verdict": "...",
  "details": "...",
  "tags": ["woodland", "mapmaking", "slow adventure"]
}
```

Scores are integers from 0 to 100. Tags are searchable, so translations should use the vocabulary readers will actually type. The tests validate required fields, score ranges, image URLs, tag quality, and bilingual ID/score/author parity.

## Reading shelf privacy

Saved review IDs are kept only in the browser's `localStorage`; nothing is sent to a server. The same shelf is shared between the English and Spanish editions because review IDs are language-independent. Clearing site data resets the shelf.

## Tests

Run the static-site checks with Python 3.10 or later:

```sh
make test
```

The suite validates:

- language metadata, descriptions, landmarks, unique IDs, and working skip links;
- local links, scripts, stylesheets, and anchor fragments;
- complete English/Spanish page pairs and consistent navigation;
- catalogue, detail, random-pick, and shelf integration points;
- review data shape, score bounds, tags, alt text, and bilingual parity;
- JavaScript copy-key coverage, HTML escaping of review content, and responsive/reduced-motion CSS.

These are fast static checks. They do not measure browser rendering, interaction timing, external CDN latency, or Core Web Vitals; run a browser pass before publishing. Remove generated cache files with `make clean`.

## Deployment

Publish the repository root as-is to GitHub Pages, Netlify, Cloudflare Pages, or any static file host. The site needs no build command and no server-side runtime. Keep the `en/`, `es/`, and `assets/` directories together.

## Content and licensing

The reviews and editorial copy are fictional samples. Unsplash images and Google Fonts are third-party resources; confirm their licenses and replace sample content as appropriate before public release.
