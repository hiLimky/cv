# CV Website

A single-page, scroll-based CV website.

## Structure
- `index.html`: page structure and section anchors.
- `styles.css`: responsive theme, layout, and motion styles.
- `scripts.js`: loads TSV data and renders each section.
- `data/*.tsv`: editable content sources.

## Update content
Edit files under `data/` to update profile/CV content without touching page layout.

## Local preview
```bash
python3 -m http.server 4173
```
Open: `http://127.0.0.1:4173`
