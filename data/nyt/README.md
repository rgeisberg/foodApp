# NYT Import Pipeline

This folder stores recipe source URLs and generated artifacts for the New York Times Cooking import flow.

## Layout

- `json/`: structured extracted recipe data downloaded from your browser
- `pdfs/`: optional manual PDF archives you save yourself
- `csv/`: normalized CSV export for recipe and ingredient import

## Notes

- Use only your own subscription session in your normal browser.
- Open each NYT recipe manually, then run the browser extractor from `scripts/nyt/browser-extractor.js` or the bookmarklet in `scripts/nyt/bookmarklet.txt`.
- Save the downloaded `.json` files into `data/nyt/json/`.
- PDFs are optional backups. If you want them, use the browser print dialog and save them into `data/nyt/pdfs/`.
- The CSV export is built from JSON extraction, not PDF text parsing.
