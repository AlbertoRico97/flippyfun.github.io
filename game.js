// ========== CONFIGURACIÓN INICIAL ==========
// Obtener el canvas del HTML y su 2D para dibujar
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

// Configuración del juego (cfg = config) - se actualizará según el nivel
const cfg = {
  gravity: 0.5, // Gravedad que afecta al pez
  jump: -9, // Fuerza del salto (negativo = hacia arriba)
  pipeW: 60, // Ancho de las tuberías (pipeW = pipeWidth)
  pipeGap: 150, // Espacio entre tubería superior e inferior
  speed: 2, // Velocidad de movimiento de tuberías
  spawn: 90 // Cada cuántos frames aparece una tubería
}

// Aplicar configuración del nivel actual
function applyLevelConfig() {
  const level = getCurrentLevel()
  const world = getCurrentWorld()
  if (level) {
    cfg.speed = level.pipeSpeed
    cfg.pipeGap = level.pipeGap
    cfg.spawn = level.spawnRate
  }
  // Actualizar información del mundo en pantalla
  updateWorldInfo()
}

// ========== VARIABLES DEL JUEGO ==========
// state: puede ser 'ready' (listo), 'playing' (jugando), 'gameOver' (fin)
// frame: contador de fotogramas para saber cuándo crear tuberías
// score: puntuación actual, highScore: mejor puntuación guardada
let state = 'ready',
  frame = 0,
  score = 0,
  highScore = localStorage.getItem('hs') || 0

// Personaje seleccionado (por defecto 'fish')
let selectedCharacter = localStorage.getItem('character') || 'fish'
let currentCharacter = getCharacter(selectedCharacter)

// fish: objeto con las propiedades del pez
// x,y: posición, r: radio (r = radius), vy: velocidad vertical
let fish = { x: 100, y: 300, r: currentCharacter.radius, vy: 0 }

// pipes: array que guarda todas las tuberías en pantalla
let pipes = []

// ========== SISTEMA DE HABILIDADES ==========
let abilityActive = false // Si la habilidad está activa
let abilityReady = true // Si la habilidad está lista para usar
let lastAbilityUse = 0 // Timestamp del último uso
let abilityEndTime = 0 // Cuando termina el efecto de la habilidad

// ========== SISTEMA DE JEFES ==========
let bossActive = false // Si el jefe está activo
let bossTriggered = false // Si ya se activó el jefe en este nivel
let boss = null // Objeto del jefe actual
const BOSS_TRIGGER_SCORE = 10 // Puntuación necesaria para que aparezca el jefe

// ========== SISTEMA DE ARMAS Y COMBATE ==========
let playerProjectiles = [] // Burbujas lanzadas por el jugador
let megaFlipActive = false // Si el power-up Mega Flip está activo
let megaFlipEndTime = 0 // Cuándo termina el Mega Flip
let powerUps = [] // Power-ups en pantalla
let canShoot = true // Control de disparo
let lastShootTime = 0 // Último disparo
const SHOOT_COOLDOWN = 300 // Cooldown entre disparos (ms)
const MEGA_FLIP_DURATION = 5000 // Duración del Mega Flip (5 segundos)
const MEGA_FLIP_MULTIPLIER = 1.8 // Multiplicador de altura del salto

// ========== ELEMENTOS DEL DOM ==========
// $ es una función auxiliar que hace más corto getElementById
const $ = id => document.getElementById(id)
// elems: objeto con referencias a elementos HTML que necesitamos actualizar
const elems = {
  over: $('gameOver'), // Pantalla de game over
  final: $('finalScore'), // Puntuación final
  high: $('highScore'), // Mejor puntuación en game over
  current: $('currentScore'), // Puntuación actual en pantalla
  best: $('bestScore'), // Mejor puntuación en pantalla principal
  charSelect: $('characterSelect'), // Menú de selección
  worldSelect: $('worldSelect'), // Menú de mundos
  worldOptions: $('worldOptions'), // Opciones de mundos
  worldInfo: $('worldInfo'), // Información del mundo actual
  gameWrapper: document.querySelector('.game-wrapper'), // Contenedor del juego
  controls: document.querySelector('.controls'), // Controles
  scoreDisplay: document.querySelector('.score-display'), // Puntuación
  muteBtn: $('muteBtn'), // Botón de silenciar
  worldMenuBtn: $('worldMenuBtn') // Botón de menú de mundos
}
// Mostrar el highScore guardado al cargar
elems.best.textContent = highScore

// ========== SONIDOS ==========
// Estado del audio (guardado en localStorage)
let isMuted = localStorage.getItem('muted') === 'true'

// Cargar el sonido de salto
const jumpSound = new Audio('assets/sounds/jump.mp3')
// Cargar el sonido de game over
const gameOverSound = new Audio('assets/sounds/game-over.mp3')

// Función para reproducir sonido solo si no está silenciado
const playSound = (sound) => {
  if (!isMuted) {
    sound.currentTime = 0
    sound.play().catch(() => {})
  }
}

// Función para alternar silencio
const toggleMute = () => {
  isMuted = !isMuted
  localStorage.setItem('muted', isMuted)
  updateMuteButton()
}

// Actualizar apariencia del botón de silencio
const updateMuteButton = () => {
  if (isMuted) {
    elems.muteBtn.classList.add('muted')
    elems.muteBtn.querySelector('.sound-icon').textContent = '🔇'
    elems.muteBtn.title = 'Activar sonido'
  } else {
    elems.muteBtn.classList.remove('muted')
    elems.muteBtn.querySelector('.sound-icon').textContent = '🔊'
    elems.muteBtn.title = 'Silenciar sonido'
  }
}

// ========== FUNCIONES DE CONTROL ==========
// jump: hace que el pez salte
const jump = () => {
  if (state === 'ready') state = 'playing' // Si está listo, empieza el juego
  if (state === 'playing') {
    // Si la medusa tiene la habilidad de caída lenta activa, el salto es más suave
    if (abilityActive && currentCharacter.hasSlowFall) {
      fish.vy = cfg.jump * 0.5 // Salto reducido al 50% para la medusa
    } else if (megaFlipActive) {
      fish.vy = cfg.jump * MEGA_FLIP_MULTIPLIER // Salto potenciado con Mega Flip
    } else {
      fish.vy = cfg.jump // Salto normal
    }
    playSound(jumpSound) // Reproduce el sonido usando la función playSound
  }
}

// useAbility: activa la habilidad especial del personaje
const useAbility = () => {
  if (state !== 'playing') return // Solo funciona cuando está jugando
  if (!currentCharacter.ability) return // Debe tener habilidad
  if (!abilityReady) return // Debe estar lista (sin cooldown)
  
  const now = Date.now()
  
  // Activar habilidad
  abilityActive = true
  abilityReady = false
  lastAbilityUse = now
  abilityEndTime = now + currentCharacter.ability.duration
  
  console.log('Habilidad activada!', { 
    abilityActive, 
    abilityEndTime, 
    now,
    character: currentCharacter.name,
    abilityType: currentCharacter.hasSlowFall ? 'slowFall' : 'breakPipes'
  })
  
  // Feedback visual - el tiburón brilla
  canvas.style.filter = 'brightness(1.3) saturate(1.5)'
  setTimeout(() => {
    canvas.style.filter = ''
  }, 100)
}

// shootBubble: dispara una burbuja
const shootBubble = () => {
  if (state !== 'playing') return
  
  const now = Date.now()
  if (!canShoot || now - lastShootTime < SHOOT_COOLDOWN) return
  
  // Crear proyectil
  playerProjectiles.push({
    x: fish.x + fish.r,
    y: fish.y,
    vx: 5,
    vy: 0,
    r: 8,
    damage: 1
  })
  
  canShoot = false
  lastShootTime = now
  
  // Permitir disparar de nuevo después del cooldown
  setTimeout(() => {
    canShoot = true
  }, SHOOT_COOLDOWN)
  
  console.log('Burbuja disparada!')
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
  
  // Reiniciar habilidad
  abilityActive = false
  abilityReady = true
  lastAbilityUse = 0
  abilityEndTime = 0
  
  // Reiniciar jefe
  bossActive = false
  bossTriggered = false
  boss = null
  breakEffects = []
  
  // Reiniciar armas y combate
  playerProjectiles = []
  megaFlipActive = false
  megaFlipEndTime = 0
  powerUps = []
  canShoot = true
  lastShootTime = 0
}

// end: termina el juego y muestra los resultados
const end = () => {
  state = 'gameOver' // Cambia estado a game over
  
  // Reproduce el sonido de game over usando playSound
  playSound(gameOverSound)

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

  // ===== ACTUALIZAR HABILIDAD =====
  const now = Date.now()
  // Desactivar habilidad cuando termina su duración
  if (abilityActive && now > abilityEndTime) {
    abilityActive = false
    console.log('Habilidad desactivada')
  }
  // Verificar si el cooldown terminó (solo si el personaje tiene habilidad)
  if (!abilityReady && currentCharacter.ability) {
    if (now - lastAbilityUse >= currentCharacter.ability.cooldown) {
      abilityReady = true
      console.log('Habilidad lista de nuevo!')
    }
  }

  // ===== FÍSICA DEL PEZ =====
  // Aplicar gravedad reducida si la medusa tiene la habilidad de caída lenta activa
  const currentGravity = (abilityActive && currentCharacter.hasSlowFall) ? cfg.gravity * 0.3 : cfg.gravity
  fish.vy += currentGravity // Aplica gravedad (aumenta velocidad hacia abajo)
  fish.y += fish.vy // Actualiza posición según velocidad

  // Verifica si el pez tocó el suelo o el techo
  if (fish.y + fish.r > canvas.height || fish.y - fish.r < 0) return end()

  // ===== GENERAR TUBERÍAS =====
  // Solo generar tuberías si el jefe NO está activo
  if (!bossActive && frame % cfg.spawn === 0) {
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
    if (p.x + cfg.pipeW < 0) {
      pipes.splice(i, 1) // La elimina del array
      continue // Continuar con la siguiente tubería
    }
    
    // ===== DETECCIÓN DE COLISIÓN =====
    // Verifica si el pez está horizontalmente en la tubería
    const isColliding = (
      fish.x + fish.r > p.x &&
      fish.x - fish.r < p.x + cfg.pipeW &&
      // Y si verticalmente toca la tubería superior o inferior
      (fish.y - fish.r < p.t || fish.y + fish.r > p.b)
    )
    
    if (isColliding) {
      // Si el tiburón tiene la habilidad activa, rompe la tubería
      if (abilityActive && currentCharacter.canBreakPipes) {
        console.log('Tubería rota!', { x: p.x, abilityActive })
        pipes.splice(i, 1) // Elimina la tubería
        score += 2 // Bonus por romper tubería
        elems.current.textContent = score
        // Efecto visual de explosión
        createPipeBreakEffect(p.x + cfg.pipeW / 2, fish.y)
        continue // No verificar más colisiones con esta tubería
      } else {
        return end() // Game over
      }
    }
  }

  // ===== SISTEMA DE JEFES =====
  // Activar jefe cuando se alcanza la puntuación necesaria
  if (!bossTriggered && score >= BOSS_TRIGGER_SCORE) {
    initBoss()
  }
  
  // Actualizar jefe si está activo
  if (bossActive && boss) {
    updateBoss()
  }
  
  // ===== SISTEMA DE ARMAS Y COMBATE =====
  // Actualizar proyectiles del jugador
  updatePlayerProjectiles()
  
  // Actualizar power-ups
  updatePowerUps()
  
  // Generar power-ups aleatoriamente
  if (frame % 300 === 0 && Math.random() < 0.3 && !bossActive) {
    spawnPowerUp()
  }
  
  // Desactivar Mega Flip si expiró
  if (megaFlipActive && Date.now() >= megaFlipEndTime) {
    megaFlipActive = false
    console.log('Mega Flip terminado')
  }

  frame++ // Incrementa contador de frames
}

// ========== EFECTOS VISUALES ==========
let breakEffects = [] // Array de efectos de tuberías rotas

// Crear efecto de tubería rota
function createPipeBreakEffect(x, y) {
  for (let i = 0; i < 8; i++) {
    breakEffects.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      maxLife: 30
    })
  }
}

// Actualizar efectos de partículas
function updateBreakEffects() {
  for (let i = breakEffects.length - 1; i >= 0; i--) {
    const effect = breakEffects[i]
    effect.x += effect.vx
    effect.y += effect.vy
    effect.vy += 0.3 // Gravedad en las partículas
    effect.life--
    
    if (effect.life <= 0) {
      breakEffects.splice(i, 1)
    }
  }
}

// Dibujar efectos de partículas
function drawBreakEffects() {
  breakEffects.forEach(effect => {
    const alpha = effect.life / effect.maxLife
    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`
    ctx.fillRect(effect.x - 3, effect.y - 3, 6, 6)
  })
}

// ========== SISTEMA DE ARMAS Y COMBATE ==========
// Actualizar proyectiles del jugador
function updatePlayerProjectiles() {
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const proj = playerProjectiles[i]
    proj.x += proj.vx
    proj.y += proj.vy
    
    // Eliminar si sale de pantalla
    if (proj.x > canvas.width + 50) {
      playerProjectiles.splice(i, 1)
      continue
    }
    
    // Colisión con tuberías
    for (let j = pipes.length - 1; j >= 0; j--) {
      const p = pipes[j]
      const hitPipe = (
        proj.x > p.x &&
        proj.x < p.x + cfg.pipeW &&
        (proj.y < p.t || proj.y > p.b)
      )
      
      if (hitPipe) {
        playerProjectiles.splice(i, 1)
        createPipeBreakEffect(proj.x, proj.y)
        break
      }
    }
    
    // Colisión con jefe
    if (bossActive && boss) {
      const dist = Math.hypot(proj.x - boss.x, proj.y - boss.y)
      if (dist < boss.width / 2 + proj.r) {
        boss.health -= proj.damage
        playerProjectiles.splice(i, 1)
        createPipeBreakEffect(proj.x, proj.y)
        console.log('¡Burbuja impactó al jefe!', boss.health, '/', boss.maxHealth)
        
        if (boss.health <= 0) {
          defeatBoss()
        }
        continue
      }
      
      // Colisión con proyectiles del jefe
      for (let k = boss.projectiles.length - 1; k >= 0; k--) {
        const bossProj = boss.projectiles[k]
        const dist = Math.hypot(proj.x - bossProj.x, proj.y - bossProj.y)
        if (dist < proj.r + bossProj.r) {
          playerProjectiles.splice(i, 1)
          boss.projectiles.splice(k, 1)
          createPipeBreakEffect(proj.x, proj.y)
          score += 1
          elems.current.textContent = score
          break
        }
      }
    }
  }
}

// Generar power-up
function spawnPowerUp() {
  const types = ['megaFlip']
  const type = types[Math.floor(Math.random() * types.length)]
  
  powerUps.push({
    type: type,
    x: canvas.width,
    y: 100 + Math.random() * (canvas.height - 200),
    r: 15,
    vx: -2
  })
  
  console.log('Power-up generado:', type)
}

// Actualizar power-ups
function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const pu = powerUps[i]
    pu.x += pu.vx
    
    // Eliminar si sale de pantalla
    if (pu.x < -50) {
      powerUps.splice(i, 1)
      continue
    }
    
    // Colisión con jugador
    const dist = Math.hypot(fish.x - pu.x, fish.y - pu.y)
    if (dist < fish.r + pu.r) {
      // Activar power-up
      if (pu.type === 'megaFlip') {
        megaFlipActive = true
        megaFlipEndTime = Date.now() + MEGA_FLIP_DURATION
        console.log('¡Mega Flip activado!')
      }
      
      powerUps.splice(i, 1)
      createPipeBreakEffect(pu.x, pu.y)
      score += 3
      elems.current.textContent = score
    }
  }
}

// Dibujar proyectiles del jugador
function drawPlayerProjectiles() {
  playerProjectiles.forEach(proj => {
    // Burbuja con efecto brillante
    ctx.save()
    
    // Sombra exterior
    ctx.shadowColor = 'rgba(0, 200, 255, 0.8)'
    ctx.shadowBlur = 10
    
    // Cuerpo de la burbuja
    ctx.fillStyle = 'rgba(100, 200, 255, 0.6)'
    ctx.strokeStyle = '#00BFFF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Brillo interior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(proj.x - proj.r / 3, proj.y - proj.r / 3, proj.r / 3, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  })
}

// Dibujar power-ups
function drawPowerUps() {
  powerUps.forEach(pu => {
    ctx.save()
    
    // Efecto pulsante
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.2
    const size = pu.r * pulse
    
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
    ctx.shadowBlur = 15
    
    if (pu.type === 'megaFlip') {
      // Icono de Mega Flip (estrella dorada)
      ctx.fillStyle = '#FFD700'
      ctx.strokeStyle = '#FFA500'
      ctx.lineWidth = 3
      
      // Dibujar estrella
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const x = pu.x + Math.cos(angle) * size
        const y = pu.y + Math.sin(angle) * size
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      // Flecha hacia arriba en el centro
      ctx.fillStyle = '#FF0'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('↑', pu.x, pu.y)
    }
    
    ctx.restore()
  })
}

// ========== SISTEMA DE JEFES ==========
// Inicializar jefe
function initBoss() {
  const world = getCurrentWorld()
  const bossData = world.boss
  
  bossTriggered = true
  bossActive = true
  
  // Crear objeto del jefe basado en el patrón
  boss = {
    name: bossData.name,
    health: bossData.health,
    maxHealth: bossData.health,
    pattern: bossData.pattern,
    x: canvas.width - 100,
    y: canvas.height / 2,
    width: 80,
    height: 80,
    vx: 0,
    vy: 2,
    frame: 0,
    projectiles: [] // Proyectiles del jefe
  }
  
  // Detener generación de tuberías cuando aparece el jefe
  pipes = []
  
  console.log('¡Jefe apareció!', boss.name)
}

// Actualizar jefe
function updateBoss() {
  if (!boss) return
  
  boss.frame++
  
  // Movimiento según el patrón
  switch(boss.pattern) {
    case 'basic':
      // Movimiento vertical simple
      boss.y += boss.vy
      if (boss.y <= 50 || boss.y >= canvas.height - 50) {
        boss.vy *= -1
      }
      // Disparar burbujas cada cierto tiempo
      if (boss.frame % 60 === 0) {
        boss.projectiles.push({
          x: boss.x,
          y: boss.y,
          vx: -3,
          vy: 0,
          r: 10
        })
      }
      break
      
    case 'tentacles':
      // Movimiento en forma de onda
      boss.y = canvas.height / 2 + Math.sin(boss.frame * 0.05) * 100
      // Disparar múltiples proyectiles
      if (boss.frame % 80 === 0) {
        for (let i = -1; i <= 1; i++) {
          boss.projectiles.push({
            x: boss.x,
            y: boss.y,
            vx: -3,
            vy: i * 2,
            r: 12
          })
        }
      }
      break
      
    case 'whirlpool':
      // Movimiento circular
      boss.x = canvas.width - 100 + Math.cos(boss.frame * 0.03) * 50
      boss.y = canvas.height / 2 + Math.sin(boss.frame * 0.03) * 100
      // Disparar en espiral
      if (boss.frame % 40 === 0) {
        const angle = boss.frame * 0.1
        boss.projectiles.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * -4,
          vy: Math.sin(angle) * 4,
          r: 10
        })
      }
      break
      
    case 'mechanical':
      // Movimiento agresivo
      boss.y += boss.vy
      if (boss.y <= 100 || boss.y >= canvas.height - 100) {
        boss.vy *= -1
      }
      // Disparar ráfagas
      if (boss.frame % 50 === 0) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            boss.projectiles.push({
              x: boss.x,
              y: boss.y,
              vx: -5,
              vy: (Math.random() - 0.5) * 3,
              r: 8
            })
          }, i * 100)
        }
      }
      break
      
    case 'final':
      // Movimiento complejo del jefe final
      boss.x = canvas.width - 100 + Math.cos(boss.frame * 0.02) * 30
      boss.y = canvas.height / 2 + Math.sin(boss.frame * 0.04) * 120
      // Múltiples patrones de ataque
      if (boss.frame % 30 === 0) {
        // Patrón circular
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          boss.projectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * -3,
            vy: Math.sin(angle) * 3,
            r: 12
          })
        }
      }
      break
  }
  
  // Actualizar proyectiles del jefe
  for (let i = boss.projectiles.length - 1; i >= 0; i--) {
    const proj = boss.projectiles[i]
    proj.x += proj.vx
    proj.y += proj.vy
    
    // Eliminar proyectiles fuera de pantalla
    if (proj.x < -50 || proj.y < -50 || proj.y > canvas.height + 50) {
      boss.projectiles.splice(i, 1)
      continue
    }
    
    // Colisión con el jugador
    const dist = Math.hypot(fish.x - proj.x, fish.y - proj.y)
    if (dist < fish.r + proj.r) {
      // Si tiene habilidad activa de romper, puede destruir proyectiles
      if (abilityActive && currentCharacter.canBreakPipes) {
        boss.projectiles.splice(i, 1)
        score += 1
        elems.current.textContent = score
        createPipeBreakEffect(proj.x, proj.y)
      } else {
        return end() // Game over
      }
    }
  }
  
  // Colisión del jugador con el jefe (si el jugador usa habilidad)
  const dist = Math.hypot(fish.x - boss.x, fish.y - boss.y)
  if (dist < fish.r + boss.width / 2) {
    // Daño con habilidad especial
    if (abilityActive && currentCharacter.canBreakPipes) {
      boss.health--
      console.log('¡Golpe al jefe con habilidad!', boss.health, '/', boss.maxHealth)
      createPipeBreakEffect(boss.x, boss.y)
      
      if (boss.health <= 0) {
        defeatBoss()
      }
    }
  }
}

// Jefe derrotado
function defeatBoss() {
  console.log('¡Jefe derrotado!')
  score += 20 // Bonus por derrotar al jefe
  elems.current.textContent = score
  bossActive = false
  
  // Crear muchas partículas de victoria
  for (let i = 0; i < 30; i++) {
    createPipeBreakEffect(
      canvas.width - 100 + (Math.random() - 0.5) * 100,
      canvas.height / 2 + (Math.random() - 0.5) * 100
    )
  }
  
  // Guardar referencia al nombre del jefe antes de eliminarlo
  const bossName = boss.name
  boss = null
  
  // Mostrar mensaje de victoria
  state = 'bossDefeated'
  setTimeout(() => {
    state = 'ready'
  }, 2000)
  
  // Desbloquear siguiente mundo y avanzar automáticamente
  unlockAndAdvanceToNextWorld()
}

// Dibujar jefe
function drawBoss() {
  if (!boss) return
  
  const world = getCurrentWorld()
  
  // Dibujar cuerpo del jefe
  ctx.save()
  
  // Sombra
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 20
  
  // Color según el mundo
  ctx.fillStyle = world.pipeColor.fill
  ctx.strokeStyle = world.pipeColor.stroke
  ctx.lineWidth = 4
  
  // Forma según el patrón
  switch(boss.pattern) {
    case 'basic':
      // Forma cuadrada simple
      ctx.fillRect(boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height)
      ctx.strokeRect(boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height)
      break
      
    case 'tentacles':
      // Forma con tentáculos
      ctx.beginPath()
      ctx.arc(boss.x, boss.y, boss.width / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Dibujar tentáculos animados
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + boss.frame * 0.05
        const tx = boss.x + Math.cos(angle) * 40
        const ty = boss.y + Math.sin(angle) * 40
        ctx.beginPath()
        ctx.moveTo(boss.x, boss.y)
        ctx.lineTo(tx, ty)
        ctx.lineWidth = 6
        ctx.stroke()
      }
      break
      
    case 'whirlpool':
      // Forma de remolino
      ctx.beginPath()
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2 + boss.frame * 0.1
        const radius = boss.width / 2 + Math.sin(i + boss.frame * 0.1) * 10
        const x = boss.x + Math.cos(angle) * radius
        const y = boss.y + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
      
    case 'mechanical':
      // Forma mecánica con engranajes
      ctx.fillRect(boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height)
      ctx.strokeRect(boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height)
      // Engranajes giratorios
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + boss.frame * 0.1
        const gx = boss.x + Math.cos(angle) * 25
        const gy = boss.y + Math.sin(angle) * 25
        ctx.fillRect(gx - 5, gy - 5, 10, 10)
      }
      break
      
    case 'final':
      // Forma compleja del jefe final
      ctx.beginPath()
      ctx.arc(boss.x, boss.y, boss.width / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Aura pulsante
      ctx.strokeStyle = '#ff0'
      ctx.lineWidth = 2
      ctx.beginPath()
      const auraRadius = boss.width / 2 + Math.sin(boss.frame * 0.1) * 15
      ctx.arc(boss.x, boss.y, auraRadius, 0, Math.PI * 2)
      ctx.stroke()
      break
  }
  
  ctx.restore()
  
  // Dibujar barra de vida
  const barWidth = 100
  const barHeight = 8
  const barX = boss.x - barWidth / 2
  const barY = boss.y - boss.height / 2 - 20
  
  // Fondo de la barra
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(barX, barY, barWidth, barHeight)
  
  // Vida restante
  const healthPercent = boss.health / boss.maxHealth
  ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00'
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)
  
  // Borde
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(barX, barY, barWidth, barHeight)
  
  // Nombre del jefe
  ctx.fillStyle = '#ff0'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(boss.name, boss.x, barY - 5)
  
  // Dibujar proyectiles
  boss.projectiles.forEach(proj => {
    ctx.fillStyle = '#f00'
    ctx.beginPath()
    ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ff0'
    ctx.lineWidth = 2
    ctx.stroke()
  })
}

// ========== DIBUJAR EN PANTALLA ==========
function draw () {
  // ===== FONDO DEGRADADO SEGÚN EL MUNDO =====
  const world = getCurrentWorld()
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height) // Crea degradado vertical
  g.addColorStop(0, world.backgroundColor.top) // Color superior del mundo
  g.addColorStop(1, world.backgroundColor.bottom) // Color inferior del mundo
  ctx.fillStyle = g
  ctx.fillRect(0, 0, canvas.width, canvas.height) // Pinta todo el canvas

  // ===== TUBERÍAS CON COLORES DEL MUNDO =====
  ctx.fillStyle = world.pipeColor.fill // Color de relleno del mundo
  ctx.strokeStyle = world.pipeColor.stroke // Color de borde del mundo
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

  // ===== DIBUJAR PERSONAJE SEGÚN SELECCIÓN =====
  const rotation = (Math.max(-30, Math.min(30, fish.vy * 3)) * Math.PI) / 180
  
  // Efecto visual de Mega Flip
  if (megaFlipActive) {
    ctx.save()
    ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.3
    
    // Estrellas doradas giratorias
    const starTime = Date.now() / 200
    for (let i = 0; i < 3; i++) {
      const angle = starTime + (i * Math.PI * 2) / 3
      const distance = fish.r + 15 + Math.sin(Date.now() / 150) * 5
      const sx = fish.x + Math.cos(angle) * distance
      const sy = fish.y + Math.sin(angle) * distance
      
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⭐', sx, sy)
    }
    
    ctx.restore()
  }
  
  // Efecto visual cuando la habilidad está activa
  if (abilityActive) {
    ctx.save()
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 50) * 0.2
    
    // Color del aura según el personaje
    if (currentCharacter.hasSlowFall) {
      // Aura rosa/púrpura para la medusa
      ctx.strokeStyle = '#FF69B4'
      // Burbujas flotantes
      const bubbleTime = Date.now() / 100
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(255, 105, 180, ${0.3 + Math.sin(bubbleTime + i) * 0.2})`
        ctx.beginPath()
        ctx.arc(
          fish.x + Math.sin(bubbleTime + i * 2) * 15,
          fish.y - 10 - i * 10 + Math.sin(bubbleTime + i) * 5,
          3 + i,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
    } else {
      // Aura dorada para el tiburón
      ctx.strokeStyle = '#FF0'
    }
    
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(fish.x, fish.y, fish.r + 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  
  currentCharacter.draw(ctx, fish.x, fish.y, rotation)
  
  // ===== DIBUJAR PROYECTILES Y POWER-UPS =====
  drawPlayerProjectiles()
  drawPowerUps()
  
  // ===== DIBUJAR JEFE SI ESTÁ ACTIVO =====
  if (bossActive && boss) {
    drawBoss()
  }
  
  // Dibujar efectos de tuberías rotas
  drawBreakEffects()
  
  // ===== INDICADOR DE HABILIDAD =====
  if (currentCharacter.ability && state !== 'ready') {
    const now = Date.now()
    const cooldownProgress = Math.min(1, (now - lastAbilityUse) / currentCharacter.ability.cooldown)
    
    // Fondo del indicador
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(10, 10, 100, 30)
    
    // Barra de cooldown (color según personaje)
    if (currentCharacter.hasSlowFall) {
      ctx.fillStyle = abilityReady ? '#FF69B4' : '#666'
    } else {
      ctx.fillStyle = abilityReady ? '#0f0' : '#666'
    }
    ctx.fillRect(15, 15, 90 * cooldownProgress, 20)
    
    // Borde
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 100, 30)
    
    // Texto
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px Courier New'
    ctx.fillText(abilityReady ? '⚡ LISTO' : '⏱ ' + Math.ceil((currentCharacter.ability.cooldown - (now - lastAbilityUse)) / 1000) + 's', 20, 30)
  }
  
  // ===== INDICADORES DE COMBATE =====
  if (state !== 'ready') {
    let yOffset = currentCharacter.ability ? 50 : 10
    
    // Indicador de disparo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(10, yOffset, 100, 25)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(10, yOffset, 100, 25)
    ctx.fillStyle = canShoot ? '#00BFFF' : '#666'
    ctx.font = 'bold 11px Courier New'
    ctx.fillText(canShoot ? '💧 LISTO' : '⏱ ' + Math.ceil((SHOOT_COOLDOWN - (Date.now() - lastShootTime)) / 1000) + 's', 20, yOffset + 17)
    
    yOffset += 30
    
    // Indicador de Mega Flip
    if (megaFlipActive) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'
      ctx.fillRect(10, yOffset, 100, 25)
      ctx.strokeStyle = '#FFA500'
      ctx.lineWidth = 2
      ctx.strokeRect(10, yOffset, 100, 25)
      ctx.fillStyle = '#000'
      ctx.font = 'bold 11px Courier New'
      const timeLeft = Math.ceil((megaFlipEndTime - Date.now()) / 1000)
      ctx.fillText('⭐ ' + timeLeft + 's', 20, yOffset + 17)
    }
  }

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
  
  // ===== MENSAJE DE APARICIÓN DE JEFE =====
  if (bossActive && boss && boss.frame < 120) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
    ctx.fillRect(50, 250, 300, 80)
    ctx.fillStyle = '#ff0'
    ctx.font = 'bold 24px Courier New'
    ctx.textAlign = 'center'
    ctx.fillText('¡JEFE APARECIÓ!', 200, 280)
    ctx.font = 'bold 18px Courier New'
    ctx.fillText(boss.name, 200, 310)
  }
  
  // ===== MENSAJE DE VICTORIA =====
  if (state === 'bossDefeated') {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'
    ctx.fillRect(50, 200, 300, 120)
    ctx.fillStyle = '#ff0'
    ctx.font = 'bold 28px Courier New'
    ctx.textAlign = 'center'
    ctx.fillText('¡JEFE DERROTADO!', 200, 240)
    ctx.font = 'bold 20px Courier New'
    ctx.fillText('🎉 VICTORIA 🎉', 200, 270)
    
    const nextWorldIndex = currentWorldIndex + 1
    if (nextWorldIndex < getAllWorlds().length) {
      ctx.font = 'bold 16px Courier New'
      ctx.fillStyle = '#fff'
      ctx.fillText('Avanzando al siguiente mundo...', 200, 300)
    } else {
      ctx.font = 'bold 16px Courier New'
      ctx.fillStyle = '#fff'
      ctx.fillText('¡Has completado el juego!', 200, 300)
    }
  }
}

// ========== LOOP PRINCIPAL Y EVENTOS ==========
// loop: función que se ejecuta 60 veces por segundo (60 FPS)
const loop = () => {
  update() // Actualiza la lógica del juego
  updateBreakEffects() // Actualiza efectos de partículas
  draw() // Dibuja todo en pantalla
  requestAnimationFrame(loop) // Llama a loop nuevamente en el próximo frame
}

// ========== MENÚ DE SELECCIÓN DE PERSONAJE ==========
// Mostrar/ocultar menú de selección
function showCharacterSelect() {
  elems.charSelect.classList.remove('hidden')
  elems.gameWrapper.style.display = 'none'
  elems.controls.style.display = 'none'
  elems.scoreDisplay.style.display = 'none'
}

function hideCharacterSelect() {
  elems.charSelect.classList.add('hidden')
  elems.gameWrapper.style.display = 'block'
  elems.controls.style.display = 'flex'
  elems.scoreDisplay.style.display = 'flex'
}

// ========== MENÚ DE MUNDOS ==========
// Mostrar menú de mundos
function showWorldSelect() {
  elems.worldSelect.classList.remove('hidden')
  elems.gameWrapper.style.display = 'none'
  elems.controls.style.display = 'none'
  elems.scoreDisplay.style.display = 'none'
  elems.charSelect.classList.add('hidden')
  generateWorldOptions()
}

// Ocultar menú de mundos
function hideWorldSelect() {
  elems.worldSelect.classList.add('hidden')
  elems.gameWrapper.style.display = 'block'
  elems.controls.style.display = 'flex'
  elems.scoreDisplay.style.display = 'flex'
}

// Generar opciones de mundos
function generateWorldOptions() {
  const worlds = getAllWorlds()
  const progress = JSON.parse(localStorage.getItem('gameProgress') || '{"unlockedWorlds":[0],"completedWorlds":[]}')
  console.log('Progreso actual:', progress)
  elems.worldOptions.innerHTML = ''
  
  worlds.forEach((world, index) => {
    const isUnlocked = isWorldUnlocked(index)
    console.log(`Mundo ${index} (${world.name}):`, isUnlocked ? 'Desbloqueado' : 'Bloqueado')
    const card = document.createElement('div')
    card.className = `world-card ${isUnlocked ? '' : 'locked'}`
    
    card.innerHTML = `
      <h3>${world.id}. ${world.name}</h3>
      <p>🎨 ${world.theme}</p>
      <p>📍 ${world.levels[0].name}</p>
      <p class="boss-name">👾 Jefe: ${world.boss.name}</p>
      ${isUnlocked ? '' : '<p style="color: #f00;">🔒 Bloqueado</p>'}
    `
    
    if (isUnlocked) {
      card.onclick = () => {
        selectWorld(index)
        hideWorldSelect()
        applyLevelConfig()
        reset()
      }
    }
    
    elems.worldOptions.appendChild(card)
  })
}

// Actualizar información del mundo en pantalla
function updateWorldInfo() {
  const world = getCurrentWorld()
  const level = getCurrentLevel()
  if (elems.worldInfo) {
    elems.worldInfo.textContent = `🗺️ ${world.name} - ${level.name}`
  }
}

// Dibujar previsualizaciones de personajes en el menú
function drawCharacterPreviews() {
  const allCharacters = getAllCharacters()
  
  allCharacters.forEach(char => {
    const canvasId = char.id + 'Preview'
    const canvas = $(canvasId)
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Dibujar fondo
    drawPreviewBackground(ctx, canvas.width, canvas.height)
    
    // Dibujar personaje
    char.drawPreview(ctx, 60, 60)
  })
}

// Seleccionar personaje
function selectCharacter(character) {
  selectedCharacter = character
  currentCharacter = getCharacter(character)
  fish.r = currentCharacter.radius // Actualizar radio del personaje
  localStorage.setItem('character', character)
  hideCharacterSelect()
  reset()
  
  // Mostrar/ocultar control de habilidad según el personaje
  const abilityControl = $('abilityControl')
  if (abilityControl) {
    abilityControl.style.display = currentCharacter.ability ? 'block' : 'none'
  }
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
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
    // Shift o E: usar habilidad
    e.preventDefault()
    console.log('Tecla de habilidad presionada:', e.code)
    useAbility()
  }
  if (e.code === 'KeyW') {
    // W: disparar burbuja
    e.preventDefault()
    shootBubble()
  }
}

// Botón de reiniciar en pantalla de game over
$('restartBtn').onclick = reset

// Botón de cambiar personaje
$('changeCharBtn').onclick = () => {
  showCharacterSelect()
  elems.over.classList.add('hidden')
}

// Botón de menú de mundos
elems.worldMenuBtn.onclick = () => {
  showWorldSelect()
}

// Botón de silenciar/activar sonido
elems.muteBtn.onclick = toggleMute

// Eventos de selección de personaje
document.querySelectorAll('.character-card').forEach(card => {
  card.querySelector('.select-btn').onclick = (e) => {
    e.stopPropagation()
    const character = card.dataset.character
    selectCharacter(character)
  }
})

// ========== INICIALIZACIÓN ==========
// Actualizar estado del botón de silencio
updateMuteButton()

// Aplicar configuración del nivel actual
applyLevelConfig()
updateWorldInfo()

// Dibujar previsualizaciones
drawCharacterPreviews()

// Mostrar control de habilidad si el personaje tiene habilidad
const abilityControl = $('abilityControl')
if (abilityControl && currentCharacter.ability) {
  abilityControl.style.display = 'block'
}

// Si no hay personaje guardado, mostrar menú de selección
if (!localStorage.getItem('character')) {
  showCharacterSelect()
} else {
  hideCharacterSelect()
}

loop() // Comienza el loop principal