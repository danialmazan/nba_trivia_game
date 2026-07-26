import { useEffect, useRef, useState } from 'react'
import type { Player } from '../data/types'
import { GAME_CONFIG, MODE_LABELS, POOL_LABELS } from '../game/config'
import { generateClues, getCareerSummary } from '../game/clues'
import { calculateAvailableScore } from '../game/scoring'
import type { GameState } from '../game/types'
import { ClueCard } from './ClueCard'

interface GameScreenProps {
  game: GameState
  player: Player
  onSubmit: (guess: string) => void
  onReveal: () => void
  onGiveUp: () => void
  onNext: () => void
  onExit: () => void
}

export function GameScreen({ game, player, onSubmit, onReveal, onGiveUp, onNext, onExit }: GameScreenProps) {
  const [guess, setGuess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isReview = game.phase === 'review'
  const clues = generateClues(player, game.round.clueSeed)
  const visibleClues = clues.slice(0, isReview ? GAME_CONFIG.cluesPerRound : game.round.clueLevel)
  const availableScore = calculateAvailableScore(game.round.clueLevel, game.round.incorrectGuesses.length)
  const roundNumber = game.results.length + (isReview ? 0 : 1)

  useEffect(() => {
    if (!isReview) inputRef.current?.focus()
  }, [game.round.clueLevel, game.round.incorrectGuesses.length, game.round.playerId, isReview])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit(guess)
    setGuess('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const solved = game.results.filter((result) => result.outcome === 'correct').length
  const averageEndless = game.results.length ? Math.round(game.totalScore / game.results.length) : 0

  return (
    <main className="game-shell">
      <header className="game-header">
        <button className="wordmark" type="button" onClick={onExit} aria-label="Leave game">
          FULL<span>COURT</span>
        </button>
        <div className="game-header__meta">
          <span>{MODE_LABELS[game.settings.mode]}</span>
          <i aria-hidden="true" />
          <span>{POOL_LABELS[game.settings.pool]} pool</span>
          {game.settings.mode === 'practice' && <span>· {game.settings.decade}</span>}
        </div>
        <button className="exit-button" type="button" onClick={onExit}>
          Exit
        </button>
      </header>

      <section className="game-scorebar" aria-label="Game status">
        <div>
          <span>{game.settings.mode === 'challenge' ? 'Progress' : game.settings.mode === 'endless' ? 'Players seen' : 'Practice rep'}</span>
          <strong>
            {game.settings.mode === 'challenge'
              ? `${Math.max(1, roundNumber)} / ${GAME_CONFIG.challengeRounds}`
              : String(Math.max(1, roundNumber)).padStart(2, '0')}
          </strong>
        </div>
        <div className="game-scorebar__available">
          <span>{isReview ? 'Round score' : 'Available now'}</span>
          <strong data-testid="available-score">{isReview ? game.round.pointsEarned : availableScore}</strong>
          <em>PTS</em>
        </div>
        <div>
          <span>{game.settings.mode === 'practice' ? 'Players solved' : 'Game score'}</span>
          <strong data-testid="total-score">{game.settings.mode === 'practice' ? solved : game.totalScore}</strong>
        </div>
        {game.settings.mode === 'endless' && (
          <div className="scorebar-optional">
            <span>Avg / player</span>
            <strong>{averageEndless}</strong>
          </div>
        )}
      </section>

      {game.poolResetMessage && <div className="pool-reset" role="status">{game.poolResetMessage}</div>}

      <div className="game-layout">
        <section className="clue-zone" aria-labelledby="clue-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Scouting report</span>
              <h1 id="clue-heading">Who is this player?</h1>
            </div>
            <span className="difficulty-pip">Clue {game.round.clueLevel} / 5</span>
          </div>

          <div className="clue-stack">
            {visibleClues.map((clue, index) => (
              <ClueCard
                clue={clue}
                index={index + 1}
                key={`${game.round.playerId}-${index}`}
                newlyRevealed={!isReview && index + 1 === game.round.clueLevel}
              />
            ))}
          </div>
        </section>

        <aside className={`answer-zone ${isReview ? 'answer-zone--review' : ''}`}>
          {isReview ? (
            <div className="answer-reveal" data-testid="answer-reveal">
              <span className="eyebrow">{game.round.outcome === 'correct' ? 'Bucket.' : 'Answer revealed'}</span>
              <h2>{player.displayName}</h2>
              <div className="earned-stamp">
                <strong>{game.round.pointsEarned}</strong>
                <span>points earned</span>
              </div>
              <p>{getCareerSummary(player)}</p>
              {game.round.incorrectGuesses.length > 0 && (
                <div className="review-guesses">
                  <span>Missed guesses</span>
                  <p>{game.round.incorrectGuesses.join(' · ')}</p>
                </div>
              )}
              <button className="primary-button primary-button--large" type="button" onClick={onNext}>
                {game.settings.mode === 'challenge' && game.results.length >= GAME_CONFIG.challengeRounds
                  ? 'See final results'
                  : 'Next player'}{' '}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <>
              <div className="answer-zone__header">
                <span className="eyebrow">Your call</span>
                <span>{GAME_CONFIG.incorrectGuessPenalty} pts per miss</span>
              </div>
              <form onSubmit={handleSubmit}>
                <label htmlFor="player-guess">Enter one player</label>
                <input
                  id="player-guess"
                  ref={inputRef}
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  placeholder="e.g. LeBron James"
                  autoComplete="off"
                  spellCheck="false"
                />
                <button className="primary-button" type="submit">
                  Submit guess
                </button>
              </form>
              <p className="status-message" role="status" aria-live="polite">
                {game.round.statusMessage || 'Full names, unique surnames and common short names work.'}
              </p>
              <div className="round-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={onReveal}
                  disabled={game.round.clueLevel >= GAME_CONFIG.cluesPerRound}
                >
                  Reveal another clue
                  <span>{game.round.clueLevel >= 5 ? 'All shown' : `${GAME_CONFIG.clueBaseScores[game.round.clueLevel]} pts base`}</span>
                </button>
                <button className="give-up-button" type="button" onClick={onGiveUp}>
                  Give up
                </button>
              </div>
              <details className="previous-guesses" open={game.round.incorrectGuesses.length > 0}>
                <summary>
                  Previous guesses <span>{game.round.incorrectGuesses.length}</span>
                </summary>
                {game.round.incorrectGuesses.length ? (
                  <ol>
                    {game.round.incorrectGuesses.map((previousGuess) => (
                      <li key={previousGuess}>{previousGuess}</li>
                    ))}
                  </ol>
                ) : (
                  <p>No misses yet.</p>
                )}
              </details>
            </>
          )}
        </aside>
      </div>
    </main>
  )
}
