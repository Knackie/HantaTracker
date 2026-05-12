# HantaTracker — Reddit community parser

This version parses a Reddit community timeline and converts it into a JSON dataset used by Chart.js and Leaflet.

## Important warning

Reddit is not an official public health source. This version must be labelled as community / unverified data.

Use it for watch and visualization only. Cross-check with WHO, ECDC, national public health agencies or verified ArcGIS layers.

## Source

```txt
https://www.reddit.com/r/ContagionCuriosity/comments/1t5i3u3/hantavirus_outbreak_timeline/
```

## Auto update

```txt
.github/workflows/update-reddit-data.yml
scripts/update-reddit-data.js
data/reddit_hantavirus.json
```

Run manually from GitHub Actions:

```txt
Update Reddit community HantaTracker data
```

## GitHub Pages

Use:

```txt
Source: Deploy from a branch
Branch: main
Folder: /root
```
