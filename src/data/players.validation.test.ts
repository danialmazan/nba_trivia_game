import { describe, expect, it } from 'vitest'
import { assignDecade } from '../game/selection'
import { players } from './players'
import { validatePlayers } from './validation'

describe('NBA player dataset', () => {
  it('passes every configured validation rule', () => {
    expect(validatePlayers(players)).toEqual([])
  })

  it('contains at least 200 Normal players and a substantially deeper Hardcore pool', () => {
    expect(players.filter((player) => player.normalPool).length).toBeGreaterThanOrEqual(200)
    expect(players.length).toBe(832)
    expect(players.some((player) => !player.normalPool && player.hardcoreEligible)).toBe(true)
  })

  it('covers every practice decade', () => {
    const represented = new Set(players.map(assignDecade))
    for (const decade of ['1980s', '1990s', '2000s', '2010s', '2020s']) {
      expect(represented.has(decade)).toBe(true)
    }
  })
})
