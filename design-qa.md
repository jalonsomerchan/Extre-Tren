# Design QA

## Evidence

- Source visual truth: `/Users/jorgealonso/.codex/generated_images/019fdb00-fade-7693-897a-cb3cdf314d4f/exec-57c36117-3fb1-4de6-b2e3-cbb26a2aa59c.png`
- Implementation screenshot: `/Users/jorgealonso/Proyectos/Extre-Tren/implementation-desktop.png`
- Mobile screenshot: `/Users/jorgealonso/Proyectos/Extre-Tren/implementation-mobile.png`
- Full comparison: `/Users/jorgealonso/Proyectos/Extre-Tren/design-qa-comparison.png`
- Focused data-region comparison: `/Users/jorgealonso/Proyectos/Extre-Tren/design-qa-focus.png`
- Reference pixels: 1488 × 1058, normalized to 1440 × 1024.
- Implementation pixels and CSS viewport: 1440 × 1024 at device scale 1.
- Mobile implementation pixels and CSS viewport: 390 × 844 at device scale 1.
- State: home, Spanish, light theme, latest dataset day (2026-08-07).

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- Typography uses the required system sans stack. Its weight, compact hierarchy and line lengths preserve the selected direction without external font loading.
- Layout follows the selected direction: slim navigation, compact status summary, paired distribution/trend visualizations and a dense services table. Mobile stacks these regions in the same task order without horizontal overflow.
- Colors use one consistent semantic scale across metrics, charts, rows and badges: green 0–4, amber 5–14, orange 15–29 and red 30+ minutes. Every color is reinforced with a number and text label.
- Image assets are not applicable. The selected direction is a data interface; no product imagery or decorative illustration was replaced with a placeholder.
- Copy remains sourced from the bilingual translation files. Actual dataset fields replace mock-only concepts such as platform numbers.
- The implementation uses a severity-colored bar trend instead of the mock's single-color line chart. This is intentional: it supports the user's requirement that increasing delays become increasingly red and remains legible without client-side chart dependencies.

## Interaction and responsive checks

- Mobile menu opens and exposes all seven sections.
- Theme toggle switches between light and dark mode.
- Delay-column sorting changes `aria-sort` to ascending.
- Ten representative routes were checked at 390 px, including period, statistics, data, daily, journey and English views; none overflow horizontally.
- The production preview reported no browser console warnings or errors.

## Comparison history

1. P2: trend bars collapsed to zero height because percentage heights had no definite containing block. Fixed with bounded data-derived heights.
2. P2: linked chart items nested two grids and allowed bars to overlap labels. Fixed with one dedicated chart-item grid; the post-fix bounding boxes place labels immediately above the plot without overlap.
3. P2: the first desktop pass gave the page title too much vertical weight compared with the selected compact dashboard. Reduced the display scale and section padding; the final capture keeps the services table in the first viewport.

## Follow-up polish

- P3: a future data source could add platform information if it becomes available; it is intentionally not fabricated now.

final result: passed
