# Full Court — NBA Player Guessing Game

Full Court is a browser-based NBA trivia MVP built around basketball knowledge rather than chance. Identify a player from five progressively easier career clues, protect the points still on the board, and review the full answer before moving on.

The app is fully local at runtime: no account, backend, database, paid API, or live statistics request is required.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

Create and preview a production build:

```bash
npm run build
npm run preview
```

## Publish with GitHub Pages

The repository includes [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). It validates, builds, and publishes the game whenever the `main` branch changes.

1. Push the project to a GitHub repository whose default branch is `main`.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Open **Actions** and run **Deploy to GitHub Pages**, or push another commit to `main`.

For a project repository, the build automatically uses `/<repository-name>/` as its public base path. A repository named `<username>.github.io` uses `/`. Team-logo URLs follow that base automatically.

If a custom domain is added later, set `VITE_BASE_PATH=/` for the build.

## Tests

Run the unit and data-validation suites:

```bash
npm test
npm run data:validate
```

Install Playwright's browser once, then run the end-to-end suite:

```bash
npx playwright install chromium
npm run test:e2e
```

The unit suite covers scoring, cumulative deductions, duplicate guesses, normalization, accented names, ambiguous surnames, pool and era eligibility, main-team sorting and tie-breaking, decade assignment, no-repeat selection, and the complete player-data validator. The Playwright suite covers the main ten-round loop, misses, clue reveals, correct answers, giving up, completing all ten rounds, and high-score persistence.

## Game rules

Every round reveals clues in this order:

1. One randomly selected historical NBA team for which the player made at least 100 regular-season appearances, plus every decade in which they appeared in the NBA. The decades describe the full NBA career and do not imply that the player represented the displayed team throughout those decades. If no team stint reaches 100 games, the player's most-played team is used.
2. Career NBA regular-season averages for points, rebounds, and assists per game.
3. Two or three of the player's most relevant exact achievement counts.
4. Primary and applicable secondary positions.
5. Common-name initials.

The clue-level bases are 100, 80, 60, 40, and 20 points. Every distinct incorrect guess costs 10 points, including misses made before a later clue is revealed:

```text
round_score = max(0, current_clue_base_score - 10 × total_incorrect_guesses)
```

Empty guesses, genuine ambiguous surnames, and duplicate guesses do not cost points. A player can keep guessing at zero. Giving up earns zero. Answer matching ignores case, spacing, punctuation, hyphens, apostrophes, periods, accents, and a conservative number of minor typing errors. Lists of names are rejected.

## Modes

- **Ten-round challenge** is the default. It uses ten different players, has a 1,000-point maximum, and finishes with a full round-by-round box score.
- **Endless mode** continues without repeats until the pool is exhausted, then clearly resets the rotation. Cumulative local statistics are kept by pool.
- **Practice mode** filters an endless session to the 1980s, 1990s, 2000s, 2010s, or 2020s. A player's decade is the starting year of the season in which they made the most regular-season appearances; the earliest season breaks a tie. Eligible players whose busiest season predates 1980 remain available in the regular pools but are not forced into an inaccurate practice decade.

## Player pools

Pool rules live in [`src/game/config.ts`](src/game/config.ts) and [`src/game/eligibility.ts`](src/game/eligibility.ts), outside UI components.

- **Normal** is a recognition-first set: curator overrides plus Hall of Famers, MVP/Finals MVP/DPOY winners, players with at least two All-NBA or four All-Star selections, qualified multi-title contributors, and active All-Stars.
- **Hardcore** requires both at least 200 NBA regular-season games and a combined career average of at least 15.0 when points, rebounds, and assists per game are added together. The filter uses the one-decimal averages stored and displayed by the game. Every Normal player must also be Hardcore-eligible.

The committed snapshot contains **207 Normal players** and **832 Hardcore players**. The first curator-reviewed records retain manually reviewed identity data and aliases; the broader pool is selected from a source-derived NBA season universe. One duplicate full-name group is excluded because a text answer could not fairly distinguish the players.

## Era and franchise rules

A player is eligible only when their NBA career extended into the 1979–80 season or later. A final season of 1979–80 passes; 1978–79 fails. ABA-only teams and statistics are excluded even for players whose careers began in the ABA.

Team stints preserve the team name and abbreviation used during the player's appearances—such as Seattle SuperSonics or New Jersey Nets—while also storing a common modern franchise ID. Clue rankings are based on appearances for the displayed historical team name. Bundled logo art uses the current franchise mark, including for historical team names.

## Player data and validation

Runtime records are typed by [`src/data/types.ts`](src/data/types.ts) and stored in the generated structured file [`src/data/players.json`](src/data/players.json). Each record includes identity and accepted answers, active years, positions, nationality, birth country, historical team games and minutes, season appearances, career PTS/REB/AST averages, verified achievement counts, Hall of Fame status, Hardcore indicators, pool flags, sources, a provenance note, and a verification date. An unavailable achievement count is stored as `null` and is never presented as zero.

To add or update a curated player:

1. Add the curated identity entry and Basketball Reference ID to [`scripts/player-definitions.mjs`](scripts/player-definitions.mjs).
2. If the player used an unmapped historical team abbreviation, add it to the franchise map in [`scripts/fetch-player-data.mjs`](scripts/fetch-player-data.mjs).
3. Run `npm run data:refresh`. The generator reads the cached or downloaded bulk NBA season and profile snapshots, adds exact Basketball Reference accolade tables, applies the era and pool rules, and refreshes the committed static JSON. It is a maintainer task and is not used by the browser app.
4. Manually review accepted names, initials, nationality, birth country, Hall of Fame status, active status, and Normal-pool inclusion.
5. Run `npm run data:validate`, `npm test`, and `npm run build`.

Development startup throws a readable error when dataset validation fails. The validator checks unique IDs, accepted answers, teams, non-negative team totals and achievement counts, season order, active-player final seasons, initials, pool inclusion, Hardcore criteria, five-clue generation, the era cutoff, and provenance.

See [`DATA_SOURCES.md`](DATA_SOURCES.md) for the source and verification approach.

## Persistence

Local storage preserves:

- Ten-round high scores for Normal and Hardcore.
- Endless totals by pool.
- The most recent mode, pool, and decade.
- A practical unfinished-game snapshot.

Settings includes a confirmed **Reset saved data** action. Leaving an active ten-round game also requires confirmation.

## Architecture and a future football mode

The implementation separates four layers:

- `src/data`: typed sport data, provenance, and validation.
- `src/game`: sport-neutral scoring, round state, answer normalization, selection, formats, configuration, and persistence.
- `src/components`: the current basketball clue presentation and screens.
- `e2e`: user-level behavior.

Football can be added as a separate data package and clue adapter while reusing score calculation, round management, submission state, no-repeat selection, modes, results, and persistence. The generic engine stores entity IDs and outcomes rather than NBA statistics; basketball assumptions are kept in the player model and clue generator.

## Known MVP limitations

- The bulk season snapshot currently ends with 2024–25. The 84 curated records include a later profile refresh, but broad-pool games, team totals, and newly reached eligibility thresholds should be regenerated when a 2025–26 bulk snapshot is available.
- Identity aliases, nationality, and birth country are not yet manually reviewed for 1,140 automatically added records. Full names and unique surnames still work normally.
- Championship counts are exact for curated profiles and players listed on the sourced championships table; otherwise they are `null`. Statistical-title counts are also `null` for automatically added records. Unverified categories are omitted from clues rather than shown as zero.
- Four same-name player groups are intentionally excluded until distinct standard display names can be curated.
- Historical team names use the current franchise logo rather than a period-specific mark.
- Minor-typo handling is deliberately conservative and does not attempt semantic name parsing.
- No player photography, account sync, online leaderboard, localization, or backend moderation is included.

NBA team names and logos are trademarks of their respective owners. This non-commercial prototype uses them only for identification in sports trivia.
