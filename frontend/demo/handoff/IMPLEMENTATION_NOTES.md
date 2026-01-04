Implementation Notes & Next Steps
--------------------------------

1) Storybook
- The repo contains Storybook stories in `src/components/*.stories.jsx`. To run Storybook locally, re-add Storybook devDependencies to `frontend/demo/package.json` and run `npm install` and `npm run storybook`.

2) Performance
- The frontend build currently produces a ~1.1MB main JS chunk. Add code-splitting (dynamic `import()`) for large modules (three.js scenes, heavy assets) and use `build.rollupOptions.output.manualChunks`.

3) Accessibility
- Ensure contrast ratios meet WCAG AA for text (run Lighthouse). Provide `prefers-reduced-motion` variants; all animations in `anime-theme.css` respect the media query.

4) Animations
- Replace `animation-burst.json` with designer-provided Lottie files. Limit concurrent heavy Lottie animations to 2.

5) Handoff
- Provide Figma file (component library + tokens) and export assets (SVG + Lottie) to `public/assets/ui/`.
