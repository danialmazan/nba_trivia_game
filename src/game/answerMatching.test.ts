import { describe, expect, it } from 'vitest'
import { players } from '../data/players'
import { matchAnswer, normalizeAnswer } from './answerMatching'

const byId = (id: string) => players.find((player) => player.id === id)!

describe('answer matching', () => {
  it('normalizes accents, punctuation, hyphens, case and repeated spaces', () => {
    expect(normalizeAnswer("  MANU   Ginóbili. ")).toBe('manu ginobili')
    expect(normalizeAnswer('Gilgeous-Alexander')).toBe('gilgeous alexander')
    expect(normalizeAnswer("O'Neal")).toBe('o neal')
  })

  it('accepts a name with its apostrophe omitted', () => {
    expect(matchAnswer('Shaquille ONeal', byId('shaquille-oneal'), players).status).toBe('correct')
  })

  it('accepts accent-insensitive names and unique surnames', () => {
    expect(matchAnswer('Doncic', byId('luka-doncic'), players).status).toBe('correct')
    expect(matchAnswer('Ginobili', byId('manu-ginobili'), players).status).toBe('correct')
  })

  it('accepts configured common short names', () => {
    expect(matchAnswer('SGA', byId('shai-gilgeous-alexander'), players).status).toBe('correct')
    expect(matchAnswer('Kareem', byId('kareem-abdul-jabbar'), players).status).toBe('correct')
  })

  it('does not auto-accept an ambiguous surname', () => {
    const result = matchAnswer('Johnson', byId('magic-johnson'), players)
    expect(result.status).toBe('ambiguous')
    if (result.status === 'ambiguous') {
      expect(result.candidates.length).toBeGreaterThan(1)
      expect(result.candidates.map((player) => player.id)).toContain('magic-johnson')
    }
  })

  it('accepts a sufficiently clear minor typo', () => {
    expect(matchAnswer('Leborn James', byId('lebron-james'), players).status).toBe('correct')
  })

  it('rejects lists of player names', () => {
    const result = matchAnswer('Kobe Bryant or Michael Jordan', byId('kobe-bryant'), players)
    expect(result.status).toBe('invalid')
  })
})
