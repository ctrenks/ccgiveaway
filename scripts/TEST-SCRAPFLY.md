# Test Scrapfly Locally

This script fetches a TCGPlayer page using Scrapfly and saves the raw response so you can debug what's being returned.

## Setup

1. Get your Scrapfly API key from `.env.local` or Vercel dashboard
2. Set it in your environment:

```bash
# Windows PowerShell
$env:SCRAPFLY_API_KEY="your_key_here"

# Windows CMD
set SCRAPFLY_API_KEY=your_key_here

# Mac/Linux
export SCRAPFLY_API_KEY=your_key_here
```

## Run

```bash
node scripts/test-scrapfly.js
```

## What it does

1. Fetches a TCGPlayer product page (Arid Mesa by default)
2. Uses same settings as production (10s wait, auto_scroll, etc.)
3. Saves TWO files:
   - `scrapfly-response.json` - Full Scrapfly response with all metadata
   - `scrapfly-page.html` - The actual HTML that was returned
4. Shows you:
   - Dollar amounts found in the HTML
   - Whether price tables exist
   - Whether it's just the Vue shell
   - Cost in Scrapfly credits

## Edit the URL

Open `scripts/test-scrapfly.js` and change the `TEST_URL` to any TCGPlayer product page you want to test.

## Files Generated

- `scrapfly-response.json` - Contains everything Scrapfly returned
- `scrapfly-page.html` - Open this in a browser to see what Scrapfly saw

