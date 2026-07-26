# Player data provenance

## Committed snapshot

`src/data/players.json` is a local, generated snapshot last refreshed on **2026-07-26**. The browser never contacts a statistics service.

The refresh pipeline combines four public snapshots:

- The MIT-licensed [NBA Dataset (1947–2025)](https://www.kaggle.com/datasets/dahan1/nba-dataset-1947-2025) supplies NBA regular-season games, minutes, points, rebounds, assists, positions, historical team rows, and annual award codes.
- The CC BY 4.0 [V2 NBA Player Database](https://www.kaggle.com/datasets/flynn28/v2-nba-player-database) supplies Hall of Fame and active-player flags for automatically added records.
- Basketball Reference's [championships-by-player table](https://www.basketball-reference.com/leaders/most_championships.html) and [Finals MVP table](https://www.basketball-reference.com/awards/finals_mvp.html) supply exact listed career counts.
- The original 84 curator-reviewed records retain their exact Basketball Reference player-profile sources and identity enrichment.

The generator applies only NBA rows from the season snapshot. It aggregates the underlying historical team rows, which do not contain multi-team `TOT` duplicates, and derives:

- NBA debut and last played seasons.
- Regular-season games and minutes by historical team abbreviation.
- Games by season for practice-decade assignment.
- One-decimal career regular-season averages for points, rebounds, and assists.
- Primary and secondary positions, ranked by games.
- All-Star, All-NBA, All-Defensive, MVP, DPOY, ROY, Sixth Man, and Most Improved counts from annual award codes.
- The source indicators retained for future analysis and the strict Hardcore filter: 200+ games and a displayed PTS+REB+AST career-average sum of at least 15.0.

Championship counts not confirmed by the curated profile data or the sourced championships table are stored as `null`, as are statistical-title counts for automatically added records. The clue generator displays only positive numeric counts, so unavailable information is never invented or presented as zero. The Finals MVP table is exhaustive, so a missing entry there is a factual zero.

The project uses the [NBA statistics site](https://www.nba.com/stats) as the official cross-check destination for maintainers. Current franchise logo SVGs are bundled from the NBA CDN so the app remains self-contained after installation.

## Curated fields

The following fields live in `scripts/player-definitions.mjs` for curated players and require human review:

- Common display name and accepted aliases.
- Initials.
- Basketball nationality and birth country.
- Naismith Hall of Fame status.
- Normal-pool inclusion.
- Manual historical-notability flag.

Automatically added records carry an explicit provenance note and `Not yet curated` identity metadata until a maintainer reviews their aliases, nationality, and birth country. Their statistical fields, positions, seasons, team totals, verified award counts, and eligibility are source-derived. Automatic Normal selection uses the recognition thresholds exported in `scripts/fetch-player-data.mjs`; an explicit curated `normalPool` value always overrides it.

The broad profile snapshot currently reflects active status through 2024–25 and must be refreshed and manually checked for off-season retirements. The original curated records have a later 2025–26 profile refresh.

## Refresh policy

The refresh script caches the two ZIP archives and two accolade tables under `.cache/nba-data`. Use:

```bash
npm run data:refresh
npm run data:validate
npm test
npm run build
```

Delete the cache path or set `NBA_DATA_CACHE` when a genuinely fresh source read is required. Review the generated diff rather than accepting it blindly, especially for active status, automatically selected Normal players, identity metadata, and franchise-name changes. The script fails if the result falls below 200 Normal or 400 Hardcore records.

One duplicate full-name group in the current filtered universe is excluded because a text-only answer cannot distinguish those players fairly. Basketball Reference and Kaggle snapshots are cited maintainer sources, not runtime dependencies. NBA team names and logos remain trademarks of their respective owners.
