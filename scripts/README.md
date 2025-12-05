# Maintenance Scripts

## Update Card Data

Updates existing cards with improved data extraction from TCGPlayer.

### What it does:
- ✅ Fixes card names with apostrophes (e.g., "Jetmir's Garden")
- ✅ Adds missing `cardType` field (e.g., "Land — Mountain Forest Plains")
- ✅ Adds missing `description` field (card text/abilities)
- 🔄 Only updates cards that have a TCGPlayer URL
- ⚡ Includes 2-second rate limiting between requests

### How to run:

```bash
npm run update-cards
```

### Output:
The script will show progress for each card:
```
[1/50] Processing: Jetmir's Garden
  🔍 Fetching from TCGPlayer...
  📝 Name: "Jetmir" → "Jetmir's Garden (Showcase)"
  🃏 Card Type: "null" → "Land — Mountain Forest Plains"
  ✅ Updated

[2/50] Processing: Lightning Bolt
  ⏭️  No changes needed
```

### Summary:
```
====================================================
Update complete!
====================================================
✅ Updated: 35
⏭️  Skipped: 10
❌ Failed: 5
📊 Total: 50
```

### Notes:
- The script uses the Scrapfly API (requires `SCRAPFLY_API_KEY` in `.env`)
- Rate limited to avoid overwhelming the API
- Safe to run multiple times (only updates changed data)
- Can be interrupted and resumed (updates one card at a time)

