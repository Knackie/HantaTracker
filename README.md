# HantaTracker

HantaTracker is an independent open-source dashboard for tracking documented Hantavirus reports using public health sources.

The dashboard does not invent country-level case counts. The map displays documented events only. For the MV Hondius cluster, the marker is explicitly labelled as a non-territorial ship-related event, not as national incidence.

## Features

Clean dashboard, public JSON dataset, Leaflet/OpenStreetMap event map, GitHub Actions automatic update, GitHub Pages compatibility.

## Data

Main dataset: `data/hantavirus.json`.
Update script: `scripts/update-data.js`.
Workflow: `.github/workflows/update-data.yml`.

## GitHub Pages

Use Deploy from a branch, branch `main`, folder `/root`.

## Disclaimer

HantaTracker is an independent informational project. It is not affiliated with the WHO or any public health authority and does not provide medical advice.

## License

MIT
