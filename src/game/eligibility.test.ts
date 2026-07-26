import { describe, expect, it } from 'vitest'
import { players } from '../data/players'
import type { Player } from '../data/types'
import { meetsEraCutoff, meetsHardcoreCriteria } from './eligibility'

describe('pool eligibility', () => {
  it('includes a career whose final NBA season is 1979-80', () => {
    const player = { ...players[0], active: false, debutSeason: '1960-61', finalSeason: '1979-80' } as Player
    expect(meetsEraCutoff(player)).toBe(true)
  })

  it('excludes a career that ended before 1979-80', () => {
    const player = { ...players[0], active: false, debutSeason: '1960-61', finalSeason: '1978-79' } as Player
    expect(meetsEraCutoff(player)).toBe(false)
  })

  it('keeps every Normal player eligible for Hardcore', () => {
    expect(players.filter((player) => player.normalPool).every((player) => player.hardcoreEligible)).toBe(true)
  })

  it('evaluates the configured Hardcore rules independently of UI components', () => {
    expect(players.every((player) => meetsHardcoreCriteria(player))).toBe(true)
  })

  it('requires at least 200 games even when career production clears the threshold', () => {
    const player = {
      ...players[0],
      careerAverages: { points: 20, rebounds: 5, assists: 5 },
      majorSeasonIndicators: { ...players[0].majorSeasonIndicators, regularSeasonGames: 199 },
    }
    expect(meetsHardcoreCriteria(player)).toBe(false)
  })

  it('requires a combined PTS, REB, and AST career average of at least 15', () => {
    const player = {
      ...players[0],
      careerAverages: { points: 8, rebounds: 4, assists: 2.9 },
      majorSeasonIndicators: { ...players[0].majorSeasonIndicators, regularSeasonGames: 500 },
    }
    expect(meetsHardcoreCriteria(player)).toBe(false)
    expect(meetsHardcoreCriteria({
      ...player,
      careerAverages: { points: 8, rebounds: 4, assists: 3 },
    })).toBe(true)
  })
})
