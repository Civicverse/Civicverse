# Civicverse UI Component Spec

This document lists the primary UI components, props/contract, and implementation guidance.

TopNav
- Path: `src/components/TopNav.jsx`
- Props: none (static nav items)
- Behavior: provides `nav-item` elements with accessible `role=button`. Hover: translateY(-3px), box-shadow rim glow. Search input should be keyboard-focusable with ARIA autosuggest.

LeftPanel
- Path: `src/components/LeftPanel.jsx`
- Props: none (placeholder demo). Replace with dynamic props: `player`, `quests`, `stats`.
- Visuals: energy gauge (use SVG circular gauge or CSS conic-gradient), animated progress bar.

RightPanel
- Path: `src/components/RightPanel.jsx`
- Props: `notifications`, `events` (arrays). Animated badges for new content.

Hub (Floating Cards)
- Path: `src/components/Hub.jsx`
- Props: `items` array with shape { id, type, title, content, progress }
- Cards animate on hover. Rewards trigger `claim` event.

FAB
- Path: `src/components/FAB.jsx`
- Props: `onOpen` callback. Provide accessible label and keyboard focus.

FooterPanel
- Path: `src/components/FooterPanel.jsx`
- Props: `stats` object for online players, events

Tokens
- Use CSS variables in `src/theme/anime-theme.css`. Keep tokens source of truth there.

Animations
- Microinteraction timings: short 160ms, mid 400ms, modal 600-900ms.
- Provide `prefers-reduced-motion` fallbacks.

Assets & Export Guidelines
- Icons: SVG layered (outline + fill). Provide separate filled/active variants.
- Mascots/Characters: provide spritesheet + Lottie for complex loops.
- Background: vector source (SVG/AI) and exported 4K PNG/WebP for parallax layers.
