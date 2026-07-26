import type { Player, TeamStint } from '../data/types'

export interface TeamClueData {
  kind: 'teams'
  label: string
  teams: TeamStint[]
  decades: string[]
}

export interface TextClueData {
  kind: 'text'
  label: string
  text: string
}

export type Clue = TeamClueData | TextClueData

export function getMainTeams(player: Player): TeamStint[] {
  return [...player.teams]
    .sort((a, b) => b.games - a.games || b.minutes - a.minutes || a.teamName.localeCompare(b.teamName))
    .slice(0, Math.min(2, player.teams.length))
}

export function getTeamClueCandidates(player: Player): TeamStint[] {
  const qualifying = player.teams.filter((team) => team.games >= 100)
  return qualifying.length ? qualifying : getMainTeams(player).slice(0, 1)
}

export function getTeamClue(player: Player, clueSeed = 0): TeamStint {
  const candidates = getTeamClueCandidates(player)
  return candidates[Math.abs(Math.trunc(clueSeed)) % candidates.length]
}

export function getCareerDecades(player: Player): string[] {
  return [...new Set(
    player.seasonAppearances.map(({ season }) => `${Math.floor(Number(season.slice(0, 4)) / 10) * 10}s`),
  )].sort()
}

function pluralised(count: number | null, singular: string, plural = `${singular}s`): string {
  if (count === null) return ''
  return `${count}× ${count === 1 ? singular : plural}`
}

export function getAchievementHighlights(player: Player): string[] {
  const a = player.achievements
  const titles = a.statisticalTitles
  const weighted: Array<[number, string, number | null]> = [
    [100, pluralised(a.mvpAwards, 'MVP'), a.mvpAwards],
    [95, pluralised(a.finalsMvpAwards, 'Finals MVP'), a.finalsMvpAwards],
    [90, pluralised(a.championships, 'NBA champion'), a.championships],
    [85, pluralised(a.defensivePlayerOfYearAwards, 'Defensive Player of the Year'), a.defensivePlayerOfYearAwards],
    [80, pluralised(a.allNbaSelections, 'All-NBA selection'), a.allNbaSelections],
    [75, pluralised(a.allStarSelections, 'All-Star'), a.allStarSelections],
    [70, pluralised(a.allDefensiveSelections, 'All-Defensive selection'), a.allDefensiveSelections],
    [65, pluralised(titles.scoring, 'scoring title'), titles.scoring],
    [64, pluralised(titles.assists, 'assist title'), titles.assists],
    [63, pluralised(titles.rebounds, 'rebound title'), titles.rebounds],
    [62, pluralised(titles.steals, 'steal title'), titles.steals],
    [61, pluralised(titles.blocks, 'block title'), titles.blocks],
    [60, pluralised(a.rookieOfYearAwards, 'Rookie of the Year'), a.rookieOfYearAwards],
    [55, pluralised(a.sixthManAwards, 'Sixth Man of the Year'), a.sixthManAwards],
    [54, pluralised(a.mostImprovedAwards, 'Most Improved Player'), a.mostImprovedAwards],
  ]

  const highlights = weighted
    .filter(([, , count]) => typeof count === 'number' && count > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map(([, label]) => label)

  if (highlights.length < 2 && player.hallOfFame) highlights.push('Naismith Hall of Fame')
  if (highlights.length < 2) {
    highlights.push(`${player.majorSeasonIndicators.regularSeasonGames.toLocaleString('en-US')} regular-season games`)
  }
  return highlights.slice(0, 3)
}

export function generateClues(player: Player, clueSeed = 0): Clue[] {
  const position = [player.primaryPosition, ...player.secondaryPositions].join(' / ')

  return [
    {
      kind: 'teams',
      label: 'Team & career era',
      teams: [getTeamClue(player, clueSeed)],
      decades: getCareerDecades(player),
    },
    {
      kind: 'text',
      label: 'Career averages',
      text: `${player.careerAverages.points.toFixed(1)} PTS · ${player.careerAverages.rebounds.toFixed(1)} REB · ${player.careerAverages.assists.toFixed(1)} AST`,
    },
    { kind: 'text', label: 'Main achievements', text: getAchievementHighlights(player).join(' · ') },
    { kind: 'text', label: 'Position', text: `Position: ${position}` },
    { kind: 'text', label: 'Initials', text: `Initials: ${player.initials}` },
  ]
}

export function getCareerSummary(player: Player): string {
  const team = getMainTeams(player)[0]
  const position = [player.primaryPosition, ...player.secondaryPositions].join('/')
  const keyAchievement = getAchievementHighlights(player)[0].toLowerCase()
  return `${position} · ${player.majorSeasonIndicators.regularSeasonGames.toLocaleString('en-US')} NBA games · Most appearances for the ${team.teamName} · ${keyAchievement}.`
}
