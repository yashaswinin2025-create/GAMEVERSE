
import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = 'http://localhost:5000/api'

const brainGame = {
  id: 'brain-challenge',
  slug: 'brain-challenge',
  name: 'Brain Challenge',
  category: 'Games',
  type: 'Memory Match',
  emoji: '🧠',
  color: 'brain',
  description: 'Challenge your memory with an original GAMEVERSE mini-game.',
  details: 'Find matching pairs in this original browser-based GAMEVERSE game.',
  difficulty: 'All Levels',
  players: 'Single Player',
  connection: 'Low',
  supportedDevices: ['Mobile', 'Desktop'],
  playable: true,
  backend: false,
  browserSupported: true,
}

const categories = ['All Games', 'Games', 'Apps', 'Entertainment']
const MAX_ATTEMPTS = 3
const CHALLENGE_SECONDS = 120
const PASS_MARK = 3

const questSubjects = [
  'General Knowledge',
  'Computer Science',
  'Python',
  'DBMS',
  'Networking',
]

const comfortDefaults = {
  textSize: 'Normal',
  contrast: false,
  subtitles: true,
  simpleNavigation: false,
  preferredCategory: 'All Games',
}

const memoryCards = ['🚀', '🌟', '🎮', '🧩', '🎯', '🪐']

function shuffleArray(items) {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createMemoryDeck() {
  return shuffleArray(
    memoryCards.flatMap((emoji, index) => [
      { id: `${index}-a`, pair: index, emoji },
      { id: `${index}-b`, pair: index, emoji },
    ]),
  )
}

function mapBackendApp(item) {
  const category = ['Games', 'Apps', 'Entertainment'].includes(item.category)
    ? item.category
    : 'Games'

  return {
    id: `backend-${item.id}`,
    backendId: item.id,
    slug: item.slug,
    name: item.name,
    category,
    type: category === 'Games' ? 'Browser Game' : 'Web Experience',
    emoji: category === 'Games' ? '🎮' : category === 'Apps' ? '🌐' : '▶️',
    color: 'browser',
    description: item.description || 'Explore this browser experience.',
    details: item.description || 'Open this experience through its official website.',
    difficulty: 'All Levels',
    players: 'Online',
    connection: 'Medium',
    supportedDevices: ['Desktop', 'Mobile'],
    playable: false,
    backend: true,
    browserSupported: Number(item.browser_supported) === 1,
    iconUrl: item.icon_url || '',
    launchUrl: item.launch_url || '',
  }
}

function App() {
  const [games, setGames] = useState([brainGame])
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [catalogueError, setCatalogueError] = useState('')

  const [activeCategory, setActiveCategory] = useState('All Games')
  const [search, setSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)
  const [page, setPage] = useState('home')

  const [authMode, setAuthMode] = useState('signup')
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [token, setToken] = useState(
    () => localStorage.getItem('gameverse_token') || '',
  )

  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS)
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(CHALLENGE_SECONDS)
  const [quizStatus, setQuizStatus] = useState('intro')
  const [chosenAnswer, setChosenAnswer] = useState('')
  const [quizError, setQuizError] = useState('')
  const [quizLoading, setQuizLoading] = useState(false)
  const [unlockExpiry, setUnlockExpiry] = useState(null)
  const [launchLoading, setLaunchLoading] = useState(false)
  const [launchError, setLaunchError] = useState('')

  const [deviceType, setDeviceType] = useState('Desktop')
  const [controlType, setControlType] = useState('Keyboard and Mouse')
  const [connectionType, setConnectionType] = useState('Wi-Fi')
  const [passportGenerated, setPassportGenerated] = useState(false)

  const [questSubject, setQuestSubject] = useState('General Knowledge')
  const [learnSubject, setLearnSubject] = useState('Computer Science')
  const [learnStarted, setLearnStarted] = useState(false)

  const [comfort, setComfort] = useState(comfortDefaults)
  const [profileSaved, setProfileSaved] = useState(false)
  const [lowInternetMode, setLowInternetMode] = useState(false)

  const [memoryDeck, setMemoryDeck] = useState(createMemoryDeck)
  const [flippedCards, setFlippedCards] = useState([])
  const [matchedPairs, setMatchedPairs] = useState([])
  const [memoryMoves, setMemoryMoves] = useState(0)
  const [memoryFinished, setMemoryFinished] = useState(false)

  // Load browser-supported catalogue entries from the backend.
  useEffect(() => {
    let cancelled = false

    const loadCatalogue = async () => {
      setCatalogueLoading(true)
      setCatalogueError('')

      try {
        const response = await fetch(`${API}/apps`)
        const data = await response.json()

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data.error || 'Could not load the catalogue.')
        }

        const browserApps = data
          .filter((item) => Number(item.browser_supported) === 1)
          .map(mapBackendApp)

        if (!cancelled) {
          setGames([...browserApps, brainGame])
        }
      } catch (error) {
        if (!cancelled) {
          setGames([brainGame])
          setCatalogueError(
            error.message === 'Failed to fetch'
              ? 'Cannot connect to the GAMEVERSE backend. Start the backend server to load the catalogue.'
              : error.message,
          )
        }
      } finally {
        if (!cancelled) setCatalogueLoading(false)
      }
    }

    loadCatalogue()

    return () => {
      cancelled = true
    }
  }, [])

  // Restore the signed-in user name from the saved login token.
  useEffect(() => {
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.username) {
        setUser((previous) => previous || {
          name: payload.username,
          email: '',
        })
      }
    } catch {
      localStorage.removeItem('gameverse_token')
      setToken('')
    }
  }, [token])

  const filteredGames = useMemo(() => games.filter((game) => {
    const matchesCategory =
      activeCategory === 'All Games' || game.category === activeCategory

    const matchesSearch =
      game.name.toLowerCase().includes(search.toLowerCase().trim())

    return matchesCategory && matchesSearch
  }), [games, activeCategory, search])

  const currentQuestion = questions[questionIndex]

  const passportCompatibleGames = games.filter((game) => {
    const deviceSupported = game.supportedDevices.includes(deviceType)
    const connectionSupported =
      connectionType === 'High-speed' ||
      connectionType === 'Wi-Fi' ||
      game.connection === 'Low'

    return deviceSupported && connectionSupported
  })

  const recommendedGames = games.filter((game) =>
    !lowInternetMode || game.connection === 'Low',
  )

  const gameRecommendations = games.filter((game) =>
    comfort.preferredCategory === 'All Games' ||
    game.category === comfort.preferredCategory,
  )

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const navigate = (nextPage) => {
    setPage(nextPage)
    scrollTop()
  }

  const goHome = () => {
    setPage('home')
    setSelectedGame(null)
    setQuizStatus('intro')
    setQuizError('')
    setLaunchError('')
    scrollTop()
  }

  const openDetails = (game) => {
    setSelectedGame(game)
    setLaunchError('')
    setPage('details')
    scrollTop()
  }

  const openAuth = () => {
    setAuthError('')
    setAuthMode('signup')
    setSelectedGame(null)
    navigate('auth')
  }

  const startPlaying = () => {
    if (!selectedGame) return

    if (selectedGame.playable && !selectedGame.backend) {
      startMemoryGame()
      return
    }

    if (user && token) {
      setQuizError('')
      setLaunchError('')
      setQuizStatus('intro')
      navigate('challenge')
    } else {
      setAuthError('')
      setAuthMode('signup')
      navigate('auth')
    }
  }

  // Signup and login.
  const handleAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const name = String(form.get('name') || '').trim()

    try {
      if (!email || !password) {
        throw new Error('Enter your email and password.')
      }

      if (password.length < 8) {
        throw new Error('Password must contain at least 8 characters.')
      }

      if (authMode === 'signup') {
        if (!name) throw new Error('Enter your name.')

        const registerResponse = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, email, password }),
        })

        const registerData = await registerResponse.json()

        if (!registerResponse.ok) {
          throw new Error(
            registerData.error || registerData.message || 'Signup failed.',
          )
        }
      }

      const loginResponse = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(
          loginData.error || loginData.message || 'Login failed.',
        )
      }

      localStorage.setItem('gameverse_token', loginData.token)
      setToken(loginData.token)
      setUser({ name: loginData.username, email })
      setQuizStatus('intro')
      setPage(selectedGame ? 'challenge' : 'home')
      scrollTop()
    } catch (error) {
      setAuthError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the GAMEVERSE backend. Check that it is running.'
          : error.message,
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem('gameverse_token')
    setToken('')
    setUser(null)
    setPage('home')
    setSelectedGame(null)
    setQuizStatus('intro')
    setUnlockExpiry(null)
    scrollTop()
  }

  // Start a backend quiz.
  const beginChallenge = async () => {
    if (!selectedGame || !selectedGame.backend || !token) {
      setQuizError('This experience does not have a backend quiz configured.')
      return
    }

    setQuizLoading(true)
    setQuizError('')

    try {
      const response = await fetch(
        `${API}/apps/${selectedGame.slug}/quiz`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const data = await response.json()

      if (response.status === 409) {
        const accessResponse = await fetch(
          `${API}/apps/${selectedGame.slug}/access`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        const accessData = await accessResponse.json()

        if (accessResponse.ok && accessData.unlocked) {
          setUnlockExpiry(accessData.expiresAt)
          setQuizStatus('unlocked')
          navigate('unlock')
          return
        }

        throw new Error(data.error || 'Could not verify access.')
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Could not start quiz.')
      }

      setSessionId(data.sessionId)
      setAttemptsRemaining(data.attemptsRemaining)
      setAnswers([])
      setQuestionIndex(0)
      setScore(0)
      setSecondsLeft(CHALLENGE_SECONDS)
      setChosenAnswer('')

      setQuestions(
        data.questions.map((question) => ({
          id: question.id,
          q: question.question,
          options: Object.entries(question.options).map(([key, value]) => ({
            key,
            value,
          })),
          level: question.difficulty,
          subject: questSubject,
        })),
      )

      setQuizStatus('playing')
    } catch (error) {
      setQuizError(error.message)
    } finally {
      setQuizLoading(false)
    }
  }

  // Submit quiz answers. The backend verifies the correct answers.
  const submitChallenge = async (finalAnswers = answers) => {
    if (!selectedGame?.slug || !sessionId || !token || quizLoading) return

    setQuizLoading(true)
    setQuizError('')

    const completeAnswers = questions.map((question) => {
      const saved = finalAnswers.find(
        (answer) => answer.questionId === question.id,
      )

      return {
        questionId: question.id,
        answer: saved?.answer || '',
      }
    })

    try {
      const response = await fetch(
        `${API}/apps/${selectedGame.slug}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId,
            answers: completeAnswers,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Quiz submission failed.')
      }

      setScore(data.score)
      setAttemptsRemaining(data.attemptsRemaining)
      setSessionId(null)

      if (data.passed) {
        const accessResponse = await fetch(
          `${API}/apps/${selectedGame.slug}/access`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        const accessData = await accessResponse.json()

        if (!accessResponse.ok || !accessData.unlocked) {
          throw new Error('Quiz passed, but the unlock could not be verified.')
        }

        setUnlockExpiry(accessData.expiresAt)
        setQuizStatus('unlocked')
      } else {
        setUnlockExpiry(null)
        setQuizStatus('finished')
      }
    } catch (error) {
      setQuizError(error.message)
      setQuizStatus('finished')
    } finally {
      setQuizLoading(false)
    }
  }

  const answerQuestion = (optionKey) => {
    if (!currentQuestion || chosenAnswer || quizLoading) return

    const updatedAnswers = [
      ...answers.filter((answer) => answer.questionId !== currentQuestion.id),
      { questionId: currentQuestion.id, answer: optionKey },
    ]

    setAnswers(updatedAnswers)
    setChosenAnswer(optionKey)
  }

  const goToNextQuestion = () => {
    if (questionIndex >= questions.length - 1) {
      submitChallenge()
    } else {
      setQuestionIndex((value) => value + 1)
      setChosenAnswer('')
    }
  }

  const formatTime = (value) =>
    `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`

  // Quiz countdown.
  useEffect(() => {
    if (page !== 'challenge' || quizStatus !== 'playing' || quizLoading) {
      return undefined
    }

    if (secondsLeft <= 0) {
      submitChallenge()
      return undefined
    }

    const timerId = window.setTimeout(
      () => setSecondsLeft((time) => time - 1),
      1000,
    )

    return () => window.clearTimeout(timerId)
  }, [page, quizStatus, secondsLeft, quizLoading])

  // Memory game matching logic.
  useEffect(() => {
    if (flippedCards.length !== 2) return undefined

    const [first, second] = flippedCards

    if (memoryDeck[first].pair === memoryDeck[second].pair) {
      const timerId = window.setTimeout(() => {
        setMatchedPairs((previous) => [...previous, memoryDeck[first].pair])
        setFlippedCards([])
      }, 450)

      return () => window.clearTimeout(timerId)
    }

    const timerId = window.setTimeout(() => setFlippedCards([]), 850)
    return () => window.clearTimeout(timerId)
  }, [flippedCards, memoryDeck])

  useEffect(() => {
    if (matchedPairs.length === memoryCards.length) {
      setMemoryFinished(true)
    }
  }, [matchedPairs])

  // Open the official destination only after checking the GAMEVERSE unlock.
  const launchExperience = async () => {
    if (!selectedGame?.backend || !token) {
      setLaunchError('Please sign in and unlock this experience first.')
      return
    }

    setLaunchLoading(true)
    setLaunchError('')

    try {
      const response = await fetch(
        `${API}/apps/${selectedGame.slug}/access`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not verify your unlock.')
      }

      if (!data.unlocked) {
        setUnlockExpiry(null)
        throw new Error('Your GAMEVERSE unlock has expired. Complete the quiz again.')
      }

      if (!data.launchUrl) {
        throw new Error('This experience does not have a browser launch link.')
      }

      setUnlockExpiry(data.expiresAt)
      window.location.assign(data.launchUrl)
    } catch (error) {
      setLaunchError(error.message)
    } finally {
      setLaunchLoading(false)
    }
  }

  const generatePassport = () => setPassportGenerated(true)

  const updateComfort = (key, value) => {
    setComfort((previous) => ({ ...previous, [key]: value }))
    setProfileSaved(false)
  }

  const startMemoryGame = () => {
    setMemoryDeck(createMemoryDeck())
    setFlippedCards([])
    setMatchedPairs([])
    setMemoryMoves(0)
    setMemoryFinished(false)
    navigate('minigame')
  }

  const flipMemoryCard = (index) => {
    if (
      flippedCards.length >= 2 ||
      flippedCards.includes(index) ||
      matchedPairs.includes(memoryDeck[index].pair) ||
      memoryFinished
    ) return

    setFlippedCards((previous) => [...previous, index])

    if (flippedCards.length === 1) {
      setMemoryMoves((previous) => previous + 1)
    }
  }

  const resetMemoryGame = () => {
    setMemoryDeck(createMemoryDeck())
    setFlippedCards([])
    setMatchedPairs([])
    setMemoryMoves(0)
    setMemoryFinished(false)
  }

  const openLearnChallenge = () => {
    if (!user || !token) {
      setAuthMode('signup')
      setAuthError('')
      navigate('auth')
      return
    }

    const firstBackendGame = games.find((game) => game.backend)

    if (!firstBackendGame) {
      setQuizError('The browser catalogue is not available yet.')
      return
    }

    setSelectedGame(firstBackendGame)
    setQuestSubject(learnSubject)
    setQuizStatus('intro')
    navigate('challenge')
  }

  const getConnectionLabel = (connection) => {
    if (connection === 'High') return 'High connection recommended'
    if (connection === 'Medium') return 'Moderate connection recommended'
    return 'Low connection friendly'
  }

  const renderGameIcon = (game, large = false) => {
    if (game.iconUrl) {
      return (
        <img
          src={game.iconUrl}
          alt=""
          loading="lazy"
          style={{
            width: large ? '100px' : '64px',
            height: large ? '100px' : '64px',
            objectFit: 'contain',
            borderRadius: '14px',
          }}
        />
      )
    }

    return <span className="game-emoji">{game.emoji}</span>
  }

  return (
    <div className={`app-shell ${comfort.contrast ? 'high-contrast' : ''}`}>
      <header className="navbar">
        <button className="brand" onClick={goHome}>
          <span className="brand-icon">🎮</span>
          <span>GAMEVERSE</span>
        </button>

        <nav className="nav-links">
          <button onClick={goHome}>Home</button>
          <button onClick={() => navigate('discover')}>Discover</button>
          <button onClick={() => navigate('passport')}>Passport</button>
          <button onClick={() => navigate('learn')}>Learn</button>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-greeting">Hi, {user.name}</span>
              <button className="btn-outline" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <button className="btn-primary" onClick={openAuth}>Sign in</button>
          )}
        </div>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="hero-section">
              <div className="hero-content">
                <span className="eyebrow">YOUR NEXT LEVEL STARTS HERE</span>
                <h1>Knowledge unlocks <span>experiences.</span></h1>
                <p>
                  Discover browser games and popular web experiences.
                  Complete a knowledge challenge and unlock your GAMEVERSE access.
                </p>
                <div className="hero-actions">
                  <button className="btn-primary" onClick={() => navigate('discover')}>
                    Explore experiences <span>→</span>
                  </button>
                  <button className="btn-outline" onClick={() => navigate('learn')}>
                    Learn and play
                  </button>
                </div>
                <div className="hero-stats">
                  <div><strong>01</strong><span>Discover</span></div>
                  <div><strong>02</strong><span>Challenge</span></div>
                  <div><strong>03</strong><span>Unlock</span></div>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-orbit orbit-one"></div>
                <div className="hero-orbit orbit-two"></div>
                <div className="hero-game-card">
                  <span>🎮</span>
                  <h3>GAMEVERSE</h3>
                  <p>Play smarter. Explore more.</p>
                  <div className="hero-card-dots">● ● ●</div>
                </div>
                <span className="floating-icon float-one">🚀</span>
                <span className="floating-icon float-two">🧠</span>
                <span className="floating-icon float-three">⭐</span>
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">START EXPLORING</span>
                  <h2>Featured experiences</h2>
                </div>
                <button className="text-button" onClick={() => navigate('discover')}>
                  View all →
                </button>
              </div>

              {catalogueLoading && <p className="muted-text">Loading experiences...</p>}
              {catalogueError && <p className="error-message">{catalogueError}</p>}

              <div className="game-grid">
                {games.slice(0, 3).map((game) => (
                  <article className={`game-card ${game.color}`} key={game.id}>
                    <div className="game-art">
                      {renderGameIcon(game)}
                      <span className="game-category">{game.category}</span>
                    </div>
                    <div className="game-card-content">
                      <h3>{game.name}</h3>
                      <p>{game.description}</p>
                      <button className="btn-outline" onClick={() => openDetails(game)}>
                        Explore →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="feature-section">
              <div>
                <span className="eyebrow">MORE THAN A GAME CATALOGUE</span>
                <h2>Think. Challenge. Discover.</h2>
                <p>
                  Discover browser experiences, complete knowledge challenges
                  and explore original GAMEVERSE games.
                </p>
              </div>
              <div className="feature-grid">
                <div className="feature-card">
                  <span>🔎</span><h3>Discover</h3>
                  <p>Explore browser games and popular web experiences.</p>
                </div>
                <div className="feature-card">
                  <span>🧠</span><h3>Challenge</h3>
                  <p>Test your knowledge with quizzes.</p>
                </div>
                <div className="feature-card">
                  <span>🔓</span><h3>Unlock</h3>
                  <p>Earn a time-limited GAMEVERSE access status.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {page === 'discover' && (
          <section className="page-section">
            <div className="page-heading">
              <span className="eyebrow">THE GAMEVERSE COLLECTION</span>
              <h1>Discover experiences</h1>
              <p>Find browser games and web experiences.</p>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search games and apps..."
              />
            </div>

            <div className="category-list">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? 'category-active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {catalogueLoading && <p className="muted-text">Loading catalogue...</p>}
            {catalogueError && <p className="error-message">{catalogueError}</p>}

            <div className="game-grid">
              {filteredGames.map((game) => (
                <article className={`game-card ${game.color}`} key={game.id}>
                  <div className="game-art">
                    {renderGameIcon(game)}
                    <span className="game-category">{game.category}</span>
                  </div>
                  <div className="game-card-content">
                    <h3>{game.name}</h3>
                    <p>{game.description}</p>
                    <div className="game-meta">
                      <span>{game.type}</span>
                      <span>{game.difficulty}</span>
                    </div>
                    <button className="btn-primary" onClick={() => openDetails(game)}>
                      View details →
                    </button>
                  </div>
                </article>
              ))}

              {filteredGames.length === 0 && !catalogueLoading && (
                <div className="empty-state">
                  <span>🔍</span>
                  <h3>No experiences found</h3>
                  <p>Try another search or category.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {page === 'details' && selectedGame && (
          <section className="page-section details-page">
            <button className="back-button" onClick={() => navigate('discover')}>
              ← Back to Discover
            </button>

            <div className={`details-hero ${selectedGame.color}`}>
              <div className="details-art">
                {renderGameIcon(selectedGame, true)}
              </div>
              <div className="details-content">
                <span className="eyebrow">{selectedGame.category} EXPERIENCE</span>
                <h1>{selectedGame.name}</h1>
                <p>{selectedGame.details}</p>
                <div className="game-meta">
                  <span>{selectedGame.type}</span>
                  <span>{selectedGame.difficulty}</span>
                  <span>{selectedGame.players}</span>
                </div>
                <button className="btn-primary" onClick={startPlaying}>
                  {selectedGame.playable
                    ? 'Play Brain Challenge →'
                    : 'Start GAMEVERSE challenge →'}
                </button>
              </div>
            </div>

            <div className="details-info-grid">
              <div className="info-card">
                <span>🎮</span><h3>Experience</h3>
                <p>{selectedGame.type}</p>
              </div>
              <div className="info-card">
                <span>📶</span><h3>Connectivity</h3>
                <p>{getConnectionLabel(selectedGame.connection)}</p>
              </div>
              <div className="info-card">
                <span>🔐</span><h3>Challenge</h3>
                <p>
                  {selectedGame.backend
                    ? 'Backend-verified quiz and 24-hour GAMEVERSE unlock.'
                    : 'Original GAMEVERSE mini-game.'}
                </p>
              </div>
            </div>

            {selectedGame.backend && (
              <p className="notice">
                GAMEVERSE opens the official browser destination after a successful
                quiz. Third-party login, subscriptions and access requirements
                still apply.
              </p>
            )}

            {selectedGame.playable && (
              <p className="notice">
                Brain Challenge is an original GAMEVERSE browser mini-game.
              </p>
            )}
          </section>
        )}

        {page === 'auth' && (
          <section className="auth-section">
            <div className="auth-card">
              <span className="auth-logo">🎮</span>
              <span className="eyebrow">WELCOME TO GAMEVERSE</span>
              <h1>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
              <p>
                {authMode === 'signup'
                  ? 'Join the GAMEVERSE community.'
                  : 'Sign in to continue your journey.'}
              </p>

              <div className="auth-tabs">
                <button
                  className={authMode === 'signup' ? 'tab-active' : ''}
                  onClick={() => { setAuthMode('signup'); setAuthError('') }}
                >
                  Sign up
                </button>
                <button
                  className={authMode === 'login' ? 'tab-active' : ''}
                  onClick={() => { setAuthMode('login'); setAuthError('') }}
                >
                  Login
                </button>
              </div>

              <form onSubmit={handleAuth}>
                {authMode === 'signup' && (
                  <label>
                    Username
                    <input name="name" type="text" placeholder="Enter your name" required />
                  </label>
                )}

                <label>
                  Email address
                  <input name="email" type="email" placeholder="Enter your email" required />
                </label>

                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                </label>

                {authError && <p className="error-message">{authError}</p>}

                <button className="btn-primary auth-submit" type="submit" disabled={authLoading}>
                  {authLoading
                    ? 'Please wait...'
                    : authMode === 'signup' ? 'Create account →' : 'Login →'}
                </button>
              </form>

              <button className="back-button" onClick={goHome}>← Back to home</button>
            </div>
          </section>
        )}

        {page === 'challenge' && selectedGame && (
          <section className="page-section challenge-page">
            <button className="back-button" onClick={() => navigate('details')}>
              ← Back to experience
            </button>

            <div className="challenge-heading">
              <span className="eyebrow">GAMEVERSE KNOWLEDGE CHALLENGE</span>
              <h1>{selectedGame.name}</h1>
              <p>Complete the challenge to earn your GAMEVERSE unlock.</p>
            </div>

            {!selectedGame.backend && (
              <div className="challenge-card">
                <span className="large-icon">{selectedGame.emoji}</span>
                <h2>Brain Challenge</h2>
                <p>Play our original memory-matching mini-game.</p>
                <button className="btn-primary" onClick={startMemoryGame}>
                  Play Brain Challenge →
                </button>
                <button className="btn-outline" onClick={() => navigate('discover')}>
                  Explore other experiences
                </button>
              </div>
            )}

            {selectedGame.backend && quizStatus === 'intro' && (
              <div className="challenge-card">
                <span className="large-icon">🧠</span>
                <h2>Ready for the challenge?</h2>
                <p>Answer five questions selected by the GAMEVERSE backend.</p>

                <div className="challenge-rules">
                  <div><strong>05</strong><span>Questions</span></div>
                  <div><strong>03/05</strong><span>Pass mark</span></div>
                  <div><strong>03</strong><span>Maximum attempts</span></div>
                  <div><strong>24h</strong><span>Unlock duration</span></div>
                </div>

                <p className="muted-text">
                  Questions include 2 Easy, 2 Medium and 1 Hard question.
                </p>

                {quizError && <p className="error-message">{quizError}</p>}

                <button
                  className="btn-primary"
                  onClick={beginChallenge}
                  disabled={quizLoading || attemptsRemaining <= 0}
                >
                  {quizLoading ? 'Loading quiz...' : 'Start challenge →'}
                </button>

                {attemptsRemaining <= 0 && (
                  <p className="error-message">No attempts remaining for this experience.</p>
                )}
              </div>
            )}

            {selectedGame.backend && quizStatus === 'playing' && currentQuestion && (
              <div className="challenge-card quiz-card">
                <div className="quiz-topline">
                  <span>Question {questionIndex + 1} of {questions.length}</span>
                  <span className="timer-display">⏱ {formatTime(secondsLeft)}</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>

                <span className="question-level">{currentQuestion.level}</span>
                <h2>{currentQuestion.q}</h2>

                <div className="answer-options">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.key}
                      className={`answer-option ${chosenAnswer === option.key ? 'answer-selected' : ''}`}
                      onClick={() => answerQuestion(option.key)}
                      disabled={Boolean(chosenAnswer) || quizLoading}
                    >
                      <span>{option.key.toUpperCase()}</span>
                      {option.value}
                    </button>
                  ))}
                </div>

                {chosenAnswer && (
                  <button className="btn-primary" onClick={goToNextQuestion} disabled={quizLoading}>
                    {questionIndex === questions.length - 1
                      ? 'Submit answers →'
                      : 'Next question →'}
                  </button>
                )}

                {quizLoading && <p>Checking your answers...</p>}
                {quizError && <p className="error-message">{quizError}</p>}
              </div>
            )}

            {selectedGame.backend && quizStatus === 'finished' && (
              <div className="challenge-card result-card">
                <span className="large-icon">📘</span>
                <h2>Challenge completed</h2>
                <div className="result-score">{score}/5</div>
                <p>You did not reach the required score of 3/5.</p>
                <p>Attempts remaining: {attemptsRemaining}</p>

                {quizError && <p className="error-message">{quizError}</p>}

                <button
                  className="btn-primary"
                  onClick={() => {
                    setQuizError('')
                    setQuizStatus('intro')
                  }}
                  disabled={attemptsRemaining <= 0}
                >
                  Try again →
                </button>

                <button className="btn-outline" onClick={() => navigate('discover')}>
                  Back to experiences
                </button>
              </div>
            )}

            {selectedGame.backend && quizStatus === 'unlocked' && (
              <div className="challenge-card result-card">
                <span className="large-icon">🔓</span>
                <h2>GAMEVERSE unlock earned!</h2>
                <div className="result-score">{score}/5</div>
                <p>Your challenge was successfully verified by the backend.</p>
                <p className="success-message">
                  Your GAMEVERSE unlock is valid for 24 hours.
                </p>

                {unlockExpiry && (
                  <p>Unlock expires: {new Date(unlockExpiry).toLocaleString()}</p>
                )}

                <button className="btn-primary" onClick={() => navigate('unlock')}>
                  Continue →
                </button>
              </div>
            )}
          </section>
        )}

        {page === 'unlock' && (
          <section className="page-section unlock-page">
            <div className="unlock-card">
              <span className="large-icon">🔓</span>
              <span className="eyebrow">CHALLENGE COMPLETED</span>
              <h1>Your experience is unlocked!</h1>

              <p>
                You earned a 24-hour GAMEVERSE unlock for {selectedGame?.name}.
              </p>

              <div className="unlock-duration">24 HOURS</div>

              {unlockExpiry && (
                <p>Unlock expires: {new Date(unlockExpiry).toLocaleString()}</p>
              )}

              <p className="muted-text">
                Your unlock controls access through GAMEVERSE only. It does not
                provide a third-party subscription or bypass another platform's
                login, payment or access requirements.
              </p>

              {selectedGame?.backend && (
                <button
                  className="btn-primary"
                  onClick={launchExperience}
                  disabled={launchLoading}
                >
                  {launchLoading ? 'Verifying access...' : 'PLAY NOW →'}
                </button>
              )}

              {selectedGame?.playable && (
                <button className="btn-primary" onClick={startMemoryGame}>
                  Play Brain Challenge →
                </button>
              )}

              {launchError && <p className="error-message">{launchError}</p>}

              <button className="btn-outline" onClick={goHome}>
                Return to GAMEVERSE
              </button>
            </div>
          </section>
        )}

        {page === 'minigame' && (
          <section className="page-section minigame-page">
            <button className="back-button" onClick={() => navigate('details')}>
              ← Back
            </button>

            <div className="page-heading">
              <span className="eyebrow">ORIGINAL GAMEVERSE MINI-GAME</span>
              <h1>Brain Challenge</h1>
              <p>Find all matching pairs.</p>
            </div>

            <div className="memory-stats">
              <div><strong>{memoryMoves}</strong><span>Moves</span></div>
              <div><strong>{matchedPairs.length}/{memoryCards.length}</strong><span>Pairs found</span></div>
            </div>

            <div className="memory-grid">
              {memoryDeck.map((card, index) => {
                const isVisible =
                  flippedCards.includes(index) || matchedPairs.includes(card.pair)

                return (
                  <button
                    key={card.id}
                    className={`memory-card ${isVisible ? 'memory-flipped' : ''} ${
                      matchedPairs.includes(card.pair) ? 'memory-matched' : ''
                    }`}
                    onClick={() => flipMemoryCard(index)}
                    disabled={isVisible || memoryFinished}
                  >
                    {isVisible ? card.emoji : '?'}
                  </button>
                )
              })}
            </div>

            {memoryFinished && (
              <div className="success-message">
                <h2>🎉 You found every pair!</h2>
                <p>Completed in {memoryMoves} moves.</p>
              </div>
            )}

            <button className="btn-primary" onClick={resetMemoryGame}>
              Restart game ↻
            </button>
          </section>
        )}

        {page === 'passport' && (
          <section className="page-section">
            <div className="page-heading">
              <span className="eyebrow">DEVICE COMPATIBILITY</span>
              <h1>Playability Passport</h1>
              <p>Explore catalogue compatibility based on your selected setup.</p>
            </div>

            <div className="settings-card">
              <label>
                Device
                <select value={deviceType} onChange={(event) => {
                  setDeviceType(event.target.value)
                  setPassportGenerated(false)
                }}>
                  <option>Desktop</option>
                  <option>Mobile</option>
                </select>
              </label>

              <label>
                Controls
                <select value={controlType} onChange={(event) => {
                  setControlType(event.target.value)
                  setPassportGenerated(false)
                }}>
                  <option>Keyboard and Mouse</option>
                  <option>Touchscreen</option>
                  <option>Controller</option>
                </select>
              </label>

              <label>
                Connection
                <select value={connectionType} onChange={(event) => {
                  setConnectionType(event.target.value)
                  setPassportGenerated(false)
                }}>
                  <option>Wi-Fi</option>
                  <option>High-speed</option>
                  <option>Limited data</option>
                </select>
              </label>

              <button className="btn-primary" onClick={generatePassport}>
                Generate passport →
              </button>
            </div>

            {passportGenerated && (
              <div className="passport-results">
                <h2>Your compatibility overview</h2>
                <p>Device: {deviceType} · Controls: {controlType}</p>
                <p>Connection: {connectionType}</p>
                <h3>Compatible catalogue entries</h3>

                {passportCompatibleGames.map((game) => (
                  <div className="passport-game" key={game.id}>
                    <span>{game.emoji} {game.name}</span>
                    <span className="success-message">Compatible by selected profile</span>
                  </div>
                ))}

                <p className="muted-text">
                  This is a profile-based estimate, not a live device test.
                </p>
              </div>
            )}
          </section>
        )}

        {page === 'learn' && (
          <section className="page-section">
            <div className="page-heading">
              <span className="eyebrow">LEARN TO PLAY</span>
              <h1>Build your knowledge</h1>
              <p>Choose a subject and explore learning challenges.</p>
            </div>

            <div className="learn-card">
              <span className="large-icon">📚</span>
              <h2>Choose your learning subject</h2>

              <select value={learnSubject} onChange={(event) => {
                setLearnSubject(event.target.value)
                setLearnStarted(false)
              }}>
                {questSubjects.map((subject) => (
                  <option key={subject}>{subject}</option>
                ))}
              </select>

              <button className="btn-primary" onClick={() => {
                setLearnStarted(true)
                openLearnChallenge()
              }}>
                Start learning →
              </button>

              {learnStarted && <p>Subject selected: {learnSubject}</p>}
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <span>💻</span><h3>Computer Science</h3>
                <p>Explore computing concepts.</p>
              </div>
              <div className="feature-card">
                <span>🐍</span><h3>Python</h3>
                <p>Build programming knowledge.</p>
              </div>
              <div className="feature-card">
                <span>🗄️</span><h3>DBMS</h3>
                <p>Explore database concepts.</p>
              </div>
            </div>
          </section>
        )}

        {page === 'comfort' && (
          <section className="page-section">
            <div className="page-heading">
              <span className="eyebrow">PERSONAL SETTINGS</span>
              <h1>Player Comfort Profile</h1>
              <p>Adjust the interface to your preferences.</p>
            </div>

            <div className="settings-card">
              <label>
                Text size
                <select
                  value={comfort.textSize}
                  onChange={(event) => updateComfort('textSize', event.target.value)}
                >
                  <option>Normal</option>
                  <option>Large</option>
                  <option>Extra Large</option>
                </select>
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={comfort.contrast}
                  onChange={(event) => updateComfort('contrast', event.target.checked)}
                />
                High contrast
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={comfort.subtitles}
                  onChange={(event) => updateComfort('subtitles', event.target.checked)}
                />
                Prefer subtitles
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={comfort.simpleNavigation}
                  onChange={(event) => updateComfort('simpleNavigation', event.target.checked)}
                />
                Simplified navigation
              </label>

              <label>
                Preferred category
                <select
                  value={comfort.preferredCategory}
                  onChange={(event) => updateComfort('preferredCategory', event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <button className="btn-primary" onClick={() => setProfileSaved(true)}>
                Save preferences
              </button>

              {profileSaved && (
                <p className="success-message">Preferences applied for this session.</p>
              )}
            </div>

            <h2>Recommended catalogue entries</h2>

            <div className="game-grid">
              {gameRecommendations.map((game) => (
                <article className="game-card" key={game.id}>
                  <div className="game-art">{renderGameIcon(game)}</div>
                  <div className="game-card-content">
                    <h3>{game.name}</h3>
                    <button className="btn-outline" onClick={() => openDetails(game)}>
                      Explore →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === 'lowinternet' && (
          <section className="page-section">
            <div className="page-heading">
              <span className="eyebrow">SMART CONNECTIVITY</span>
              <h1>Low-Internet Mode</h1>
              <p>Filter catalogue entries by their listed connection needs.</p>
            </div>

            <div className="settings-card">
              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={lowInternetMode}
                  onChange={(event) => setLowInternetMode(event.target.checked)}
                />
                Enable low-internet catalogue filter
              </label>

              <p className="muted-text">
                This feature uses catalogue metadata. It does not measure
                your actual internet speed.
              </p>
            </div>

            <div className="game-grid">
              {recommendedGames.map((game) => (
                <article className="game-card" key={game.id}>
                  <div className="game-art">{renderGameIcon(game)}</div>
                  <div className="game-card-content">
                    <h3>{game.name}</h3>
                    <p>{getConnectionLabel(game.connection)}</p>
                    <button className="btn-outline" onClick={() => openDetails(game)}>
                      Explore →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span>🎮 GAMEVERSE</span>
          <p>Knowledge unlocks experiences.</p>
        </div>

        <div className="footer-links">
          <button onClick={goHome}>Home</button>
          <button onClick={() => navigate('discover')}>Discover</button>
          <button onClick={() => navigate('passport')}>Passport</button>
          <button onClick={() => navigate('comfort')}>Comfort profile</button>
          <button onClick={() => navigate('lowinternet')}>Low-internet mode</button>
        </div>

        <p className="footer-copy">© 2026 GAMEVERSE · Hackathon prototype</p>
      </footer>
    </div>
  )
}

export default App
