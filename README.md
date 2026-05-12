# HantaTracker

HantaTracker is a static GitHub Pages dashboard that converts a public ArcGIS Dashboard into a lightweight JSON dataset used by Chart.js and Leaflet.

## Source

ArcGIS Dashboard:

```txt
https://www.arcgis.com/apps/dashboards/5c68442d2afc42d7ba2696e4cd393729
```

## Auto update

The workflow is stored in:

```txt
.github/workflows/update-arcgis-data.yml
```

It runs:

```txt
node scripts/update-arcgis-data.js
```

and generates:

```txt
data/arcgis_hantavirus.json
```

## GitHub Pages

Use:

```txt
Source: Deploy from a branch
Branch: main
Folder: /root
```

## Disclaimer

This is an independent informational project. It does not replace official public health guidance.
