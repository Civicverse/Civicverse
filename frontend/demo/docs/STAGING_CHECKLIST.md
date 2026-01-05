# Staging & Release Checklist (Demo)

1. Build
- Run `npm ci` (or `npm install` if lockfile out of sync)
- Run `npm run build` in `frontend/demo`

2. Verify
- Start preview: `npx vite preview --port 5000 --strictPort`
- Run headless capture: `node tools/headless_capture.js` (requires system libs: libnss3, libnspr4, libgtk-3-0, etc.)
- Manually verify UI at http://localhost:5000

3. Bundle analysis
- Inspect `dist/assets` for large vendor chunks; consider manualChunks to split heavy libraries.

4. QA
- Test basic flows: movement, world-panel open/close, module navigation, HUD responsiveness.
- Check console logs for runtime errors (three.js NaN geometry warnings should be investigated in content generation).

5. Release notes
- Document bundler fix (pin React into single runtime chunk), headless verification results, known issues.

6. Deployment
- Containerize preview or serve `dist` via a static host.

7. Rollback
- Keep last-known-good `dist` commit tag for quick rollback.
