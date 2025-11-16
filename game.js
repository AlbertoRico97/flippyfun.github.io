// ========== CONFIGURACIÓN INICIAL ==========
// Obtener el canvas del HTML y su 2D para dibujar
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

// Configuración del juego (cfg = config)
const cfg = {
  gravity: 0.5, // Gravedad que afecta al pez
  jump: -9, // Fuerza del salto (negativo = hacia arriba)
  pipeW: 60, // Ancho de las tuberías (pipeW = pipeWidth)
  pipeGap: 150, // Espacio entre tubería superior e inferior
  speed: 2, // Velocidad de movimiento de tuberías
  spawn: 90 // Cada cuántos frames aparece una tubería
}

// ========== VARIABLES DEL JUEGO ==========
// state: puede ser 'ready' (listo), 'playing' (jugando), 'gameOver' (fin)
// frame: contador de fotogramas para saber cuándo crear tuberías
// score: puntuación actual, highScore: mejor puntuación guardada
let state = 'ready',
  frame = 0,
  score = 0,
  highScore = localStorage.getItem('hs') || 0

// fish: objeto con las propiedades del pez
// x,y: posición, r: radio (r = radius), vy: velocidad vertical
let fish = { x: 100, y: 300, r: 15, vy: 0 }

// pipes: array que guarda todas las tuberías en pantalla
let pipes = []

// ========== ELEMENTOS DEL DOM ==========
// $ es una función auxiliar que hace más corto getElementById
const $ = id => document.getElementById(id)
// elems: objeto con referencias a elementos HTML que necesitamos actualizar
const elems = {
  over: $('gameOver'), // Pantalla de game over
  final: $('finalScore'), // Puntuación final
  high: $('highScore'), // Mejor puntuación en game over
  current: $('currentScore'), // Puntuación actual en pantalla
  best: $('bestScore') // Mejor puntuación en pantalla principal
}
// Mostrar el highScore guardado al cargar
elems.best.textContent = highScore

// ========== SONIDOS ==========
// Cargar el sonido de salto
const jumpSound = new Audio('assets/sounds/jump.mp3')
// Cargar el sonido de game over
const gameOverSound = new Audio('assets/sounds/game-over.mp3')

// ========== FUNCIONES DE CONTROL ==========
// jump: hace que el pez salte
const jump = () => {
  if (state === 'ready') state = 'playing' // Si está listo, empieza el juego
  if (state === 'playing') {
    fish.vy = cfg.jump // Si está jugando, aplica fuerza de salto
    jumpSound.currentTime = 0 // Reinicia el sonido desde el inicio
    jumpSound.play().catch(() => {}) // Reproduce el sonido (catch evita errores si falla)
  }
}

// reset: reinicia el juego a su estado inicial
const reset = () => {
  state = 'ready' // Vuelve al estado listo
  fish.y = 300 // Pez en el centro vertical
  fish.vy = 0 // Sin velocidad vertical
  pipes = [] // Borra todas las tuberías
  score = frame = 0 // Resetea puntuación y frames
  elems.current.textContent = 0 // Actualiza texto de puntuación
  elems.over.classList.add('hidden') // Oculta pantalla de game over
}

// end: termina el juego y muestra los resultados
const end = () => {
  state = 'gameOver' // Cambia estado a game over
  
  // Reproduce el sonido de game over
  gameOverSound.currentTime = 0 // Reinicia desde el inicio
  gameOverSound.play().catch(() => {}) // Reproduce el sonido

  // Si la puntuación actual es mejor que el récord
  if (score > highScore) {
    highScore = score // Actualiza el récord
    localStorage.setItem('hs', highScore) // Guarda en navegador (hs = highScore)
    elems.best.textContent = highScore // Actualiza en pantalla
  }

  // Muestra los resultados en la pantalla de game over
  elems.final.textContent = score
  elems.high.textContent = highScore
  elems.over.classList.remove('hidden') // Muestra la pantalla
}

// ========== ACTUALIZAR LÓGICA DEL JUEGO ==========
function update () {
  if (state !== 'playing') return // Solo actualiza si está jugando

  // ===== FÍSICA DEL PEZ =====
  fish.vy += cfg.gravity // Aplica gravedad (aumenta velocidad hacia abajo)
  fish.y += fish.vy // Actualiza posición según velocidad

  // Verifica si el pez tocó el suelo o el techo
  if (fish.y + fish.r > canvas.height || fish.y - fish.r < 0) return end()

  // ===== GENERAR TUBERÍAS =====
  // Cada cierto número de frames (spawn), crea una tubería nueva
  if (frame % cfg.spawn === 0) {
    // Calcula altura aleatoria para el hueco
    const h = 50 + Math.random() * (canvas.height - cfg.pipeGap - 100)
    // Añade tubería: x=inicio pantalla, t=top(arriba), b=bottom(abajo), s=scored(puntuado)
    pipes.push({ x: canvas.width, t: h, b: h + cfg.pipeGap, s: false })
  }

  // ===== ACTUALIZAR TUBERÍAS =====
  // Recorre todas las tuberías de atrás hacia adelante
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i] // p = pipe actual
    p.x -= cfg.speed // Mueve la tubería hacia la izquierda

    // ===== PUNTUACIÓN =====
    // Si el pez pasó la tubería y aún no se contó
    if (!p.s && p.x + cfg.pipeW < fish.x) {
      p.s = true // Marca como puntuada (s = scored)
      elems.current.textContent = ++score // Aumenta y muestra puntuación
    }

    // ===== ELIMINAR TUBERÍAS =====
    // Si la tubería salió completamente de la pantalla
    if (p.x + cfg.pipeW < 0) pipes.splice(i, 1) // La elimina del array
    // ===== DETECCIÓN DE COLISIÓN =====
    // Verifica si el pez está horizontalmente en la tubería
    else if (
      fish.x + fish.r > p.x &&
      fish.x - fish.r < p.x + cfg.pipeW &&
      // Y si verticalmente toca la tubería superior o inferior
      (fish.y - fish.r < p.t || fish.y + fish.r > p.b)
    )
      return end() // Game over
  }

  frame++ // Incrementa contador de frames
}

// ========== DIBUJAR EN PANTALLA ==========
function draw () {
  // ===== FONDO DEGRADADO (CIELO) =====
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height) // Crea degradado vertical
  g.addColorStop(0, '#87CEEB') // Azul claro arriba
  g.addColorStop(1, '#E0F6FF') // Azul casi blanco abajo
  ctx.fillStyle = g
  ctx.fillRect(0, 0, canvas.width, canvas.height) // Pinta todo el canvas

  // ===== TUBERÍAS =====
  ctx.fillStyle = '#0a0' // Verde oscuro para relleno
  ctx.strokeStyle = '#0f0' // Verde neón para borde
  ctx.lineWidth = 3

  // Dibuja cada tubería (superior e inferior)
  pipes.forEach(p => {
    // Tubería superior (desde arriba hasta p.t)
    ctx.fillRect(p.x, 0, cfg.pipeW, p.t)
    ctx.strokeRect(p.x, 0, cfg.pipeW, p.t)
    // Tubería inferior (desde p.b hasta el suelo)
    ctx.fillRect(p.x, p.b, cfg.pipeW, canvas.height - p.b)
    ctx.strokeRect(p.x, p.b, cfg.pipeW, canvas.height - p.b)
  })

  // ===== PEZ =====
  ctx.save() // Guarda el estado del contexto
  ctx.translate(fish.x, fish.y) // Mueve el origen al centro del pez
  // Rota según velocidad (cayendo = rota hacia abajo, subiendo = hacia arriba)
  ctx.rotate((Math.max(-30, Math.min(30, fish.vy * 3)) * Math.PI) / 180)

  // Cuerpo del pez (óvalo azul)
  ctx.fillStyle = '#00BFFF'
  ctx.beginPath()
  ctx.ellipse(0, 0, fish.r, fish.r * 0.8, 0, 0, Math.PI * 2) // Óvalo horizontal
  ctx.fill()
  ctx.strokeStyle = '#fff' // Borde blanco
  ctx.lineWidth = 2
  ctx.stroke()

  // Cola del pez (triángulo azul oscuro)
  ctx.fillStyle = '#0080FF'
  ctx.beginPath()
  ctx.moveTo(-fish.r, 0) // Punto de unión con el cuerpo
  ctx.lineTo(-fish.r - 8, -8) // Punta superior
  ctx.lineTo(-fish.r - 8, 8) // Punta inferior
  ctx.fill()

  // Ojo del pez (círculo blanco con pupila negra)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(7, -2, 4, 0, Math.PI * 2) // Parte blanca del ojo
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(8, -2, 2, 0, Math.PI * 2) // Pupila negra
  ctx.fill()

  ctx.restore() // Restaura el estado del contexto

  // ===== MENSAJE INICIAL =====
  // Solo se muestra cuando el juego está en estado 'ready'
  if (state === 'ready') {
    // Rectángulo oscuro semitransparente de fondo
    ctx.fillStyle = 'rgba(0,0,0,.7)'
    ctx.fillRect(50, 200, 300, 100)
    // Texto amarillo con instrucciones
    ctx.fillStyle = '#ff0'
    ctx.font = 'bold 20px Courier New'
    ctx.textAlign = 'center'
    ctx.fillText('Click o Espacio para empezar', 200, 240)
    ctx.fillText('¡Esquiva las tuberías!', 200, 270)
  }
}

// ========== LOOP PRINCIPAL Y EVENTOS ==========
// loop: función que se ejecuta 60 veces por segundo (60 FPS)
const loop = () => {
  update() // Actualiza la lógica del juego
  draw() // Dibuja todo en pantalla
  requestAnimationFrame(loop) // Llama a loop nuevamente en el próximo frame
}

// ===== EVENTOS DE USUARIO =====
// Click en canvas o toque en móvil: hace saltar al pez
canvas.onclick = canvas.ontouchstart = e => {
  e.preventDefault?.() // Previene scroll en móvil (? = si existe)
  jump()
}

// Teclas del teclado
document.onkeydown = e => {
  if (e.code === 'Space') {
    // Barra espaciadora: saltar
    e.preventDefault() // Previene scroll de página
    jump()
  }
  if (e.code === 'KeyR') reset() // Tecla R: reiniciar
}

// Botón de reiniciar en pantalla de game over
$('restartBtn').onclick = reset

loop() // Comienza el loop principal
