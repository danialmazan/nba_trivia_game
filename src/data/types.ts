export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type AchievementCount = number | null

export type Season = `${number}-${string}`

export interface TeamStint {
  teamId: string
  franchiseId: string
  teamName: string
  abbreviation: string
  games: number
  minutes: number
  logoPath: string
}

export interface SeasonAppearance {
  season: Season
  games: number
}

export interface StatisticalTitles {
  scoring: AchievementCount
  assists: AchievementCount
  rebounds: AchievementCount
  steals: AchievementCount
  blocks: AchievementCount
}

export interface MajorSeasonIndicators {
  regularSeasonGames: number
  hasAllStarSelection: boolean
  hasAllLeagueSelection: boolean
  hasMajorAward: boolean
  hasTwentyPointSeason: boolean
  historicallyNotable: boolean
}

export interface CareerAverages {
  points: number
  rebounds: number
  assists: number
}

export interface PlayerAchievements {
  championships: AchievementCount
  mvpAwards: AchievementCount
  finalsMvpAwards: AchievementCount
  allStarSelections: AchievementCount
  allNbaSelections: AchievementCount
  allDefensiveSelections: AchievementCount
  defensivePlayerOfYearAwards: AchievementCount
  rookieOfYearAwards: AchievementCount
  sixthManAwards: AchievementCount
  mostImprovedAwards: AchievementCount
  statisticalTitles: StatisticalTitles
}

export interface Player {
  id: string
  displayName: string
  acceptedNames: string[]
  firstName: string
  lastName: string
  initials: string
  active: boolean
  debutSeason: Season
  finalSeason: Season | null
  primaryPosition: Position
  secondaryPositions: Position[]
  basketballNationality: string
  birthCountry: string
  teams: TeamStint[]
  seasonAppearances: SeasonAppearance[]
  careerAverages: CareerAverages
  achievements: PlayerAchievements
  hallOfFame: boolean
  majorSeasonIndicators: MajorSeasonIndicators
  normalPool: boolean
  hardcoreEligible: boolean
  sources: string[]
  provenanceNote: string
  lastVerified: string
}
