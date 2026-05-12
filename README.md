# HantaTracker

HantaTracker is an open-source web dashboard inspired by CovidTracker, focused on monitoring Hantavirus-related outbreaks and public health information using transparent, publicly available data sources.

The goal of this project is to provide a simple, fast and accessible platform to visualize outbreak evolution, official reports, statistics and prevention information.

## Features

- Live outbreak statistics
- Interactive charts
- Responsive design
- Public data transparency
- GitHub-hosted datasets
- Prevention and awareness page
- Lightweight static deployment compatible with GitHub Pages

## Data Sources

This project relies on official public health organizations and openly available datasets.

Main sources include:

- World Health Organization (WHO)
- European Centre for Disease Prevention and Control (ECDC)
- National public health agencies
- Public epidemiological reports

Example WHO source:

https://www.who.int/emergencies/disease-outbreak-news

## Project Structure

```txt
/
├── index.html
├── style.css
├── script.js
├── data/
│   └── hantavirus.json
├── assets/
│   └── images/
└── README.md
```

## Local Development

Clone the repository:

```bash
git clone https://github.com/knackie/hantatracker.git
```

Open the project directory:

```bash
cd hantatracker
```

Then simply open `index.html` in your browser.

You can also use a lightweight local server:

```bash
python -m http.server 8080
```

or

```bash
npx serve
```

## GitHub Pages Deployment

This project is fully compatible with GitHub Pages.

1. Push the repository to GitHub
2. Open repository settings
3. Go to `Pages`
4. Select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Save

Your website will be available at:

```txt
https://knackie.github.io/hantatracker/
```

## Contributing

Contributions are welcome.

You can help by:

- Improving UI/UX
- Adding new visualizations
- Integrating additional public datasets
- Improving accessibility
- Translating the interface
- Fixing bugs

## Disclaimer

HantaTracker is an independent open-source project and is not affiliated with the WHO, ECDC or any governmental health organization.

This platform is intended for informational and educational purposes only and must not replace professional medical advice or official public health recommendations.

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction.
