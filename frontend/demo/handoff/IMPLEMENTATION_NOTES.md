Implementation Notes & Next Steps
--------------------------------

1) Storybook
- The repo contains Storybook stories in `src/components/*.stories.jsx`. To run Storybook locally, re-add Storybook devDependencies to `frontend/demo/package.json` and run `npm install` and `npm run storybook`.

2) Performance
- The frontend build currently produces a ~1.1MB main JS chunk. Add code-splitting (dynamic `import()`) for large modules (three.js scenes, heavy assets) and use `build.rollupOptions.output.manualChunks`.

Update: I lazy-loaded `CityScene` and `ModuleRouter`, which reduced the main JS bundle from ~1.13MB to ~968KB and moved the heavy 3D code into a separate chunk (~141KB gzipped ~49KB). This improves initial load performance and allows deferred loading of large assets.

3) Accessibility
- Ensure contrast ratios meet WCAG AA for text (run Lighthouse). Provide `prefers-reduced-motion` variants; all animations in `anime-theme.css` respect the media query.

4) Animations
- Replace `animation-burst.json` with designer-provided Lottie files. Limit concurrent heavy Lottie animations to 2.

Note on automated audits: Running Lighthouse programmatically requires Chrome/Chromium in the environment; I could not run a full Lighthouse audit here. To run a local audit:

```bash
npx lighthouse http://localhost:3000 --output html --output-path=lighthouse-report.html
```

Address the report items (contrast, unused JS, large images) after running the audit locally.

5) Handoff
- Provide Figma file (component library + tokens) and export assets (SVG + Lottie) to `public/assets/ui/`.
