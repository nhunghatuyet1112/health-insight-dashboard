# Synapse Health — HTML reference adaptation

The user-supplied HTML is the current visual authority, superseding the earlier light Synapse design brief.

## Visual system

- Dark background `#080c14`, sidebar `#090e18`, glass panels `rgba(13,20,34,.75)`.
- Primary green `#4ade80`, secondary cyan `#38bdf8`, primary text `#F8FAFC`, secondary text `#94A3B8`, muted metadata `#64748B`.
- Inter headings, Space Grotesk body, JetBrains Mono metadata; fonts self-hosted with Fontsource.
- Sidebar 260px on desktop; sticky header; four KPI cards; 8/4 analytics columns at large breakpoints.
- Controls/cards retain the reference radii, borders, translucent surfaces and restrained glow treatment.
- Reference Tailwind v3 CDN config is translated to local Tailwind v4 CSS-first tokens. No runtime CDN scripts are used.
- Lucide icons substitute Material Symbols. Ambient glows are CSS layers.

## UI-first scope

All numbers, timestamps, wellness claims, AI messages and connection statuses are fixed reference content. No wearable is connected, no model has run, no API is called, and buttons do not perform sync, export or data changes.

Assistant visibility uses Zustand. Suggested prompts populate a controlled React input. Sending the form prevents navigation and performs no request. The chat opens initially to match the HTML and can be minimized, closed or reopened. A small UI-preview note identifies the static interaction.

The chart uses the reference's fixed CSS bar heights and labels, preserving its composition; Recharts remains installed for future data integration. Previous sample-data files remain available but are not used on this screen.

## Responsive and accessibility adaptations

Sidebar hides below 768px as in the source. Header actions wrap on phones, search hides below 1280px, and hero actions stack until 1280px to avoid crowding beside the sidebar. The assistant fits the viewport width and limits its scrollable body height. Reduced-motion settings disable decorative motion; icon-only controls and inputs have accessible names, and a skip link is provided.
