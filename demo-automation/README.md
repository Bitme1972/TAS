# TAS repeatable guided-tour generator

This is a deterministic alternative to a manual OBS recording. The script drives the real **synthetic TAS Demo** in Chromium, captures the verified states reached by its clicks, then renders a guided MP4 with burned-in captions plus separate SRT and WebVTT subtitles.

## Windows development use

1. Install Python 3 and FFmpeg.
2. From the TAS package root, run:

```text
python -m pip install -r demo-automation\requirements.txt
playwright install chromium
```

3. Run `demo-automation\RECORD_TAS_DEMO.cmd`.

A locally installed Chrome or Edge is detected automatically. Set `TAS_CHROMIUM` to an exact browser executable path when required.

## Outputs

- `public/media/TAS_Interactive_Product_Tour.mp4`
- `public/media/TAS_Interactive_Product_Tour.en.srt`
- `public/media/TAS_Interactive_Product_Tour.en.vtt`
- `public/media/TAS_Interactive_Product_Tour_Poster.png`
- `public/media/TAS_Interactive_Product_Tour.manifest.json`

## Security boundary

The automation records only the separate synthetic Demo build. It does not load customer evidence, the commercial Golden baseline, premium datasets or the entitled MSI.
