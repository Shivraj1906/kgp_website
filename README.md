# MMBS Laboratory website

A responsive six-page static website for the Microfluidics, Materials, Bio-interfaces & Sensing Laboratory, Department of Chemical Engineering, IIT Kharagpur. Lab information was imported from https://mmbslab.netlify.app/. No dependencies or build step are required.

## Source import

`data/content.json` preserves the original core schema and adds optional fields for the source content. It includes ten research areas, three flagship projects, three selected papers, the principal investigator's biography and four career entries, four groups with open positions, four joining opportunities, profile links, email and address. Descriptive prose is condensed; publication metadata and lab facts are retained.

`data/source.json` records the source sections, retrieval time, counts and image URLs. The logo and PI portrait are downloaded into `assets/images/`. Source template-editing instructions are excluded. The source has no dated news or other named members; `news` is empty and open positions are separate from people. The news page displays research highlights and opportunities. The publications page labels the three papers as selected and links to Google Scholar for the wider record.

To repeat the import, run `python scripts/import_lab.py`. This **replaces** the imported JSON files and the two images; save manual content edits before refreshing. The importer uses only Python's standard library and checks source section counts and PNG signatures. It then applies the reviewed copy in `data/editorial.json`, so a refresh preserves the editorial refinements. It does not crawl Google Scholar or automatically recheck facts against external sources.

## Reviewed copy and factual checks

`data/editorial.json` stores the refined wording, added paper summaries, citation corrections and links. Edit this file for wording that should survive a new import, then run `python scripts/refine_content.py` to apply it to `data/content.json` without downloading the source again. Entries match research and project titles, people's names, publication DOI URLs and opportunity titles; renamed projects retain a `sourceTitle` for repeat runs.

`data/fact-check.json` records the review date, evidence URLs, fields checked and limits of verification. Institutional profiles support the PI's appointment, degree history and added research details. Publication records support the experimental summaries and citation details. The lymph-node description explicitly identifies the use of mouse cells; the Small paper is identified as a review. Lab-specific recruitment and the vascularised organoid collaboration remain attributed to the lab website. The source's promotional quotation is omitted from the visitor pages; no replacement quotation is attributed to the PI.

Review these editorial entries and their evidence when the source changes. The importer reapplies the reviewed wording but does not infer whether a newer source makes it obsolete.

## Local preview

Run from this folder:

```sh
python scripts/serve.py
```

Open http://127.0.0.1:8001/. The preview server disables caching so page headers and assets stay in sync. Use this server instead of opening HTML files directly, since the website fetches its JSON content.

## Editing content

All lab-specific content lives in [data/content.json](data/content.json). Routine edits do not require HTML or JavaScript changes.

1. Open that file on GitHub and select the pencil icon.
2. Change values inside double quotes. Add records by copying an existing record in the appropriate list.
3. Preserve field names, brackets, and value types. Separate records with commas, with no comma after the final record. Escape quotes inside text as `\"` and use `\n` for line breaks.
4. Commit your changes. After Pages is configured, the website updates when the deployment completes.

| Section | Editable content |
| --- | --- |
| `lab` | Name, full name, tagline, institution, introduction, about paragraphs, four pillars, quote, logo, email, address, joining information, profile links, notice |
| `research` | Area titles, summaries, pillar labels, and nested flagship projects |
| `people` | Names, roles, groups, biographies, portraits, email, links, and career timeline |
| `publications` | Titles, authors, venue, year, paper links, code links |
| `news` | Dates, titles, announcement text |
| `memberGroups` | Open-position group titles and status; not named people |
| `opportunities` | B.Tech, M.Tech, PhD and postdoctoral titles and descriptions |
| `publicationNote`, `newsEmptyMessage` | Context on publications and the empty-news state |

Use `YYYY-MM-DD` for dates and numbers without quotes for publication years. News sorts newest first; the home page shows the three latest announcements. Publications group by year. People appear under the group headings you supply, in their entered order.

Optional URL fields may stay empty (`""`); absent links are hidden. Supply full `https://` URLs for external links. Profile links use `{ "label": "Google Scholar", "url": "https://..." }`; timeline entries use `{ "label": "PhD", "text": "..." }`.

For portraits, upload images into `assets/images/` and set a member's `image` to a path such as `assets/images/member.jpg`. Empty image fields hide the portrait. `lab.image` and `lab.imageAlt` control the homepage logo. All image paths are relative to the repository root.

Set `lab.notice` to a message when needed, or an empty string to hide it. The imported site contains no fictional preview content.

Check JSON syntax locally with:

```sh
python3 -m json.tool data/content.json
```

Run `node --check assets/site.js` and `node scripts/verify_site.cjs` to validate JavaScript and all six rendered views. The checks cover import counts, local links and images, publication DOI links, PI timeline, contact details and the empty-news state. Check the layout in a browser after style changes.

Keep required fields and use `[]` for an empty list. Check the affected pages after editing. Invalid JSON produces a visible content-loading error.

## GitHub Pages and handover

1. Push the files to the repository's default branch.
2. Under **Settings → Pages**, choose **Deploy from a branch**, select the default branch and **/(root)**, then save.
3. Open GitHub's displayed website URL once deployment completes.

Relative paths support repository URLs such as `https://username.github.io/repository/`. The `.nojekyll` file makes Pages serve the static files directly.

After ownership transfer, check Pages settings and the new repository URL. Once the client supplies the domain, configure the custom domain and DNS following GitHub's instructions and enable HTTPS when available. This prototype does not configure a domain or CNAME.

## File structure

- The six HTML files contain the page shells and navigation.
- `data/content.json` contains editable lab content.
- `data/source.json` records import provenance.
- `data/editorial.json` preserves reviewed wording across source imports.
- `data/fact-check.json` records evidence and verification limits.
- `assets/images/` contains the imported lab logo and PI portrait.
- `scripts/import_lab.py` refreshes the source import.
- `scripts/refine_content.py` applies the reviewed copy without a network request.
- `scripts/verify_site.cjs` checks rendering and content integration.
- `assets/site.js` renders content and handles the mobile menu.
- `assets/styles.css` controls basic responsive styling.

The site requires JavaScript to render its JSON content. It has no backend, submission form, or editing dashboard; email and CV links open the visitor's email client. Adding new pages requires code changes. This import does not publish or deploy the site.

## Visual design and motion

The presentation follows the institutional hierarchy of https://www.stantonlab.info/: a prominent lab identity, separate navigation, scientific imagery and a direct mission section. Bold uppercase display type, high-contrast image compositions and outlined actions add an aerospace-inspired treatment. All six pages use the same white, black and navy system. The MMBS emblem, licensed microscopy media, PI portrait and factual content remain local; reference-site logos, claims and imagery are not reused. The homepage hero uses real microscopy footage with a static poster fallback. No new fonts, libraries or external runtime requests are required.

Scroll entrances use IntersectionObserver and the Web Animations API after content renders. Page mastheads and selected below-fold sections move 28px over 750ms once; content is visible by default if either API is unavailable. Reduced-motion preferences disable these entrances and CSS movement, including smooth anchor scrolling. Focus, fragment navigation and printing cancel active entrances. Navigation underlines, button arrows and the mobile menu icon have short interaction transitions.

Run `node --check assets/site.js` and `node scripts/verify_site.cjs` for content, links, navigation state and motion-fallback checks. These checks do not replace visual review: inspect all six pages at desktop and mobile widths, keyboard focus, reduced motion and print layout in a connected browser before release.

## Scientific media

The generated research illustrations have been replaced by third-party experimental imagery: Walsh et al. (2017), *Microfluidics with fluid walls*, CC BY 4.0, and a NIAID colorized T-cell scanning electron micrograph, CC BY 2.0. Source links, creators, licenses, precise movie numbers and transformations are recorded in `data/media.json`. Visible captions provide attribution and distinguish this reference material from MMBS experimental results. The hero uses HEK-293 cell footage. The glioblastoma research card uses an HPS-stained histology micrograph by Nephron, distributed under CC BY-SA 3.0 with attribution.

The hero video is a locally hosted H.264 MP4 (~3 MB). `assets/hero-video.js` progressively enhances its poster with muted playback, play/pause, reduced-motion and data-saving defaults, and offscreen/tab suspension. Autoplay rejection leaves a manual play button; a media error restores the poster. No tracking embeds or external media requests are required. Photo metadata is stored in both `data/content.json` and `data/editorial.json`, so content refreshes preserve the selected media. The original imported MMBS logo and PI portrait are unchanged.

Run `node scripts/verify_media.cjs` for attribution, media-file and playback-state checks. Frames were inspected and the video decoded locally; browser playback and layout still need a connected-browser review.

Content JSON is fetched without browser caching to prevent older project-image paths from appearing alongside new rendering code. Research image paths and credits are also persisted in the editorial overrides.
