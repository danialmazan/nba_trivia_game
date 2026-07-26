import { describe, expect, it } from 'vitest'
import { createRound, recordIncorrectGuess, revealNextClue } from './round'
import { calculateAvailableScore } from './scoring'

describe('round state', () => {
  it('does not count a normalized duplicate guess twice', () => {
    const initial = createRound('kobe-bryant', () => 0)
    const first = recordIncorrectGuess(initial, 'Kobe-Bryant', 'kobe bryant')
    const duplicate = recordIncorrectGuess(first.round, '  kobe   bryant ', 'kobe bryant')

    expect(first.duplicate).toBe(false)
    expect(duplicate.duplicate).toBe(true)
    expect(duplicate.round.incorrectGuesses).toEqual(['Kobe-Bryant'])
  })

  it('preserves deductions when a clue is revealed', () => {
    const initial = createRound('player', () => 0)
    const wrong = recordIncorrectGuess(initial, 'Someone else', 'someone else').round
    const revealed = revealNextClue(wrong)

    expect(revealed.incorrectGuesses).toHaveLength(1)
    expect(calculateAvailableScore(revealed.clueLevel, revealed.incorrectGuesses.length)).toBe(70)
  })
})
