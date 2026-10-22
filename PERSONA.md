# Fictional persona — Nguyễn Minh Anh

The user supplied the persona proposal from the referenced conversation in this chat. It supersedes the provisional Alex Rivera profile from the Stitch HTML. All records are synthetic and intended only for this technical-test demo.

Minh Anh is 30, a UX Designer in TP.HCM, working at a desk for 8–9 hours daily. Occasional yoga and walks fit a goal of more consistent movement, better sleep and more daytime energy. Smartphone and smartwatch are envisioned data sources; no real device is connected.

## Personal targets and preferences

| Metric | Default target |
| --- | --- |
| Steps | 8,000/day |
| Sleep | 7.5h/night |
| Active time | 150 min/week |

Targets can be edited in Goals. Current activity level and aspirational targets remain separate. Default primary focus is better sleep, with fitness and energy as secondary goals. The primary focus orders personalized observations and is supplied to the assistant as a preference.

Editable fictional profile assumptions: birthday 1996-06-14 (30 in October 2026), 165cm, 58kg, sex unspecified, 23:00–06:30 preferred sleep window, fair recent sleep quality and mostly sitting. These are starting preferences, not clinical measurements. Older diet, water and stress fields remain in saved profiles for archive compatibility but are outside the current MVP.

## Current synthetic history

The active app uses `src/features/health/demo.ts` and `engine.ts`: sixty fixed dates from Aug 20–Oct 18, 2026. Provider-specific observations simulate Apple Health and Garmin daily activity/sleep/recovery, plus Apple/Garmin/Strava workouts. Each measurement carries source, unit, timestamp and status.

The narrative deliberately includes growing activity, a later sleep decline, fluctuating resting HR, missing observations, recorded zero activity and duplicated workouts. This replaces the old uniformly improving 28-day story in the main product. Source priority, deduplication and missing-data behavior are documented in the root README.

With default sources connected, the final seven-day period has 49,900 measured steps over six recorded days, 180 active minutes over six days, roughly 6.5h average sleep over six nights and 67.0 bpm average resting HR over five days. These values are computed, never written into the dashboard as constants.

## Current product behavior

- Landing → Explore Demo opens the dashboard with no authentication.
- No personalization wizard or profile review UI remains. Targets are edited in Goals and sources in Devices & Integrations.
- Overview, Health Insights, Goals and Integrations share the profile, sources, 7D/30D filters and analytics.
- Connect/disconnect changes source eligibility across every view and the next AI request. Source changes begin a new chat context.
- The active assistant uses real LLM responses through a server endpoint when configured, with server-owned evidence. Missing configuration is an explicit error, not a scripted fallback.
- Browser storage retains preferences, drafts and source settings. It never stores passwords, API keys or chat messages. Reset Demo restores default configuration.

## Archive compatibility

The earlier 28-day records in `data.ts` and calculations in `analytics.ts` remain for archive regression coverage. Their final week averaged 7,600 steps, 7.0h sleep and 145 active minutes. They are not the main dashboard's current dataset.

`/first-day` retains the earlier manual step/sleep/water demo-day preview. Those logs do not affect the sixty-day dataset and do not roll forward with the date. `/reference` retains the earlier Alex HTML adaptation. Both are outside the primary product navigation.
