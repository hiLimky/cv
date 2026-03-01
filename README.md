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

## Merge conflict helper (PR against `main`)
If your PR reports conflicts in `index.html`, `scripts.js`, `styles.css`, run:
```bash
git fetch origin
./scripts/resolve_pr_conflicts.sh origin/main
```
Then push:
```bash
git push --force-with-lease
```

## TSV image paths
For image-based sections, set paths directly in TSV:
- `data/profile.tsv` -> `profile_image` (hero/profile image)
- `data/projects.tsv` -> `image` (project thumbnail per row)

Use relative paths (e.g., `profile.png`, `images/my-project.png`).

