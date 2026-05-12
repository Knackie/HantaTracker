# HantaTracker

HantaTracker is an independent open-source web dashboard for tracking documented Hantavirus reports using public health sources.

The project is designed as a lightweight static website compatible with GitHub Pages.

## Features

- Clean public dashboard
- Key Hantavirus indicators
- Chart-based case evolution
- Public JSON dataset
- Source and methodology page
- Prevention page
- GitHub transparency page
- No backend required

## Data

The initial dataset is stored in:

```txt
data/hantavirus.json
```

The current version uses public information from the World Health Organization Disease Outbreak News.

## Project structure

```txt
/
├── index.html
├── data.html
├── prevention.html
├── github.html
├── style.css
├── script.js
├── data/
│   └── hantavirus.json
└── README.md
```

## Local use

Open `index.html` directly in a browser, or run a small local server:

```bash
python -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

## GitHub Pages deployment

Push the files to a GitHub repository, then enable GitHub Pages from the repository settings.

Recommended settings:

```txt
Source: Deploy from a branch
Branch: main
Folder: /root
```

The site will be available at:

```txt
https://USERNAME.github.io/REPOSITORY/
```

## Disclaimer

HantaTracker is an independent informational project. It is not affiliated with the WHO or any public health authority.

The website does not provide medical advice and must not replace official public health recommendations.

## License

MIT
