UI Visual Redesign Handoff
=========================

Overview
--------
This folder contains the handoff package for the `ui-visual-redesign` delivered for the Civicverse demo frontend. It includes theme tokens, component contracts, placeholder animation assets (Lottie), and implementation notes for designers and frontend engineers.

Contents
--------
- `anime-theme.css` (reference tokens — canonical tokens are in `src/theme/anime-theme.css`)
- `components-spec.md` — component API and usage notes for `TopNav`, `LeftPanel`, `RightPanel`, `Hub`, `FAB`, `FooterPanel`.
- `animation-burst.json` — placeholder minimal Lottie JSON for reward burst (stub for animator to replace).
- `assets/` — list of placeholder SVGs included in the repo.
- `IMPLEMENTATION_NOTES.md` — build, Storybook, performance, and accessibility guidance.

How to use
----------
1. Developers: copy CSS tokens from `src/theme/anime-theme.css` into your design system and implement components following `components-spec.md`.
2. Designers: open `components-spec.md` for recommended art sizes, animation durations, and export formats (SVG + Lottie). Replace placeholder assets in `public/assets/ui/` with high-fidelity exports.
3. QA: run Lighthouse and visual regression tests against the running site at http://localhost:3000.
