# Features (prioritised)

P0 is what the problem statement asks for and must work in the demo. P1 strengthens the same goals. P2 is not planned.

## P0: from the problem statement

1. **Soil health input.** N, P, K, pH, organic carbon and moisture (the schema is fixed). Each value shows a low, medium or high rating from the reference cut-offs.
2. **Crop and growth stage.** Crop, optional variety (only if our data has varieties), sowing date and current growth stage.
3. **Weather.** Current conditions and a 5-day forecast for the field's coordinates, with a cached and seasonal-average fallback.
4. **Fertilizer recommendation.** Product(s) and quantity per acre from the deficit formula, adjusted for weather and previous usage, with a model refining the product choice.
5. **Application schedule.** Dated, split doses: what, how much and when.
6. **Over- and under-application warning.** Risk level with the reason and the plain-language impact on soil health and yield.
7. **Previous fertilizer usage log.** Per field, used in every later recommendation.

## P1: strengthens the goals

8. **Accounts and multiple fields.** Register, log in, farms with several fields, history across seasons.
9. **Cost and saving.** Plan cost against the farmer's logged previous usage.
10. **Printable schedule and PDF.** A print-friendly schedule page, saved as PDF from the browser.
11. **Check my own dose.** The farmer enters a planned quantity and gets the risk warning before applying (`POST /risk-score`).
12. **Trends and history.** Nutrient levels, usage and recommendations over time per field.
13. **Explanations.** The 2 to 3 reasons and the deficit numbers behind each recommendation.
14. **Hindi and English toggle.**
15. **Interactive 3D soil and field view.** React Three Fiber and GSAP. The standout demo feature.
16. **Offline-friendly last recommendation.**

## P2: not planned

Soil Health Card OCR upload, subsidy or scheme lookup, SMS or IVR access, community stories, cloud deployment. The agronomist regional summary (anonymised) is a backend stretch step (J13).

## Why these extras

Cost and saving, the printable schedule, the language toggle and the what-if check map directly to the problem statement's outcomes (farmer income, waste reduction, warning about excessive use, real end users) without adding technical risk. The 3D view uses the stack already chosen and makes the data-heavy app memorable.
