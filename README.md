# HantaTracker

HantaTracker is an independent open-source web dashboard for tracking documented Hantavirus reports using public health sources.

The project is a lightweight static website compatible with GitHub Pages. It includes automatic JSON updates through GitHub Actions and a Leaflet/OpenStreetMap world map.

## Features

- Clean public dashboard
- Hantavirus indicators
- Chart-based case evolution
- World map using Leaflet
- Public JSON dataset
- Daily GitHub Actions update
- No backend required

## Data

The main dataset is stored in:

```txt
data/hantavirus.json
```

The update script is:

```txt
scripts/update-data.js
```

The scheduled workflow is:

```txt
.github/workflows/update-data.yml
```

## GitHub Pages deployment

Use:

```txt
Source: Deploy from a branch
Branch: main
Folder: /root
```

## Manual data update

From the repository Actions tab, run:

```txt
Update HantaTracker data
```

## Disclaimer

HantaTracker is an independent informational project. It is not affiliated with the WHO or any public health authority.

The website does not provide medical advice and must not replace official public health recommendations.

## License

MIT
