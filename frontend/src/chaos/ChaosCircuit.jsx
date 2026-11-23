
import { useEffect, useRef, useState } from 'react'
import { GameEngine } from './gameEngine'
import { MISSIONS, VEHICLES } from './missions'
import './ChaosCircuit.css'

const getSavedProgress = () => {
  try {
    return JSON.parse(localStorage.getItem('chaos-circuit-progress')) || {
      credits: 500,
      completed: [],
      selectedVehicle: 'starter',
      bestScore: 0,
    }
  } catch {
    return {
      credits: 500,
      completed: [],
      selectedVehicle: 'starter',
      bestScore: 0,
    }
  }
}

export default function ChaosCircuit({ onBack }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const timerRef = useRef(null)

  const [progress, setProgress] = useState(getSavedProgress)
  const [screen, setScreen] = useState('hub')
  const [mission, setMission] = useState(null)
  const [gameStats, setGameStats] = useState({
    score: 0,
    health: 100,
    nitro: 100,
    time: 90,
  })
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem('chaos-circuit-progress', JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      clearInterval(timerRef.current)
    }
  }, [])

  const isUnlocked = (missionId) => {
    if (missionId === 1) return true
    return progress.completed.includes(missionId - 1)
  }

  const startMission = (selectedMission) => {
    setMission(selectedMission)
    setResult(null)
    setGameStats({
      score: 0,
      health: 100,
      nitro: 100,
      time: selectedMission.timeLimit,
    })
    setScreen('game')
  }

  useEffect(() => {
    if (screen !== 'game' || !mission || !canvasRef.current) return

    const engine = new GameEngine(
      canvasRef.current,
      (stats) => setGameStats((previous) => ({ ...previous, ...stats })),
      (status, score) => {
        clearInterval(timerRef.current)
        setResult({ status, score })
        setScreen('result')

        if (status === 'completed') {
          setProgress((previous) => {
            const alreadyCompleted = previous.completed.includes(mission.id)
            return {
              ...previous,
              credits: previous.credits + (alreadyCompleted ? 100 : mission.reward),
              completed: alreadyCompleted
                ? previous.completed
                : [...previous.completed, mission.id],
              bestScore: Math.max(previous.bestScore, score),
            }
          })
        } else {
          setProgress((previous) => ({
            ...previous,
            bestScore: Math.max(previous.bestScore, score),
          }))
        }
      },
    )

    engineRef.current = engine
    engine.start()

    timerRef.current = window.setInterval(() => {
      setGameStats((previous) => {
        if (previous.time <= 1) {
          clearInterval(timerRef.current)
          engine.finish('completed')
          return { ...previous, time: 0 }
        }
        return { ...previous, time: previous.time - 1 }
      })
    }, 1000)

    return () => {
      engine.stop()
      clearInterval(timerRef.current)
      engineRef.current = null
    }
  }, [screen, mission])

  const buyVehicle = (vehicle) => {
    if (vehicle.id === 'starter' || progress.unlockedVehicles?.includes(vehicle.id)) {
      setProgress((previous) => ({ ...previous, selectedVehicle: vehicle.id }))
      setNotice(`${vehicle.name} selected!`)
      return
    }

    if (progress.credits < vehicle.price) {
      setNotice('Not enough credits. Complete missions to earn more!')
      return
    }

    setProgress((previous) => ({
      ...previous,
      credits: previous.credits - vehicle.price,
      selectedVehicle: vehicle.id,
      unlockedVehicles: [...(previous.unlockedVehicles || []), vehicle.id],
    }))
    setNotice(`${vehicle.name} unlocked!`)
  }

  const isVehicleUnlocked = (vehicle) =>
    vehicle.id === 'starter' ||
    (progress.unlockedVehicles || []).includes(vehicle.id)

  const backToHub = () => {
    engineRef.current?.stop()
    clearInterval(timerRef.current)
    setScreen('hub')
    setMission(null)
    setResult(null)
  }

  return (
    <div className="chaos-app">
      <header className="chaos-topbar">
        <button className="chaos-brand" onClick={backToHub}>
          <span className="chaos-brand-icon">⚡</span>
          <span>CHAOS <b>CIRCUIT</b></span>
        </button>

        <div className="chaos-top-actions">
          <span className="chaos-wallet">🪙 {progress.credits.toLocaleString()}</span>
          <button className="chaos-back-button" onClick={onBack}>
            ← GAMEVERSE
          </button>
        </div>
      </header>

      {screen === 'hub' && (
        <main className="chaos-hub">
          <section className="chaos-hero">
            <div className="chaos-hero-content">
              <span className="chaos-kicker">GAMEVERSE ORIGINAL • ACTION DRIVING</span>
              <h1>ENTER THE <span>CHAOS.</span></h1>
              <p>
                Drive through danger. Race your rivals. Survive the circuit.
                Your city. Your rules. Your story.
              </p>
              <button
                className="chaos-primary-button"
                onClick={() => startMission(MISSIONS.find((item) => isUnlocked(item.id)))}
              >
                ▶ PLAY NOW
              </button>
              <div className="chaos-hero-stats">
                <div><strong>{progress.completed.length}/5</strong><span>MISSIONS</span></div>
                <div><strong>{progress.bestScore}</strong><span>BEST SCORE</span></div>
                <div><strong>{progress.credits}</strong><span>CREDITS</span></div>
              </div>
            </div>
            <div className="chaos-hero-art">
              <div className="chaos-art-glow"></div>
              <div className="chaos-art-car">🏎️</div>
              <span className="chaos-art-label">01 / DRIVE</span>
              <span className="chaos-art-label second">02 / SURVIVE</span>
            </div>
          </section>

          <section className="chaos-section">
            <div className="chaos-section-heading">
              <div>
                <span className="chaos-kicker">YOUR CAMPAIGN</span>
                <h2>STORY MISSIONS</h2>
              </div>
              <span className="chaos-progress-label">
                {progress.completed.length} OF 5 COMPLETED
              </span>
            </div>

            <div className="chaos-mission-grid">
              {MISSIONS.map((item, index) => {
                const unlocked = isUnlocked(item.id)
                const completed = progress.completed.includes(item.id)

                return (
                  <article
                    className={`chaos-mission-card ${unlocked ? '' : 'locked'} ${completed ? 'completed' : ''}`}
                    key={item.id}
                  >
                    <div className="chaos-mission-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="chaos-mission-tag">{item.type}</div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="chaos-mission-meta">
                      <span>⚡ {item.difficulty}</span>
                      <span>🪙 {item.reward}</span>
                    </div>
                    <button
                      className="chaos-mission-button"
                      disabled={!unlocked}
                      onClick={() => startMission(item)}
                    >
                      {completed ? 'PLAY AGAIN ↗' : unlocked ? 'START MISSION ↗' : '🔒 LOCKED'}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="chaos-section garage-section">
            <div className="chaos-section-heading">
              <div>
                <span className="chaos-kicker">BUILD YOUR MACHINE</span>
                <h2>THE GARAGE</h2>
              </div>
              <span className="chaos-progress-label">CHOOSE YOUR RIDE</span>
            </div>

            <div className="chaos-vehicle-grid">
              {VEHICLES.map((vehicle) => {
                const unlocked = isVehicleUnlocked(vehicle)
                const selected = progress.selectedVehicle === vehicle.id

                return (
                  <article className={`chaos-vehicle-card ${selected ? 'selected' : ''}`} key={vehicle.id}>
                    <div className="chaos-vehicle-emoji">{vehicle.emoji}</div>
                    <h3>{vehicle.name}</h3>
                    <span className="chaos-vehicle-type">{vehicle.type.toUpperCase()}</span>
                    <div className="chaos-stat">
                      <span>Speed</span><div><i style={{ width: `${vehicle.speed}%` }} /></div><b>{vehicle.speed}</b>
                    </div>
                    <div className="chaos-stat">
                      <span>Armor</span><div><i style={{ width: `${vehicle.armor}%` }} /></div><b>{vehicle.armor}</b>
                    </div>
                    <div className="chaos-stat">
                      <span>Handling</span><div><i style={{ width: `${vehicle.handling}%` }} /></div><b>{vehicle.handling}</b>
                    </div>
                    <button
                      className="chaos-mission-button"
                      onClick={() => buyVehicle(vehicle)}
                    >
                      {selected ? '✓ SELECTED' : unlocked ? 'SELECT VEHICLE' : `UNLOCK · ${vehicle.price} 🪙`}
                    </button>
                  </article>
                )
              })}
            </div>
            {notice && (
              <p className="chaos-notice" role="status">
                {notice}
                <button onClick={() => setNotice('')}>×</button>
              </p>
            )}
          </section>

          <section className="chaos-controls-info">
            <div><span>⌨️</span><b>WASD / ARROWS</b><small>Move your vehicle</small></div>
            <div><span>⚡</span><b>SHIFT / SPACE</b><small>Use nitro boost</small></div>
            <div><span>🪙</span><b>COLLECT COINS</b><small>Earn extra score</small></div>
          </section>
        </main>
      )}

      {screen === 'game' && mission && (
        <main className="chaos-game-screen">
          <div className="chaos-game-heading">
            <div>
              <span className="chaos-kicker">MISSION {String(mission.id).padStart(2, '0')}</span>
              <h2>{mission.title}</h2>
            </div>
            <button className="chaos-back-button" onClick={backToHub}>EXIT MISSION ×</button>
          </div>

          <div className="chaos-hud">
            <div><small>SCORE</small><strong>{gameStats.score}</strong></div>
            <div><small>TIME LEFT</small><strong>{gameStats.time}s</strong></div>
            <div><small>VEHICLE HEALTH</small><strong>{gameStats.health}%</strong></div>
            <div><small>NITRO</small><strong>{gameStats.nitro}%</strong></div>
          </div>

          <div className="chaos-canvas-wrap">
            <canvas
              ref={canvasRef}
              width="900"
              height="600"
              aria-label="Chaos Circuit driving game"
            />
          </div>
          <p className="chaos-game-tip">
            Use WASD or arrow keys to drive. Avoid rival cars and obstacles.
            Collect coins. Use Shift or Space for nitro.
          </p>
        </main>
      )}

      {screen === 'result' && (
        <main className="chaos-result-screen">
          <div className="chaos-result-panel">
            <div className="chaos-result-icon">
              {result?.status === 'completed' ? '🏆' : '💥'}
            </div>
            <span className="chaos-kicker">MISSION {result?.status === 'completed' ? 'COMPLETED' : 'FAILED'}</span>
            <h1>{result?.status === 'completed' ? 'CIRCUIT CLEARED!' : 'VEHICLE DOWN!'}</h1>
            <p>{mission?.title}</p>
            <div className="chaos-result-score">
              <span>FINAL SCORE</span>
              <strong>{result?.score || 0}</strong>
            </div>
            {result?.status === 'completed' && (
              <p className="chaos-reward-text">🪙 +{mission?.reward} CREDITS EARNED</p>
            )}
            <button className="chaos-primary-button" onClick={backToHub}>
              RETURN TO GARAGE →
            </button>
          </div>
        </main>
      )}

      <footer className="chaos-footer">
        GAMEVERSE ORIGINAL • CHAOS CIRCUIT <span>DRIVE. FIGHT. SURVIVE.</span>
      </footer>
    </div>
  )
}
