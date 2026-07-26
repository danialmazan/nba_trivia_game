import type { Decade, GameMode, Pool } from './types'

export const GAME_CONFIG = {
  cluesPerRound: 5,
  challengeRounds: 10,
  clueBaseScores: [100, 80, 60, 40, 20] as const,
  incorrectGuessPenalty: 10,
  eraCutoffSeasonEndYear: 1980,
  hardcoreMinimumGames: 200,
  hardcoreMinimumCareerAverageSum: 15,
} as const

export const POOL_RULES: Record<Pool, string> = {
  normal: 'Curated recognisable players for knowledgeable NBA followers.',
  hardcore:
    'Players with 200+ NBA games and at least 15.0 combined career points, rebounds, and assists per game.',
}

export const MODE_LABELS: Record<GameMode, string> = {
  challenge: 'Ten-round challenge',
  endless: 'Endless mode',
  practice: 'Practice by decade',
}

export const POOL_LABELS: Record<Pool, string> = {
  normal: 'Normal',
  hardcore: 'Hardcore',
}

export const DECADES: Decade[] = ['1980s', '1990s', '2000s', '2010s', '2020s']
