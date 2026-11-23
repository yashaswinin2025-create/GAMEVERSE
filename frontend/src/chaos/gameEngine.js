
export class GameEngine {
  constructor(canvas, onUpdate, onFinish) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onUpdate = onUpdate
    this.onFinish = onFinish

    this.width = 900
    this.height = 600

    this.player = {
      x: 450,
      y: 480,
      width: 34,
      height: 54,
      speed: 5,
      health: 100,
      nitro: 100,
    }

    this.keys = {}
    this.obstacles = []
    this.coins = []
    this.enemies = []
    this.score = 0
    this.time = 90
    this.running = false
    this.frame = 0
    this.animationId = null

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.loop = this.loop.bind(this)
  }

  start() {
    this.running = true
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.spawnInitialObjects()
    this.lastTime = performance.now()
    this.loop()
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }

  handleKeyDown(event) {
    this.keys[event.key.toLowerCase()] = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault()
    }
  }

  handleKeyUp(event) {
    this.keys[event.key.toLowerCase()] = false
  }

  spawnInitialObjects() {
    for (let i = 0; i < 5; i++) {
      this.obstacles.push({
        x: 100 + Math.random() * 650,
        y: -i * 160,
        width: 38,
        height: 55,
        speed: 3 + Math.random() * 2,
      })
    }

    for (let i = 0; i < 4; i++) {
      this.coins.push({
        x: 100 + Math.random() * 700,
        y: -i * 230 - 100,
        collected: false,
      })
    }

    for (let i = 0; i < 3; i++) {
      this.enemies.push({
        x: 150 + i * 250,
        y: -300 - i * 250,
        width: 34,
        height: 54,
        speed: 3.5,
      })
    }
  }

  update(delta) {
    const p = this.player
    const dt = Math.min(delta / 16.67, 2)

    if (this.keys.arrowleft || this.keys.a) p.x -= p.speed * dt
    if (this.keys.arrowright || this.keys.d) p.x += p.speed * dt
    if (this.keys.arrowup || this.keys.w) p.y -= p.speed * dt
    if (this.keys.arrowdown || this.keys.s) p.y += p.speed * dt

    p.x = Math.max(55, Math.min(this.width - 55, p.x))
    p.y = Math.max(80, Math.min(this.height - 55, p.y))

    if ((this.keys.shift || this.keys[' ']) && p.nitro > 0) {
      p.nitro = Math.max(0, p.nitro - 0.8 * dt)
      this.score += 0.1 * dt
    } else {
      p.nitro = Math.min(100, p.nitro + 0.15 * dt)
    }

    this.obstacles.forEach((o) => {
      o.y += o.speed * dt

      if (o.y > this.height) {
        o.y = -80
        o.x = 80 + Math.random() * 740
        this.score += 10
      }

      if (this.collides(p, o)) {
        o.y = -100
        p.health = Math.max(0, p.health - 12)
      }
    })

    this.enemies.forEach((e) => {
      e.y += e.speed * dt

      if (e.y > this.height) {
        e.y = -120
        e.x = 100 + Math.random() * 700
        this.score += 20
      }

      if (this.collides(p, e)) {
        e.y = -120
        p.health = Math.max(0, p.health - 15)
      }
    })

    this.coins.forEach((coin) => {
      coin.y += 3 * dt

      if (coin.y > this.height) {
        coin.y = -100
        coin.x = 80 + Math.random() * 740
        coin.collected = false
      }

      if (!coin.collected) {
        const distance = Math.hypot(p.x - coin.x, p.y - coin.y)
        if (distance < 38) {
          coin.collected = true
          this.score += 50
        }
      }
    })

    if (p.health <= 0) {
      this.finish('failed')
    }

    this.onUpdate({
      score: Math.floor(this.score),
      health: p.health,
      nitro: Math.floor(p.nitro),
      time: this.time,
    })
  }

  collides(a, b) {
    return (
      a.x - a.width / 2 < b.x + b.width / 2 &&
      a.x + a.width / 2 > b.x - b.width / 2 &&
      a.y - a.height / 2 < b.y + b.height / 2 &&
      a.y + a.height / 2 > b.y - b.height / 2
    )
  }

  drawRoad() {
    const ctx = this.ctx

    ctx.fillStyle = '#101827'
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.fillStyle = '#273449'
    ctx.fillRect(55, 0, 790, this.height)

    ctx.fillStyle = '#facc15'
    ctx.fillRect(65, 0, 4, this.height)
    ctx.fillRect(831, 0, 4, this.height)

    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 3
    ctx.setLineDash([35, 30])
    ctx.lineDashOffset = -this.frame % 65
    ctx.beginPath()
    ctx.moveTo(450, 0)
    ctx.lineTo(450, this.height)
    ctx.stroke()
    ctx.setLineDash([])
  }

  drawCar(x, y, color, width = 34, height = 54) {
    const ctx = this.ctx

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x - width / 2, y - height / 2, width, height, 8)
    ctx.fill()

    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(x - width / 2 + 5, y - height / 2 + 9, width - 10, 12)

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(x - width / 2 + 5, y + height / 2 - 13, width - 10, 7)

    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(x - width / 2 + 4, y - height / 2, 6, 4)
    ctx.fillRect(x + width / 2 - 10, y - height / 2, 6, 4)
  }

  draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    this.drawRoad()

    this.obstacles.forEach((o) => {
      this.drawCar(o.x, o.y, '#ef4444', o.width, o.height)
    })

    this.enemies.forEach((e) => {
      this.drawCar(e.x, e.y, '#a855f7', e.width, e.height)
    })

    this.coins.forEach((coin) => {
      if (coin.collected) return

      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#854d0e'
      ctx.font = 'bold 12px Arial'
      ctx.fillText('$', coin.x - 4, coin.y + 4)
    })

    this.drawCar(
      this.player.x,
      this.player.y,
      '#22d3ee',
      this.player.width,
      this.player.height,
    )

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px Arial'
    ctx.fillText('CHAOS CIRCUIT', 20, 30)
  }

  finish(status) {
    if (!this.running) return
    this.running = false
    this.stop()
    this.onFinish(status, Math.floor(this.score))
  }

  loop(now = performance.now()) {
    if (!this.running) return

    const delta = now - this.lastTime
    this.lastTime = now
    this.frame += delta * 0.06

    this.update(delta)
    this.draw()

    this.animationId = requestAnimationFrame(this.loop)
  }
}
