import type { Player } from '../data/types'
import { isInPool } from './eligibility'
import type { Decade, Pool } from './types'

export function assignDecade(player: Player): string {
  const peakSeason = [...player.seasonAppearances].sort(
    (a, b) => b.games - a.games || a.season.localeCompare(b.season),
  )[0]
  const startYear = Number(peakSeason.season.slice(0, 4))
  return `${Math.floor(startYear / 10) * 10}s`
}

export function getActivePool(players: Player[], pool: Pool, decade?: Decade): Player[] {
  return players.filter((player) => isInPool(player, pool) && (!decade || assignDecade(player) === decade))
}

export interface SelectionResult {
  player: Player
  exhausted: boolean
}

export function selectNextPlayer(
  eligiblePlayers: Player[],
  usedPlayerIds: string[],
  random: () => number = Math.random,
): SelectionResult {
  if (!eligiblePlayers.length) throw new Error('No players are available for this game configuration.')
  const unused = eligiblePlayers.filter((player) => !usedPlayerIds.includes(player.id))
  const candidates = unused.length ? unused : eligiblePlayers
  const index = Math.min(candidates.length - 1, Math.floor(Math.max(0, random()) * candidates.length))
  return { player: candidates[index], exhausted: unused.length === 0 }
}
