# Design QA — propuesta 3

## Evidencia

- Source visual truth: `/Users/jorgealonso/.codex/generated_images/019fdb2f-4de0-7f10-b24f-22e3d63213f3/exec-654eed9e-10c4-4afb-be5a-c823ba476c4c.png`
- Implementation screenshot: `/Users/jorgealonso/Proyectos/Extre-Tren/design-qa-implementation.jpg`
- Implementation URL: `http://127.0.0.1:4325/viaje/00291/dia/2026-08-07/`
- Viewport: 1440 × 1024 CSS px, device density 1×, light theme, Spanish locale, journey `00291`, day `2026-08-07`.
- Source pixels: 1440 × 1024. Implementation pixels: 1440 × 1024. No density normalization or browser chrome was used.

## Comparison

The source and implementation were opened together and compared at the same viewport and theme. The full-view comparison confirms the proposal 3 composition: route hero, status band, facts row, line-based trend panel, and stops/observations panel. The existing product header remains unchanged as requested.

Focused comparison covered the hero/status hierarchy, the six-fact row, the Chart.js canvas and zero baseline, and the right-side stop table. The focused pass was needed because the table and chart labels are dense at desktop size; the final capture shows the line, points, axis, and times without clipping or unreadable wrapping.

## Required fidelity surfaces

- Fonts and typography: uses the repository system-font stack and existing type tokens; the route title has a compact display scale, strong weight, and one-line desktop treatment while wrapping naturally on mobile.
- Spacing and layout rhythm: preserves the existing container/header rhythm, uses the proposal 3 two-column lower grid, and collapses to a single column with an internally scrollable table on narrow screens.
- Colors and visual tokens: status colors, borders, radii, muted text, surfaces, and dark-mode variants reuse the repository token language; the on-time state is green and delay states remain semantically distinct.
- Image quality and asset fidelity: proposal 3 has no content imagery requiring a raster asset. The trend is rendered with a real Chart.js canvas rather than CSS-drawn bars; existing product iconography is retained.
- Copy and content: values are sourced from the real journey data; new UI copy is translated in both `es.json` and `en.json`. The English route was also rendered and checked.

## Findings

No actionable P0, P1, or P2 findings remain.

Intentional deviations from the generated proposal are accepted: the existing header is preserved exactly per the user request; the trend uses the repository's bar-chart language instead of introducing a new line-chart treatment; and the implementation uses actual journey data instead of invented operator/distance values from the mock.

## Comparison history

### Pass 1

- P2 — Trend labels were too dense when every observation was shown.
- P2 — The stop table needed more room for the status column at desktop and mobile widths.
- Fixes: sampled the trend to a maximum of eight points, widened the table's internal scroll region, and refined the desktop/mobile grid breakpoints.

### Pass 2 — layout final before chart refinement

- Re-captured at 1440 × 1024, light theme, same route and content.
- Hero, facts, trend, and stop table were visually compared against the source together.
- No P0/P1/P2 issues found. Mobile rendering at 390 × 844 was also checked for page overflow, wrapping, and table containment.

### Pass 3 — chart comprehension refinement

- P2 — The original trend still required too much interpretation: the zero reference was not explicit, mobile value labels collided, and representative sampling could omit the real maximum.
- Fixes: added a symmetric `+N / 0 / -N` axis, a plain-language guide, explicit late/early legend, latest-observation summary, compact mobile values, and sampling that always preserves the first, last, maximum, and minimum observations.

### Pass 4 — final after refinement

- Re-captured at 1440 × 1024 and checked the chart region again against the source visual.
- Rechecked the chart at 390 × 844; value labels no longer overlap and the page has no horizontal overflow.
- No actionable P0/P1/P2 issues remain.

### Pass 5 — Chart.js migration

- Replaced the handcrafted CSS bars with a responsive Chart.js line chart while preserving the same data, axis meaning, guide, legend, and localized content.
- Re-captured at 1440 × 1024 and compared the source and implementation together. The chart now follows the source's line-based trend treatment more closely while keeping the repository's actual journey data.
- Checked light mode, dark mode, English copy, and 390 × 844 responsive rendering. No P0/P1/P2 issues found.

## Interaction and runtime checks

- Theme toggle changes between light and dark mode and keeps the page readable.
- Chart.js canvas renders the line, points, zero baseline, labels, and responsive resize correctly.
- “Ver todo el historial” preserves the localized route pattern.
- Spanish and English journey pages render with aligned translation keys.
- `npm test` passes all smoke tests.
- `npm run build` completes successfully.
- Console logs were checked on the final static preview on port 4325; no errors or warnings were recorded.

## Implementation checklist

- [x] Proposal 3 hierarchy implemented.
- [x] Existing header left untouched.
- [x] Responsive desktop/mobile layout verified.
- [x] Light and dark mode supported.
- [x] Spanish and English translations aligned.
- [x] Base-safe localized route used.
- [x] Smoke tests and production build verified.

final result: passed
