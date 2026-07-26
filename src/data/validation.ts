import type { Player } from './types'
import { generateClues } from '../game/clues'
import { meetsEraCutoff, meetsHardcoreCriteria, seasonEndYear } from '../game/eligibility'

function achievementValues(player: Player): Array<number | null> {
  const a = player.achievements
  return [
    a.championships,
    a.mvpAwards,
    a.finalsMvpAwards,
    a.allStarSelections,
    a.allNbaSelections,
    a.allDefensiveSelections,
    a.defensivePlayerOfYearAwards,
    a.rookieOfYearAwards,
    a.sixthManAwards,
    a.mostImprovedAwards,
    ...Object.values(a.statisticalTitles),
  ]
}

export function validatePlayers(players: Player[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const player of players) {
    const prefix = `[${player.id || 'missing-id'}]`
    if (ids.has(player.id)) errors.push(`${prefix} duplicate player ID`)
    ids.add(player.id)
    if (!player.acceptedNames?.length) errors.push(`${prefix} needs at least one accepted answer`)
    if (!player.teams?.length) errors.push(`${prefix} needs at least one NBA team`)
    if (player.teams?.some((team) => team.games < 0 || team.minutes < 0)) errors.push(`${prefix} has negative team totals`)
    if (player.finalSeason && seasonEndYear(player.finalSeason) < seasonEndYear(player.debutSeason)) {
      errors.push(`${prefix} final season is before debut season`)
    }
    if (player.active && player.finalSeason) errors.push(`${prefix} active player must not have a final season`)
    if (!player.initials?.trim()) errors.push(`${prefix} initials are required`)
    const averages = player.careerAverages
    if (
      !averages ||
      [averages?.points, averages?.rebounds, averages?.assists].some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      errors.push(`${prefix} needs non-negative career averages`)
    }
    if (player.normalPool && !player.hardcoreEligible) errors.push(`${prefix} Normal player must be Hardcore-eligible`)
    if (player.hardcoreEligible !== meetsHardcoreCriteria(player)) {
      errors.push(`${prefix} Hardcore flag does not match configured games-and-averages rules`)
    }
    if (!meetsEraCutoff(player)) errors.push(`${prefix} does not satisfy the 1979-80 era cutoff`)
    if (achievementValues(player).some((value) => typeof value === 'number' && value < 0)) {
      errors.push(`${prefix} has a negative achievement count`)
    }
    if (!player.sources?.length && !player.provenanceNote?.trim()) errors.push(`${prefix} needs a source or provenance note`)
    try {
      if (generateClues(player).length !== 5) errors.push(`${prefix} did not generate five clues`)
    } catch (error) {
      errors.push(`${prefix} clue generation failed: ${(error as Error).message}`)
    }
  }
  return errors
}
