
import { useState } from 'react'
import './App.css'

const games = [
  { id: 1, name: 'Free Fire', category: 'Action', type: 'Battle Royale', emoji: '🔥', color: 'fire', description: 'Enter the arena and test your skills.', details: 'Explore an action-packed battle royale experience. Check the official platform for supported access options.', difficulty: 'Advanced', players: 'Multiplayer' },
  { id: 2, name: 'PUBG Battlegrounds', category: 'Action', type: 'Battle Royale', emoji: '🎯', color: 'pubg', description: 'Survive, compete and become the champion.', details: 'Discover competitive battle royale gaming and check the official platform for supported ways to play.', difficulty: 'Advanced', players: 'Multiplayer' },
  { id: 3, name: 'Subway Surfers', category: 'Adventure', type: 'Endless Runner', emoji: '🚆', color: 'subway', description: 'Run through exciting city adventures.', details: 'Discover an endless-running adventure filled with colourful environments, quick reactions and exciting challenges.', difficulty: 'Easy to Medium', players: 'Single Player' },
  { id: 4, name: 'Temple Run', category: 'Adventure', type: 'Endless Runner', emoji: '🏛️', color: 'temple', description: 'Explore ancient paths and escape.', details: 'Explore ancient paths and test your timing, reactions and ability to avoid obstacles.', difficulty: 'Medium', players: 'Single Player' },
  { id: 5, name: 'Angry Birds', category: 'Casual', type: 'Puzzle', emoji: '🐦', color: 'birds', description: 'Aim carefully and solve fun challenges.', details: 'A fun puzzle experience that encourages careful planning, timing and problem-solving.', difficulty: 'Easy to Medium', players: 'Single Player' },
  { id: 6, name: 'Brain Challenge', category: 'Puzzle', type: 'Mind Games', emoji: '🧠', color: 'brain', description: 'Give your brain a little workout.', details: 'A GAMEVERSE game concept for thinking activities, memory tasks and problem-solving challenges.', difficulty: 'All Levels', players: 'Single Player' },
]

const categories = ['All Games', 'Action', 'Adventure', 'Casual', 'Puzzle']

function App() {
  const [activeCategory, setActiveCategory] = useState('All Games')
  const [search, setSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)
  const [page, setPage] = useState('home')
  const [authMode, setAuthMode] = useState('signup')
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')

  const filteredGames = games.filter((game) => {
    const matchesCategory =
      activeCategory === 'All Games' || game.category === activeCategory
    const matchesSearch =
      game.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const openDetails = (game) => {
    setSelectedGame(game)
    setPage('details')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setPage('home')
    setSelectedGame(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startPlaying = () => {
    if (!selectedGame) return

    if (user) {
      setPage('challenge')
    } else {
      setAuthError('')
      setAuthMode('signup')
      setPage('auth')
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAuth = (event) => {
    event.preventDefault()
    setAuthError('')

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const name = String(form.get('name') || '').trim()

    if (!email || !password) {
      setAuthError('Please enter your email and password.')
      return
    }

    if (password.length < 6) {
      setAuthError('Please use a password with at least 6 characters.')
      return
    }

    if (authMode === 'signup' && !name) {
      setAuthError('Please enter your name.')
      return
    }

    // Front-end demo only. Connect a real authentication service later.
    setUser({
      name: authMode === 'signup' ? name : email.split('@')[0],
      email,
    })

    setPage('challenge')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const signOut = () => {
    setUser(null)
    setPage('home')
    setSelectedGame(null)
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <header className="navbar">
        <button className="brand brand-button" onClick={goHome}>
          <span className="brand-icon">G</span>
          <span>GAME<span className="brand-accent">VERSE</span></span>
        </button>

        <nav className="nav-links">
          <button className={page === 'home' ? 'nav-active' : ''} onClick={goHome}>Home</button>
          <button onClick={goHome}>Explore Games</button>
          <a href="#how-it-works" onClick={goHome}>How it works</a>
        </nav>

        <div className="nav-right">
          {user ? (
            <>
              <span className="user-greeting">Hi, {user.name}</span>
              <button className="nav-button" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <button
              className="nav-button"
              onClick={() => {
                setAuthMode('signup')
                setPage('auth')
                setSelectedGame(null)
              }}
            >
              Sign in <span>↗</span>
            </button>
          )}
        </div>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="hero-section" id="home">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="live-dot"></span>
                  YOUR NEXT GAMING DESTINATION
                </div>
                <h1>ONE WORLD.<br /><span className="gradient-text">ENDLESS GAMES.</span></h1>
                <p className="hero-description">
                  Discover a new way to access your favourite games.
                  One website. Many games. Less installing.
                </p>
                <div className="hero-actions">
                  <a href="#games" className="primary-button">Explore Games <span>→</span></a>
                  <a href="#how-it-works" className="secondary-button">Discover More</a>
                </div>
                <div className="hero-note"><span>✦</span> Explore first. Play when you're ready.</div>
              </div>

              <div className="hero-visual">
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>
                <div className="hero-glow"></div>
                <div className="hero-controller">🎮</div>
                <div className="floating-card floating-card-top">
                  <span>⚡</span>
                  <div><strong>One platform</strong><small>Many experiences</small></div>
                </div>
                <div className="floating-card floating-card-bottom">
                  <span>🌌</span>
                  <div><strong>Enter GAMEVERSE</strong><small>Your world of games</small></div>
                </div>
                <span className="spark spark-one">✦</span>
                <span className="spark spark-two">✧</span>
                <span className="spark spark-three">✦</span>
              </div>
            </section>

            <section className="feature-strip">
              <div><span>🌐</span><div><strong>One destination</strong><small>A unified gaming portal</small></div></div>
              <div><span>🎮</span><div><strong>Multiple games</strong><small>Explore different worlds</small></div></div>
              <div><span>✨</span><div><strong>Explore freely</strong><small>No account needed to browse</small></div></div>
            </section>

            <section className="games-section" id="games">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">FIND YOUR NEXT ADVENTURE</div>
                  <h2>Explore the <span className="gradient-text">Universe</span></h2>
                  <p>Choose a world. Discover a game. Let the fun begin.</p>
                </div>
                <div className="game-count">{filteredGames.length} GAMES SHOWN</div>
              </div>

              <div className="game-controls">
                <div className="category-list">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`category-button ${activeCategory === category ? 'selected' : ''}`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    type="search"
                    placeholder="Search games..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>

              <div className="games-grid">
                {filteredGames.map((game) => (
                  <article className={`game-card ${game.color}`} key={game.id}>
                    <div className="game-art">
                      <span className="game-art-glow"></span>
                      <span className="game-emoji">{game.emoji}</span>
                      <span className="game-type">{game.type}</span>
                    </div>
                    <div className="game-info">
                      <div>
                        <h3>{game.name}</h3>
                        <p>{game.description}</p>
                      </div>
                      <button className="play-button" onClick={() => openDetails(game)}>
                        View <span>↗</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {filteredGames.length === 0 && (
                <div className="empty-state">
                  <span>🔎</span>
                  <h3>No games found</h3>
                  <p>Try another game name or category.</p>
                  <button onClick={() => { setSearch(''); setActiveCategory('All Games') }}>Clear filters</button>
                </div>
              )}
            </section>

            <section className="how-section" id="how-it-works">
              <div className="section-kicker">SIMPLE BY DESIGN</div>
              <h2>Your gaming journey, <span className="gradient-text">simplified.</span></h2>
              <div className="steps-grid">
                <div className="step-card"><span>01</span><div className="step-icon">🔎</div><h3>Explore freely</h3><p>Discover games without creating an account.</p></div>
                <div className="step-card"><span>02</span><div className="step-icon">👤</div><h3>Sign in to play</h3><p>Create your profile when you're ready to play.</p></div>
                <div className="step-card"><span>03</span><div className="step-icon">🧩</div><h3>Take the challenge</h3><p>Complete a GAMEVERSE challenge before game access.</p></div>
              </div>
            </section>
          </>
        )}

        {page === 'details' && selectedGame && (
          <section className="inner-page">
            <button className="back-button" onClick={goHome}>← Back to all games</button>
            <div className={`detail-banner ${selectedGame.color}`}>
              <span className="detail-emoji">{selectedGame.emoji}</span>
              <div>
                <span className="section-kicker">GAMEVERSE GAME PROFILE</span>
                <h1>{selectedGame.name}</h1>
                <p>{selectedGame.type} · {selectedGame.category}</p>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-main">
                <div className="panel">
                  <div className="section-kicker">ABOUT THIS GAME</div>
                  <h2>Enter a new experience.</h2>
                  <p>{selectedGame.details}</p>
                </div>
                <div className="panel">
                  <div className="section-kicker">BEFORE YOU PLAY</div>
                  <h2>Your journey starts here.</h2>
                  <p>GAMEVERSE adds a short challenge before supported game experiences. Sign in when you choose to play, then complete the challenge to continue.</p>
                  <button className="primary-button wide-button" onClick={startPlaying}>Play Now <span>→</span></button>
                  {!user && <p className="small-note">You'll be asked to sign in only when you choose Play Now.</p>}
                </div>
              </div>

              <aside className="detail-side panel">
                <div className="section-kicker">GAME INFORMATION</div>
                <div className="info-row"><span>Category</span><strong>{selectedGame.category}</strong></div>
                <div className="info-row"><span>Game type</span><strong>{selectedGame.type}</strong></div>
                <div className="info-row"><span>Players</span><strong>{selectedGame.players}</strong></div>
                <div className="info-row"><span>Difficulty</span><strong>{selectedGame.difficulty}</strong></div>
                <div className="availability-note">
                  <span className="status-dot"></span>
                  Catalogue listing
                </div>
                <p className="small-note">A playable version must be connected and verified before this title can launch inside GAMEVERSE.</p>
              </aside>
            </div>
          </section>
        )}

        {page === 'auth' && (
          <section className="auth-page">
            <div className="auth-decoration">
              <div className="auth-orbit"></div>
              <span>🎮</span>
              <p>YOUR NEXT ADVENTURE<br /><strong>STARTS HERE.</strong></p>
            </div>

            <div className="auth-card">
              <button className="back-button" onClick={() => selectedGame ? setPage('details') : goHome()}>
                ← Back
              </button>
              <div className="section-kicker">WELCOME TO GAMEVERSE</div>
              <h1>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
              <p className="auth-subtitle">
                {selectedGame
                  ? `Sign in to continue towards ${selectedGame.name}.`
                  : 'Join the universe. Your games are waiting.'}
              </p>

              <div className="auth-tabs">
                <button className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthError('') }}>Sign Up</button>
                <button className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setAuthError('') }}>Login</button>
              </div>

              <form onSubmit={handleAuth}>
                {authMode === 'signup' && (
                  <label className="form-field">
                    <span>Your name</span>
                    <input name="name" type="text" placeholder="Enter your name" required />
                  </label>
                )}
                <label className="form-field">
                  <span>Email address</span>
                  <input name="email" type="email" placeholder="you@example.com" required />
                </label>
                <label className="form-field">
                  <span>Password</span>
                  <input name="password" type="password" placeholder="At least 6 characters" minLength="6" required />
                </label>

                {authError && <p className="form-error">{authError}</p>}

                <button className="primary-button wide-button" type="submit">
                  {authMode === 'signup' ? 'Create Account' : 'Login'} <span>→</span>
                </button>
              </form>

              <p className="auth-switch">
                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <button onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError('') }}>
                  {authMode === 'signup' ? 'Login' : 'Sign up'}
                </button>
              </p>
              <p className="demo-disclaimer">Demo interface only. Real account security will be added with backend authentication.</p>
            </div>
          </section>
        )}

        {page === 'challenge' && selectedGame && (
          <section className="inner-page challenge-page">
            <div className="challenge-card panel">
              <div className="challenge-icon">🧩</div>
              <div className="section-kicker">WELCOME TO YOUR GAME JOURNEY</div>
              <h1>You're in, {user?.name || 'Player'}!</h1>
              <p className="auth-subtitle">You've selected <strong>{selectedGame.name}</strong>.</p>
              <h2>Your GAMEVERSE challenge is next.</h2>
              <p>Before accessing a supported game experience, you'll complete a short GAMEVERSE mini-challenge. This is the next feature we're building.</p>
              <div className="challenge-preview">
                <span>01</span>
                <div><strong>Challenge preparation</strong><small>Riddles and mini-games are coming next.</small></div>
                <span className="coming-soon">UP NEXT</span>
              </div>
              <button className="primary-button wide-button" onClick={goHome}>Back to Game Library</button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <button className="brand brand-button" onClick={goHome}>
          <span className="brand-icon">G</span>
          <span>GAME<span className="brand-accent">VERSE</span></span>
        </button>
        <p>One website. Many games. Less installing.</p>
        <span>© 2026 GAMEVERSE · Built for gamers.</span>
      </footer>
    </div>
  )
}

export default App
