import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import { playerDefinitions } from './player-definitions.mjs'

const outputPath = new URL('../src/data/players.json', import.meta.url)
const cacheDir = process.env.NBA_DATA_CACHE ?? '.cache/nba-data'
const lastVerified = process.env.NBA_LAST_VERIFIED ?? new Date().toISOString().slice(0, 10)

const sourceUrls = {
  seasonStats: 'https://www.kaggle.com/datasets/dahan1/nba-dataset-1947-2025',
  seasonStatsDownload: 'https://www.kaggle.com/api/v1/datasets/download/dahan1/nba-dataset-1947-2025',
  profiles: 'https://www.kaggle.com/datasets/flynn28/v2-nba-player-database',
  profilesDownload: 'https://www.kaggle.com/api/v1/datasets/download/flynn28/v2-nba-player-database',
  championships: 'https://www.basketball-reference.com/leaders/most_championships.html',
  championshipsMirror:
    'https://r.jina.ai/https://www.basketball-reference.com/leaders/most_championships.html',
  finalsMvp: 'https://www.basketball-reference.com/awards/finals_mvp.html',
  finalsMvpMirror: 'https://r.jina.ai/https://www.basketball-reference.com/awards/finals_mvp.html',
}

export const NORMAL_POOL_RULES = {
  minimumAllNbaSelections: 2,
  minimumAllStarSelections: 4,
  activeStarMinimumAllStarSelections: 1,
}
export const HARDCORE_POOL_RULES = {
  minimumRegularSeasonGames: 200,
  minimumCombinedCareerAverage: 15,
}
const NORMAL_POOL_EXCLUDED_NAMES = new Set(['phil jackson'])

const teams = {
  ATL: ['atl', 'Atlanta Hawks', 'ATL', 'atl'],
  BAL: ['was', 'Baltimore Bullets', 'BAL', 'was'],
  BOS: ['bos', 'Boston Celtics', 'BOS', 'bos'],
  BRK: ['bkn', 'Brooklyn Nets', 'BKN', 'bkn'],
  NJN: ['bkn', 'New Jersey Nets', 'NJN', 'bkn'],
  NYN: ['bkn', 'New York Nets', 'NYN', 'bkn'],
  BUF: ['lac', 'Buffalo Braves', 'BUF', 'lac'],
  CAP: ['was', 'Capital Bullets', 'CAP', 'was'],
  CHA: ['cha', 'Charlotte Bobcats', 'CHA', 'cha'],
  CHH: ['cha', 'Charlotte Hornets', 'CHH', 'cha'],
  CHO: ['cha', 'Charlotte Hornets', 'CHA', 'cha'],
  CHI: ['chi', 'Chicago Bulls', 'CHI', 'chi'],
  CIN: ['sac', 'Cincinnati Royals', 'CIN', 'sac'],
  CLE: ['cle', 'Cleveland Cavaliers', 'CLE', 'cle'],
  DAL: ['dal', 'Dallas Mavericks', 'DAL', 'dal'],
  DEN: ['den', 'Denver Nuggets', 'DEN', 'den'],
  DET: ['det', 'Detroit Pistons', 'DET', 'det'],
  GSW: ['gsw', 'Golden State Warriors', 'GSW', 'gsw'],
  SFW: ['gsw', 'San Francisco Warriors', 'SFW', 'gsw'],
  HOU: ['hou', 'Houston Rockets', 'HOU', 'hou'],
  SDR: ['hou', 'San Diego Rockets', 'SDR', 'hou'],
  IND: ['ind', 'Indiana Pacers', 'IND', 'ind'],
  KCK: ['sac', 'Kansas City Kings', 'KCK', 'sac'],
  KCO: ['sac', 'Kansas City-Omaha Kings', 'KCO', 'sac'],
  LAC: ['lac', 'Los Angeles Clippers', 'LAC', 'lac'],
  LAL: ['lal', 'Los Angeles Lakers', 'LAL', 'lal'],
  MEM: ['mem', 'Memphis Grizzlies', 'MEM', 'mem'],
  MIA: ['mia', 'Miami Heat', 'MIA', 'mia'],
  MIL: ['mil', 'Milwaukee Bucks', 'MIL', 'mil'],
  MIN: ['min', 'Minnesota Timberwolves', 'MIN', 'min'],
  NOH: ['nop', 'New Orleans Hornets', 'NOH', 'nop'],
  NOK: ['nop', 'New Orleans/Oklahoma City Hornets', 'NOK', 'nop'],
  NOP: ['nop', 'New Orleans Pelicans', 'NOP', 'nop'],
  NOJ: ['uta', 'New Orleans Jazz', 'NOJ', 'uta'],
  NYK: ['nyk', 'New York Knicks', 'NYK', 'nyk'],
  OKC: ['okc', 'Oklahoma City Thunder', 'OKC', 'okc'],
  ORL: ['orl', 'Orlando Magic', 'ORL', 'orl'],
  PHI: ['phi', 'Philadelphia 76ers', 'PHI', 'phi'],
  PHO: ['phx', 'Phoenix Suns', 'PHX', 'phx'],
  POR: ['por', 'Portland Trail Blazers', 'POR', 'por'],
  SAC: ['sac', 'Sacramento Kings', 'SAC', 'sac'],
  SAS: ['sas', 'San Antonio Spurs', 'SAS', 'sas'],
  SDC: ['lac', 'San Diego Clippers', 'SDC', 'lac'],
  SEA: ['okc', 'Seattle SuperSonics', 'SEA', 'okc'],
  STL: ['atl', 'St. Louis Hawks', 'STL', 'atl'],
  TOR: ['tor', 'Toronto Raptors', 'TOR', 'tor'],
  UTA: ['uta', 'Utah Jazz', 'UTA', 'uta'],
  VAN: ['mem', 'Vancouver Grizzlies', 'VAN', 'mem'],
  WAS: ['was', 'Washington Wizards', 'WAS', 'was'],
  WSB: ['was', 'Washington Bullets', 'WSB', 'was'],
}

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.’'`-]/g, ' ')
    .replace(/\./g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, '-')
}

function getNameParts(displayName) {
  const suffixes = new Set(['jr.', 'sr.', 'ii', 'iii', 'iv'])
  const parts = displayName.split(/\s+/)
  const significant = parts.filter((part) => !suffixes.has(part.toLowerCase()))
  return { firstName: significant[0], lastName: significant.at(-1) }
}

function getInitials(displayName) {
  const suffixes = new Set(['jr.', 'sr.', 'ii', 'iii', 'iv'])
  const letters = displayName
    .split(/[\s-]+/)
    .filter((part) => !suffixes.has(part.toLowerCase()))
    .flatMap((part) => {
      const punctuated = [...part.matchAll(/([A-Za-z])\./g)].map((match) => match[1])
      return punctuated.length ? punctuated : [part[0]]
    })
    .filter(Boolean)
    .map((letter) => letter.toUpperCase())
  return `${letters.join('.')}.`
}

function seasonFromEndYear(endYear) {
  return `${endYear - 1}-${String(endYear % 100).padStart(2, '0')}`
}

function number(value) {
  if (value === '' || value === 'NULL' || value === undefined) return 0
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

function roundOne(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const headers = rows[0]
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  )
}

async function fetchCached(cacheKey, url) {
  await mkdir(cacheDir, { recursive: true })
  const cachePath = join(cacheDir, cacheKey)
  if (existsSync(cachePath)) return readFile(cachePath)

  const response = await fetch(url, {
    headers: { 'user-agent': 'Guess the Player NBA trivia data validation/0.3' },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} fetching ${url}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  await writeFile(cachePath, bytes)
  return bytes
}

function textFileFromZip(bytes, filename) {
  const archive = unzipSync(new Uint8Array(bytes))
  const file = archive[filename]
  if (!file) throw new Error(`Missing ${filename} in source archive`)
  return strFromU8(file)
}

function countAwardSeasons(rows, pattern) {
  return new Set(
    rows
      .filter((row) => (row.Awards ?? '').split(',').some((award) => pattern.test(award)))
      .map((row) => row.season),
  ).size
}

function parseChampionshipCounts(markdown) {
  const counts = new Map()
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|') || !line.includes('/players/')) continue
    const cells = line.split('|').map((cell) => cell.trim())
    const player = line.match(/\[([^\]]+)\]\(https:\/\/www\.basketball-reference\.com\/players\//)?.[1]
    const count = Number(cells.at(-2))
    if (player && Number.isFinite(count)) counts.set(normalizeName(player.replace(/\*/g, '')), count)
  }
  return counts
}

function parseFinalsMvpCounts(markdown) {
  const counts = new Map()
  const summary = markdown.slice(markdown.indexOf('Summary Table'))
  for (const line of summary.split('\n')) {
    if (!line.startsWith('|') || !line.includes('/players/')) continue
    const cells = line.split('|').map((cell) => cell.trim())
    const player = line.match(/\[([^\]]+)\]\(https:\/\/www\.basketball-reference\.com\/players\//)?.[1]
    const league = cells.at(-3)
    const count = Number(cells.at(-2))
    if (player && league === 'NBA' && Number.isFinite(count)) {
      counts.set(normalizeName(player.replace(/\*/g, '')), count)
    }
  }
  return counts
}

function isRecognisableNormalPlayer(player, definition) {
  if (typeof definition?.normalPool === 'boolean') return definition.normalPool
  if (NORMAL_POOL_EXCLUDED_NAMES.has(normalizeName(player.displayName))) return false
  const achievements = player.achievements
  const allNbaSelections = achievements.allNbaSelections ?? 0
  const allStarSelections = achievements.allStarSelections ?? 0
  return (
    player.hallOfFame ||
    (achievements.mvpAwards ?? 0) > 0 ||
    (achievements.finalsMvpAwards ?? 0) > 0 ||
    (achievements.defensivePlayerOfYearAwards ?? 0) > 0 ||
    allNbaSelections >= NORMAL_POOL_RULES.minimumAllNbaSelections ||
    allStarSelections >= NORMAL_POOL_RULES.minimumAllStarSelections ||
    ((achievements.championships ?? 0) >= 2 &&
      (allStarSelections > 0 || (achievements.allDefensiveSelections ?? 0) > 0)) ||
    (player.active &&
      allStarSelections >= NORMAL_POOL_RULES.activeStarMinimumAllStarSelections)
  )
}

function derivePlayer(rows, profile, definition, championshipCounts, finalsMvpCounts) {
  const sourceName = rows[0].Player
  const displayName = definition?.displayName ?? sourceName
  const normalizedName = normalizeName(sourceName)
  const { firstName, lastName } = definition ?? getNameParts(displayName)

  const seasonTotals = new Map()
  const teamTotals = new Map()
  const positionTotals = new Map()
  for (const row of rows) {
    const season = number(row.season)
    const seasonTotal = seasonTotals.get(season) ?? { games: 0, points: 0 }
    seasonTotal.games += number(row.G)
    seasonTotal.points += number(row.PTS)
    seasonTotals.set(season, seasonTotal)

    const team = teamTotals.get(row.abrv_team) ?? { games: 0, minutes: 0 }
    team.games += number(row.G)
    team.minutes += number(row.MP)
    teamTotals.set(row.abrv_team, team)

    positionTotals.set(row.Pos, (positionTotals.get(row.Pos) ?? 0) + number(row.G))
  }

  const seasonAppearances = [...seasonTotals.entries()]
    .sort(([left], [right]) => left - right)
    .map(([season, totals]) => ({ season: seasonFromEndYear(season), games: totals.games }))
  const finalSeasonEndYear = Math.max(...seasonTotals.keys())
  if (finalSeasonEndYear < 1980) return null

  const regularSeasonGames = [...seasonTotals.values()].reduce((sum, season) => sum + season.games, 0)
  const careerAverages = {
    points: roundOne(rows.reduce((sum, row) => sum + number(row.PTS), 0) / regularSeasonGames),
    rebounds: roundOne(rows.reduce((sum, row) => sum + number(row.TRB), 0) / regularSeasonGames),
    assists: roundOne(rows.reduce((sum, row) => sum + number(row.AST), 0) / regularSeasonGames),
  }
  const combinedCareerAverage =
    careerAverages.points + careerAverages.rebounds + careerAverages.assists
  const hasTwentyPointSeason = [...seasonTotals.values()].some(
    (season) => season.games > 0 && season.points / season.games >= 20,
  )
  const achievements = {
    championships: championshipCounts.get(normalizedName) ?? null,
    mvpAwards: countAwardSeasons(rows, /^MVP-1$/),
    finalsMvpAwards: finalsMvpCounts.get(normalizedName) ?? 0,
    allStarSelections: countAwardSeasons(rows, /^AS$/),
    allNbaSelections: countAwardSeasons(rows, /^NBA[123]$/),
    allDefensiveSelections: countAwardSeasons(rows, /^DEF[123]$/),
    defensivePlayerOfYearAwards: countAwardSeasons(rows, /^DPOY-1$/),
    rookieOfYearAwards: countAwardSeasons(rows, /^ROY-1$/),
    sixthManAwards: countAwardSeasons(rows, /^6MOY-1$/),
    mostImprovedAwards: countAwardSeasons(rows, /^MIP-1$/),
    statisticalTitles: { scoring: null, assists: null, rebounds: null, steals: null, blocks: null },
  }
  const hasMajorAward =
    achievements.mvpAwards +
      achievements.finalsMvpAwards +
      achievements.defensivePlayerOfYearAwards +
      achievements.rookieOfYearAwards +
      achievements.sixthManAwards +
      achievements.mostImprovedAwards >
    0
  const historicallyNotable = definition?.historicallyNotable ?? false
  const hardcoreEligible =
    regularSeasonGames >= HARDCORE_POOL_RULES.minimumRegularSeasonGames &&
    combinedCareerAverage >= HARDCORE_POOL_RULES.minimumCombinedCareerAverage

  const positions = [...positionTotals.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([position]) => position)
  if (!positions.length) throw new Error(`No position for ${displayName}`)

  const playerTeams = [...teamTotals.entries()].map(([abbreviation, totals]) => {
    if (!teams[abbreviation]) throw new Error(`Unknown team abbreviation ${abbreviation} for ${displayName}`)
    const [franchiseId, teamName, displayAbbreviation, logoId] = teams[abbreviation]
    return {
      teamId: abbreviation.toLowerCase(),
      franchiseId,
      teamName,
      abbreviation: displayAbbreviation,
      games: totals.games,
      minutes: totals.minutes,
      logoPath: `/team-logos/${logoId}.svg`,
    }
  })

  const active = profile?.Active === 'True'
  const hallOfFame = definition?.hallOfFame || profile?.HOF === 'True'
  const player = {
    id: definition?.id ?? `${slugify(displayName)}-${rows[0].player_id}`,
    displayName,
    acceptedNames: definition?.acceptedNames ?? [displayName],
    firstName,
    lastName,
    initials: definition?.initials ?? getInitials(displayName),
    active,
    debutSeason: seasonAppearances[0].season,
    finalSeason: active ? null : seasonAppearances.at(-1).season,
    primaryPosition: positions[0],
    secondaryPositions: positions.slice(1),
    basketballNationality: definition?.basketballNationality ?? 'Not yet curated',
    birthCountry: definition?.birthCountry ?? 'Not yet curated',
    teams: playerTeams,
    seasonAppearances,
    careerAverages,
    achievements,
    hallOfFame,
    majorSeasonIndicators: {
      regularSeasonGames,
      hasAllStarSelection: achievements.allStarSelections > 0,
      hasAllLeagueSelection:
        achievements.allNbaSelections > 0 || achievements.allDefensiveSelections > 0,
      hasMajorAward,
      hasTwentyPointSeason,
      historicallyNotable,
    },
    normalPool: false,
    hardcoreEligible,
    sources: [
      sourceUrls.seasonStats,
      sourceUrls.profiles,
      sourceUrls.championships,
      sourceUrls.finalsMvp,
    ],
    provenanceNote:
      'NBA seasons, historical team totals, positions, and annual award codes come from the MIT-licensed season snapshot; Hall of Fame and active flags come from the CC BY 4.0 player snapshot. Basketball Reference supplies exact listed championship and Finals MVP counts. Null achievement counts are intentionally unverified and never displayed as zero.',
    lastVerified,
  }
  player.normalPool = isRecognisableNormalPlayer(player, definition)
  return player
}

const [statsArchive, profilesArchive, championshipsBytes, finalsMvpBytes] = await Promise.all([
  fetchCached('nba-season-stats.zip', sourceUrls.seasonStatsDownload),
  fetchCached('nba-player-profiles.zip', sourceUrls.profilesDownload),
  fetchCached('championships.md', sourceUrls.championshipsMirror),
  fetchCached('finals-mvp.md', sourceUrls.finalsMvpMirror),
])

const statsRows = parseCsv(textFileFromZip(statsArchive, 'nba_player_season_total'))
const profileRows = parseCsv(textFileFromZip(profilesArchive, 'NBA_PLAYERS.csv'))
const profilesByName = new Map(profileRows.map((profile) => [normalizeName(profile.Name), profile]))
const definitionsByName = new Map(
  playerDefinitions.map((definition) => [normalizeName(definition.displayName), definition]),
)
const championshipCounts = parseChampionshipCounts(strFromU8(new Uint8Array(championshipsBytes)))
const finalsMvpCounts = parseFinalsMvpCounts(strFromU8(new Uint8Array(finalsMvpBytes)))

const rowsByPlayerId = new Map()
for (const row of statsRows) {
  const rows = rowsByPlayerId.get(row.player_id) ?? []
  rows.push(row)
  rowsByPlayerId.set(row.player_id, rows)
}

const derivedCandidates = []
for (const rows of rowsByPlayerId.values()) {
  const normalizedName = normalizeName(rows[0].Player)
  const definition = definitionsByName.get(normalizedName)
  const player = derivePlayer(
    rows,
    profilesByName.get(normalizedName),
    definition,
    championshipCounts,
    finalsMvpCounts,
  )
  if (player) derivedCandidates.push(player)
}

const hardcoreCandidates = derivedCandidates.filter((player) => player.hardcoreEligible)
const eligibleNameCounts = new Map()
for (const player of hardcoreCandidates) {
  const name = normalizeName(player.displayName)
  eligibleNameCounts.set(name, (eligibleNameCounts.get(name) ?? 0) + 1)
}
const ambiguousNames = new Set(
  [...eligibleNameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name),
)

let existingPlayers = []
if (existsSync(outputPath)) existingPlayers = JSON.parse(await readFile(outputPath, 'utf8'))
const existingById = new Map(existingPlayers.map((player) => [player.id, player]))
const derivedById = new Map(derivedCandidates.map((player) => [player.id, player]))

const curatedPlayers = playerDefinitions.map((definition) => {
  const existing = existingById.get(definition.id)
  const derived = derivedById.get(definition.id)
  if (!existing && !derived) throw new Error(`Curated player ${definition.displayName} was not found`)
  if (!derived?.hardcoreEligible) return null
  const player = existing ?? derived
  return {
    ...player,
    careerAverages: derived.careerAverages,
    normalPool: definition.normalPool && derived.hardcoreEligible,
    hardcoreEligible: derived.hardcoreEligible,
  }
}).filter(Boolean)
const curatedIds = new Set(curatedPlayers.map((player) => player.id))
const discoveredPlayers = hardcoreCandidates
  .filter((player) => !curatedIds.has(player.id))
  .filter((player) => !ambiguousNames.has(normalizeName(player.displayName)))
  .sort(
    (left, right) =>
      Number(right.normalPool) - Number(left.normalPool) ||
      left.displayName.localeCompare(right.displayName),
  )
const players = [...curatedPlayers, ...discoveredPlayers]

const normalCount = players.filter((player) => player.normalPool).length
if (normalCount < 200) throw new Error(`Normal pool has only ${normalCount} players; expected at least 200`)
if (players.length < 400) throw new Error(`Hardcore pool has only ${players.length} players; expected at least 400`)

await writeFile(outputPath, `${JSON.stringify(players, null, 2)}\n`)
process.stdout.write(
  `Wrote ${players.length} Hardcore-eligible records (${normalCount} Normal). Excluded ${ambiguousNames.size} indistinguishable duplicate full names.\n`,
)
