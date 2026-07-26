import { describe, expect, it } from 'vitest'
import { players } from '../data/players'
import type { Player } from '../data/types'
import { generateClues, getCareerDecades, getMainTeams, getTeamClue, getTeamClueCandidates } from './clues'

describe('clue generation', () => {
  it('orders main teams by games played', () => {
    const lebron = players.find((player) => player.id === 'lebron-james')!
    expect(getMainTeams(lebron).map((team) => team.teamName)).toEqual([
      'Cleveland Cavaliers',
      'Los Angeles Lakers',
    ])
  })

  it('uses minutes as the tie-breaker', () => {
    const base = players[0]
    const tiedPlayer = {
      ...base,
      teams: [
        { ...base.teams[0], teamId: 'a', teamName: 'Team A', games: 80, minutes: 1500 },
        { ...base.teams[0], teamId: 'b', teamName: 'Team B', games: 80, minutes: 1900 },
        { ...base.teams[0], teamId: 'c', teamName: 'Team C', games: 60, minutes: 2000 },
      ],
    } as Player
    expect(getMainTeams(tiedPlayer).map((team) => team.teamName)).toEqual(['Team B', 'Team A'])
  })

  it('uses only teams with at least 100 games for the first clue', () => {
    const player = players.find((candidate) => candidate.id === 'lebron-james')!
    expect(getTeamClueCandidates(player).every((team) => team.games >= 100)).toBe(true)
  })

  it('selects one qualifying team deterministically from the random round seed', () => {
    const player = players.find((candidate) => candidate.id === 'lebron-james')!
    const candidates = getTeamClueCandidates(player)
    expect(getTeamClue(player, 0).teamId).toBe(candidates[0].teamId)
    expect(getTeamClue(player, 1).teamId).toBe(candidates[1].teamId)
    const clue = generateClues(player, 1)[0]
    expect(clue.kind).toBe('teams')
    if (clue.kind === 'teams') {
      expect(clue.teams).toHaveLength(1)
      expect(clue.decades).toEqual(['2000s', '2010s', '2020s'])
    }
  })

  it('falls back to the most-played team when no stint reaches 100 games', () => {
    const base = players[0]
    const shortCareer = {
      ...base,
      teams: [
        { ...base.teams[0], teamId: 'a', games: 50, minutes: 900 },
        { ...base.teams[0], teamId: 'b', games: 70, minutes: 1100 },
      ],
    } as Player
    expect(getTeamClueCandidates(shortCareer).map((team) => team.teamId)).toEqual(['b'])
  })

  it('combines team and career decades, then shows career averages before achievements', () => {
    const player = players.find((candidate) => candidate.id === 'lebron-james')!
    const clues = generateClues(player, 0)
    expect(clues[0]).toMatchObject({
      label: 'Team & career era',
      decades: ['2000s', '2010s', '2020s'],
    })
    expect(clues[1]).toMatchObject({
      label: 'Career averages',
      text: `${player.careerAverages.points.toFixed(1)} PTS · ${player.careerAverages.rebounds.toFixed(1)} REB · ${player.careerAverages.assists.toFixed(1)} AST`,
    })
    expect(clues[2]).toMatchObject({ label: 'Main achievements' })
    expect(getCareerDecades(player)).toEqual(['2000s', '2010s', '2020s'])
  })
})
