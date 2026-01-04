Title: UI Visual Redesign — Anime-style Civicverse (ui-visual-redesign)

Summary
-------
This PR introduces a full visual redesign scaffold for the Civicverse demo UI with an anime-inspired, cel-shaded, futuristic theme. It includes theme tokens, new layout components (TopNav, LeftPanel, RightPanel, Hub, FAB, Footer), placeholder high-fidelity assets, lightweight reward animations, performance optimizations (lazy-loading heavy modules), and handoff documentation for designers and engineers.

Changes
-------
- Theme tokens: `src/theme/anime-theme.css`
- New components: `TopNav`, `LeftPanel`, `RightPanel`, `Hub`, `FAB`, `FooterPanel`, `RewardBurst`, `ThreeContainer`
- Placeholder assets: `public/assets/ui/*_high.svg`, `background_hub.svg`
- Handoff package: `frontend/demo/handoff/` with README, component spec, and implementation notes
- Build optimizations: `vite.config.js` with manualChunks and lazy-loading of three.js-related code

Testing
-------
1. Start the demo stack (docker-compose) and visit http://localhost:3000 to view the redesign.
2. Run `npm run build` in `frontend/demo` to verify the build completes.
3. Optional: run Storybook locally after re-adding devDependencies.

Notes
-----
- Storybook devDependencies were removed from `package.json` to keep Docker builds deterministic; re-add them locally to run Storybook.
- Lighthouse/A11y: run `npx lighthouse http://localhost:3000 --output html --output-path=lighthouse-report.html` locally.

Checklist
---------
- [x] Theme tokens added
- [x] Core components scaffolded
- [x] Placeholder assets included
- [x] Reward animation included
- [x] ManualChunks config for Vite added
- [x] Lazy-loading of heavy modules implemented
- [x] Handoff package created
