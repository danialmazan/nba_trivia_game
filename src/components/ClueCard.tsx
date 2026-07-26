import type { Clue } from '../game/clues'

interface ClueCardProps {
  clue: Clue
  index: number
  newlyRevealed?: boolean
}

export function ClueCard({ clue, index, newlyRevealed = false }: ClueCardProps) {
  return (
    <article className={`clue-card ${newlyRevealed ? 'clue-card--new' : ''}`} aria-label={`Clue ${index}`}>
      <div className="clue-card__number" aria-hidden="true">
        {String(index).padStart(2, '0')}
      </div>
      <div className="clue-card__body">
        <span className="eyebrow">{clue.label}</span>
        {clue.kind === 'teams' ? (
          <div className="team-clue">
            <div className="team-clue__copy">
              <p>
                One NBA team this player represented:{' '}
                <strong>{clue.teams[0].teamName}</strong>
              </p>
              <p className="career-decades">
                NBA career decades: <strong>{clue.decades.join(' · ')}</strong>
              </p>
              <small>
                The decades cover the player&apos;s full NBA career—not necessarily their years with the team shown.
              </small>
            </div>
            <div className="team-logos" aria-label="Team logos">
              {clue.teams.map((team) => (
                <div className="team-logo" key={team.teamId} title={team.teamName}>
                  <img
                    src={`${import.meta.env.BASE_URL}${team.logoPath.replace(/^\/+/, '')}`}
                    alt={`${team.teamName} logo`}
                  />
                  <span>{team.abbreviation}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="clue-copy">{clue.text}</p>
        )}
      </div>
    </article>
  )
}
