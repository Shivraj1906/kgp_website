# Research lab website

A responsive six-page prototype for GitHub Pages. All people, projects, publications, and announcements are fictional sample content. No dependencies or build step are required.

## Local preview

Run from this folder:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use this server instead of opening HTML files directly, since the website fetches its JSON content.

## Editing content

All lab-specific content lives in [data/content.json](data/content.json). Routine edits do not require HTML or JavaScript changes.

1. Open that file on GitHub and select the pencil icon.
2. Change values inside double quotes. Add records by copying an existing record in the appropriate list.
3. Preserve field names, brackets, and value types. Separate records with commas, with no comma after the final record. Escape quotes inside text as `\"` and use `\n` for line breaks.
4. Commit your changes. After Pages is configured, the website updates when the deployment completes.

| Section | Editable content |
| --- | --- |
| `lab` | Name, tagline, institution, introduction, email, address, joining information, preview notice |
| `research` | Theme titles, summaries, and nested projects |
| `people` | Names, roles, group headings, biographies, portraits, profile links |
| `publications` | Titles, authors, venue, year, paper links, code links |
| `news` | Dates, titles, announcement text |

Use `YYYY-MM-DD` for dates and numbers without quotes for publication years. News sorts newest first; the home page shows the three latest announcements. Publications group by year. People appear under the group headings you supply, in their entered order.

Optional URL fields may stay empty (`""`); absent links are hidden. Supply full `https://` URLs for external links. Leave `lab.email` empty until the real email address is available.

For portraits, create `assets/images/`, upload images there, and set a member's `image` to a path such as `assets/images/member.jpg`. Empty image fields show placeholders. The homepage image is a layout placeholder; replacing it requires a one-time edit in `assets/site.js`.

Keep the preview notice until the dummy content has been replaced and reviewed. Then set `lab.notice` to an empty string to hide it.

Check JSON syntax locally with:

```sh
python3 -m json.tool data/content.json
```

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
- `assets/site.js` renders content and handles the mobile menu.
- `assets/styles.css` controls basic responsive styling.

The site requires JavaScript to render its JSON content. It has no backend, submission form, or editing dashboard. Adding new pages requires code changes.
