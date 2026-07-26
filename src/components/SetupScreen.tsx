import type { Player } from '../data/types'
import { DECADES, MODE_LABELS, POOL_LABELS, POOL_RULES } from '../game/config'
import { assignDecade, getActivePool } from '../game/selection'
import type { GameSettings, SavedData } from '../game/types'

interface SetupScreenProps {
  settings: GameSettings
  savedData: SavedData
  players: Player[]
  onSettingsChange: (settings: GameSettings) => void
  onStart: () => void
  onResume: () => void
}

export function SetupScreen({
  settings,
  savedData,
  players,
  onSettingsChange,
  onStart,
  onResume,
}: SetupScreenProps) {
  const poolCount = getActivePool(players, settings.pool).length
  const practiceCount = players.filter(
    (player) => getActivePool([player], settings.pool).length && assignDecade(player) === settings.decade,
  ).length

  return (
    <main className="setup-shell">
      <section className="hero" aria-labelledby="game-title">
        <div className="hero__kicker">
          <span>NBA knowledge test</span>
          <span className="hero__kicker-line" />
          <span>Season 01</span>
        </div>
        <h1 id="game-title">
          Name that
          <span>hooper.</span>
        </h1>
        <p className="hero__lead">
          Five clues. Hardest first. No gimmicks—just the careers you remember and the details you don’t.
        </p>
        <div className="hero__scoreboard" aria-label="Saved high scores">
          <div>
            <span>Normal best</span>
            <strong>{savedData.highScores.normal.toString().padStart(4, '0')}</strong>
          </div>
          <div>
            <span>Hardcore best</span>
            <strong>{savedData.highScores.hardcore.toString().padStart(4, '0')}</strong>
          </div>
        </div>
      </section>

      <section className="setup-panel" aria-label="Game setup">
        <div className="setup-panel__header">
          <span className="step-marker">01</span>
          <div>
            <span className="eyebrow">Choose your run</span>
            <h2>Game format</h2>
          </div>
        </div>
        <div className="choice-grid choice-grid--modes">
          {(['challenge', 'endless', 'practice'] as const).map((mode) => (
            <button
              type="button"
              className={`choice-card ${settings.mode === mode ? 'choice-card--active' : ''}`}
              aria-pressed={settings.mode === mode}
              key={mode}
              onClick={() => onSettingsChange({ ...settings, mode })}
            >
              <span>{MODE_LABELS[mode]}</span>
              <small>
                {mode === 'challenge'
                  ? '10 players · 1,000 max'
                  : mode === 'endless'
                    ? 'Keep the run alive'
                    : 'Lock in an era'}
              </small>
            </button>
          ))}
        </div>

        {settings.mode === 'practice' && (
          <div className="decade-row" aria-label="Practice decade">
            {DECADES.map((decade) => (
              <button
                type="button"
                key={decade}
                aria-pressed={settings.decade === decade}
                className={settings.decade === decade ? 'active' : ''}
                onClick={() => onSettingsChange({ ...settings, decade })}
              >
                {decade}
              </button>
            ))}
          </div>
        )}

        <div className="setup-panel__header setup-panel__header--pool">
          <span className="step-marker">02</span>
          <div>
            <span className="eyebrow">Set the depth chart</span>
            <h2>Player pool</h2>
          </div>
        </div>
        <div className="pool-toggle">
          {(['normal', 'hardcore'] as const).map((pool) => (
            <button
              type="button"
              key={pool}
              className={settings.pool === pool ? 'active' : ''}
              aria-pressed={settings.pool === pool}
              onClick={() => onSettingsChange({ ...settings, pool })}
            >
              <span>{POOL_LABELS[pool]}</span>
              <small>{POOL_RULES[pool]}</small>
            </button>
          ))}
        </div>

        <div className="setup-actions">
          <div className="roster-count">
            <strong>{settings.mode === 'practice' ? practiceCount : poolCount}</strong>
            <span>players available</span>
          </div>
          <button className="primary-button primary-button--large" type="button" onClick={onStart}>
            Start game <span aria-hidden="true">↗</span>
          </button>
        </div>
        {savedData.unfinishedGame && (
          <button className="resume-button" type="button" onClick={onResume}>
            Continue unfinished {MODE_LABELS[savedData.unfinishedGame.settings.mode].toLowerCase()}
          </button>
        )}
      </section>
    </main>
  )
}
