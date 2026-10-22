[한국어](README.md)&emsp;&emsp;English

# Photo Score

A browser tool that analyzes photo pixels and provides **seven category scores, an overall score, a grade, and shooting/post-processing tips**. Load local photos without signing in or supplying an API key.

Although the introduction uses the term “AI,” the current implementation evaluates numerical measurements and rules: histograms, edges, color distributions and sharpness. It does not call an external generative-AI API or a trained model.

## Features and technology

- Drag and drop browser-supported images such as JPG, PNG and WebP.
- Evaluate composition, exposure, subject, bokeh/depth, color, sharpness and creativity.
- Display an overall score on a 100-point scale and a grade.
- Generate detailed suggestions and quick tips from measurements and scores.
- Overlay SVG composition guides and estimated subject positions.
- Select another photo and analyze again.

| Technology | Role |
| --- | --- |
| HTML / CSS / JavaScript | File selection, analysis state and results |
| FileReader / Image | Local file input and decoding |
| Canvas 2D / ImageData | Pixel analysis on a downscaled image |
| SVG | Composition guides and subject-position display |
| Custom statistics / image processing | Histograms, energy maps, hue distributions and Laplacian-based sharpness |
| Google Fonts | Web fonts |

There is no backend, package installation or build step. Interface and analysis code are combined in `index.html`.

## Run

Download **Code → Download ZIP** from GitHub, extract it and open `index.html` in a browser. Alternatively, with Git and Python 3:

```sh
git clone https://github.com/Velvitty/Photo_Scorer.git
cd Photo_Scorer
python3 -m http.server 8000 --bind 127.0.0.1
```

- App: <http://localhost:8000/index.html>
- Introduction and guide: <http://localhost:8000/manual.html>

## Workflow

1. Review the license checkboxes and press **Agree and Start** to accept the agreement.
2. Click the upload area or drop one photo into it.
3. Check the preview and press **Start Analysis**.
4. Review overall and category scores, composition overlays and suggestions.
5. Press **Select Again** to load another image and compare results.

The app does not automatically edit or overwrite the photo. Use the tips when shooting or editing elsewhere, then analyze the revised image.

## Categories

| Category | Overall weight | Main measurements |
| --- | ---: | --- |
| Composition | 25% | 9×9 energy map; thirds, golden ratio, spiral, diagonal, center and trapezoid patterns; balance and symmetry |
| Subject | 20% | Concentration of sharp regions and estimated subject/background separation |
| Exposure | 15% | 256-bin luminance histogram, brightness, clipping and tonal range |
| Color | 15% | Twelve hue bins, saturation and saturation variation |
| Sharpness | 10% | High-frequency response from a Laplacian-like operator |
| Bokeh / depth | 10% | Background sharpness, separation ratio and sharp-area proportion |
| Creativity | 5% | Rules combining brightness, contrast, color and composition |

The overall score is the rounded weighted sum. Analysis uses an image with a **maximum long edge of 800px** to reduce computation; the original file is unchanged.

## Grades

| Score | Grade |
| --- | --- |
| 95 or higher | S+ |
| 90–94 | S |
| 85–89 | A+ |
| 80–84 | A |
| 75–79 | B+ |
| 70–74 | B |
| 60–69 | C |
| 50–59 | D |
| Below 50 | F |

The implementation has nine grades. The introduction's eight-level description groups D and F together.

## Structure and processing

| File | Role |
| --- | --- |
| `index.html` | EULA, upload, analysis engine, results and SVG overlays |
| `manual.html` | Introduction and scoring guide |
| `README.md`, `README.en.md` | Korean and English documentation |

Processing reads the file, prepares a reduced Canvas, calculates pixel metrics, assigns category scores, computes the weighted overall score, generates the grade and feedback, and renders the result. The code contains sections for the analysis engine, file handling, feedback generation, composition overlays and result rendering.

| Function | Responsibility |
| --- | --- |
| `handleFile()`, `startAnalyze()` | File input and analysis image preparation |
| `analyzeImage()` | Pixel metrics, category scores and the overall score |
| `generateSummary()`, `generateDetailedTips()`, `generateQuickTips()` | Feedback: summaries and improvement suggestions |
| `buildOverlaySVG()` | Composition and estimated subject positions |
| `getGrade()`, `renderResults()` | Grade and results interface |

## Specifications

| Item | Implementation |
| --- | --- |
| Input | One image at a time; only the first file of a multi-file drop is used |
| File recognition | MIME type must start with `image/`; decoding uses the browser |
| Reading | `FileReader.readAsDataURL()` keeps the original in memory |
| Analysis resolution | Aspect ratio preserved, long edge at most 800px, no enlargement |
| Pixels | RGB from Canvas RGBA; alpha is excluded from scoring |
| Execution | Synchronous main-thread JavaScript; no Web Worker or GPU inference |
| Result lifetime | One `currentResult`; cleared when selecting a new file or resetting |
| Export / history | No permanent analysis history, batch processing or JSON/CSV export UI |
| Score bounds | Displayed on a 100-point scale; rounded category scores capped at 97; floors of 10, or 15 for subject and creativity |

Scale is `min(800 / max(originalWidth, originalHeight), 1)`, with rounded dimensions. A 6000×4000 photo becomes an 800×533 analysis Canvas. The displayed photo still uses the original Data URL, so the analysis resolution differs from the original resolution of the displayed image.

## Measurement and scoring

### Exposure

Pixel luminance is `round(0.299 × R + 0.587 × G + 0.114 × B)`. The app does not linearize light or analyze camera-sensor data.

- A 256-bin histogram spanning luminance 0–255 yields mean luminance and standard deviation.
- Shadow clipping counts bins 0–7; highlight clipping counts bins 248–255.
- `dynamicRange` is approximately the 95th-percentile luminance minus the 5th percentile. It is not sensor dynamic range or a stop measurement.
- Exposure starts at 50. The relative deviation of mean brightness from 128 earns 30, 25 or 15 points below 0.1, 0.2 or 0.35; otherwise, 25 times the deviation is subtracted.
- Shadow and highlight fractions each incur a penalty of 150 times the fraction, capped at 15 points apiece.
- Tonal range above 180 earns 12 points, above 120 earns 8, and below 60 loses 8. A luminance standard deviation greater than 35 and less than 85 earns 8.

### Composition energy

A **9×9 grid of 81 cells** is sampled every three pixels horizontally and vertically. Point energy is the sum of absolute luminance differences to the right and lower neighbors; cell averages form the energy map.

| Pattern | Measurement |
| --- | --- |
| Thirds / golden ratio | Energy near intersections relative to the global mean; only the better of these two becomes a final candidate |
| Spiral | Energy near predefined approximate spiral positions |
| Diagonal | Better of the two diagonal samples |
| Center | Mean energy around the center |
| Trapezoid | Central-column concentration combined with top/bottom row energy ratios |
| Symmetry / balance | Mirrored-cell differences and left/right, top/bottom sums; separate bonuses and penalties |

The score starts at 20, adding up to 32 for the best pattern, 12 for the second, 8 for symmetry, and balance bonuses. Overly uniform energy or weak, strongly imbalanced patterns are penalized. Pattern values are **relative energy-concentration measures**, not probabilities or confidence estimates.

### Sharpness, subject and bokeh

`avgSharpness` averages `abs(4 × centerLuminance − up − down − left − right)` while sampling every two pixels, excluding borders. This is mean absolute Laplacian response, not Laplacian variance.

Sharpness starts at 25. Responses above 3, 5, 7, 10 or 15 add 22, 35, 45, 55 or 65 respectively. Values above 12 earn a further 8. Extreme values above 35 incur a noise-related penalty capped at 15.

Subject/bokeh estimation separately uses a **7×7 grid of 49 cells**, each measuring the mean of right/down luminance differences sampled at two-pixel intervals:

1. The six sharpest cells, about 12%, are subject candidates; the ten least sharp, about 20%, are background candidates.
2. Their averages give `subjectSharp` and `bgSharp`. When `bgSharp > 0.05`, `subjectContrast = subjectSharp / bgSharp`; otherwise, a separate branch avoids division by zero.
3. `sharpAreaRatio` is the fraction of cells above 1.15 times overall mean cell sharpness. `sharpCV` is cell-sharpness standard deviation divided by its mean.
4. Subject scoring combines separation, variation, sharp-area share, central energy and subject sharpness. Bokeh scoring combines separation, absolute background sharpness, subject/background difference and sharp-area share.

Red rectangles mark the **centers of the six selected cells**. They are not object-outline, face, eye or actual focal-plane bounding boxes.

### Color, creativity and the overall score

Color analysis samples every 16 bytes of RGBA, approximately every fourth pixel. It computes HSV-like saturation and a **12-bin hue histogram** with 30-degree bins. Hue counts include only samples whose normalized RGB maximum/minimum difference exceeds 0.05. A hue bin is active if it exceeds 2% of all samples.

Color combines mean saturation, active hues, adjacent-hue continuity and saturation standard deviation. Very low-saturation monochrome images receive a floor adjustment to 45. Creativity combines aspect ratio, hue count, contrast, brightness/saturation combinations, symmetry, subject separation and saturation variation through rules.

```text
overall = round(composition × 0.25 + subject × 0.20
              + exposure × 0.15 + color × 0.15
              + sharpness × 0.10 + bokeh × 0.10
              + creativity × 0.05)
```

Because each category is capped at 97, the current formula cannot produce 100. Scores are deterministic for identical pixels and code, but browser decoding and Canvas resizing can affect values near thresholds.

## Result data and interface

`analyzeImage(canvas)` returns an internal JavaScript object for the renderer, not a public HTTP API or file format.

| Field | Type / meaning |
| --- | --- |
| `composition`, `exposure`, `subject`, `bokeh`, `color`, `sharpness`, `creativity` | Integer category scores |
| `overall`, `summary` | Integer overall score and a summary string describing strengths and areas for improvement |
| `detailed_tips` | Array of `{ title, description }` |
| `quick_tips` | Priority-ordered strings, at most 12 |
| `meta.meanBrightness`, `meta.dynamicRange` | Numeric luminance mean and percentile difference |
| `meta.avgSaturation`, `meta.sharpAreaRatio` | Percentage strings, one decimal / integer display |
| `meta.avgSharpness`, `meta.bgSharp`, `meta.subjectSharp` | Strings with one decimal place |
| `meta.subjectContrast`, `meta.sharpCV`, `meta.compBest` | Strings with two decimals |
| `meta.compPattern`, `meta.compScore2` | First- and second-place pattern names; `compScore2` is a name, not a number |
| `meta.compPatterns`, `meta.symmetryScore` | `{ name, score }` array sorted by score and a number rounded to two decimals |
| `meta.subjectPositions` | `{ x, y }` positions normalized to 0–100 by image width/height |
| `meta.imgW`, `meta.imgH` | Analysis Canvas dimensions in pixels |

Not every intermediate histogram, energy map or clipping ratio is returned. Convert display strings to numbers before further numerical use.

| UI | Function / state |
| --- | --- |
| EULA, upload and preview | EULA functions, `handleFile()`, `currentImage` |
| Analysis indicator | `startAnalyze()` schedules analysis after 100ms and clears the indicator on completion |
| Photo overlay | `buildOverlaySVG()` draws at most three patterns above 0.7, plus subject candidates |
| Overall score and ring | `renderResults()`, `animateNumber()`, `renderScoreRing()` |
| Category scores, detailed suggestions, quick tips | `renderScoresTab()`, `renderDetailedTab()`, `renderQuickTab()`, `switchTab()` |
| Restart | `resetApp()` clears image, result, tabs and file input |

## Privacy and interpretation limits

- Photos are analyzed in browser memory. There is no feature that uploads photos to a remote server or creates an account for analysis.
- Google Fonts still makes network requests, so “local analysis” does not mean the web page makes no network requests.
- Scores are practice and comparison aids, not objective judgments of artistic meaning, storytelling, photographic intent or artistic value.
- Subject and depth estimates come from sharpness distributions. The app does not recognize object meaning or measure actual distance or aperture.
- Resizing to 800px, compression, noise and strong editing can change results. A low bokeh score does not imply a flaw in a landscape or documentary photo.
- Camera, lens, ISO, shutter speed and aperture EXIF are not read. Shooting values in tips are rule-based suggestions, not measured capture settings.
- The original is read and decoded before reduction, so total memory is not limited to an 800px image. There is no dedicated file-size cap or minimum-image-size validation.
- The internal `meta` passed to tip generation omits `compPattern`, `compBest` and `satStd`, so some pattern- and saturation-variation-based advice conditions cannot fire. Composition data reaches the result object and SVG separately.
- There is no specialized analysis/recovery UI for transparent images, tiny inputs or decode failures. Ordinary opaque photographs are the intended inputs.

## Troubleshooting

- If loading fails, convert to JPG, PNG or WebP. RAW/HEIC decoding depends on the browser.
- For slow analysis, use a reduced copy of a large original and close memory-intensive tabs.
- Interpret scores alongside photographic intent. Editing solely to raise the score does not necessarily improve a photograph.

## License

The in-app EULA permits personal, educational and non-commercial use. Distribution without permission, redistribution of modified versions, commercial use, paid services and resale are restricted. Consult the actual agreement for the full conditions.

Copyright © 2026 Velvitty (Yeony). All rights reserved.
