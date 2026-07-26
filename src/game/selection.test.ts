import { describe, expect, it } from 'vitest'
import { players } from '../data/players'
import type { Player } from '../data/types'
import { assignDecade, selectNextPlayer } from './selection'

describe('player selection', () => {
  it('assigns the decade from the season with the most appearances', () => {
    const player = {
      ...players[0],
      seasonAppearances: [
        { season: '1999-00', games: 70 },
        { season: '2000-01', games: 82 },
        { season: '2001-02', games: 75 },
      ],
    } as Player
    expect(assignDecade(player)).toBe('2000s')
  })

  it('prevents repeats while unused players remain', () => {
    const pool = players.slice(0, 3)
    const selected = selectNextPlayer(pool, [pool[0].id], () => 0)
    expect(selected.player.id).toBe(pool[1].id)
    expect(selected.exhausted).toBe(false)
  })

  it('resets selection only after the pool is exhausted', () => {
    const pool = players.slice(0, 2)
    const selected = selectNextPlayer(pool, pool.map((player) => player.id), () => 0)
    expect(selected.player.id).toBe(pool[0].id)
    expect(selected.exhausted).toBe(true)
  })
})
