import type { Player } from '../data/types'
import { GAME_CONFIG } from './config'
import type { Pool } from './types'

export function seasonEndYear(season: string): number {
  const [start, shortEnd] = season.split('-')
  const startYear = Number(start)
  if (!shortEnd || Number.isNaN(startYear)) return Number.NaN
  const century = Math.floor(startYear / 100) * 100
  let endYear = century + Number(shortEnd)
  if (endYear < startYear) endYear += 100
  return endYear
}

export function meetsEraCutoff(player: Player): boolean {
  const lastSeason = player.finalSeason ?? player.debutSeason
  return player.active || seasonEndYear(lastSeason) >= GAME_CONFIG.eraCutoffSeasonEndYear
}

export function meetsHardcoreCriteria(player: Player): boolean {
  const combinedCareerAverage =
    player.careerAverages.points + player.careerAverages.rebounds + player.careerAverages.assists
  return (
    player.majorSeasonIndicators.regularSeasonGames >= GAME_CONFIG.hardcoreMinimumGames &&
    combinedCareerAverage >= GAME_CONFIG.hardcoreMinimumCareerAverageSum
  )
}

export function isInPool(player: Player, pool: Pool): boolean {
  if (!meetsEraCutoff(player)) return false
  return pool === 'normal' ? player.normalPool : player.hardcoreEligible && meetsHardcoreCriteria(player)
}
