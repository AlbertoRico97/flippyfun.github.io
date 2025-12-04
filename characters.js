// ========== MÓDULO DE PERSONAJES ==========
// Este archivo contiene toda la lógica de creación y dibujo de los personajes del juego

// ========== PERSONAJE: PEZ ORDINARIO ==========
const fishCharacter = {
  id: 'fish',
  name: 'Pez Ordinario',
  description: '🐟 Rápido y ágil',
  radius: 15,
  canBreakPipes: false, // No puede romper tuberías
  ability: null, // Sin habilidad especial
  
  // Función para dibujar el pez en el canvas del juego
  draw(ctx, x, y, rotation) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    // Cuerpo del pez (óvalo azul)
    ctx.fillStyle = '#00BFFF'
    ctx.beginPath()
    ctx.ellipse(0, 0, this.radius, this.radius * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Cola del pez (triángulo azul oscuro)
    ctx.fillStyle = '#0080FF'
    ctx.beginPath()
    ctx.moveTo(-this.radius, 0)
    ctx.lineTo(-this.radius - 8, -8)
    ctx.lineTo(-this.radius - 8, 8)
    ctx.fill()

    // Ojo del pez (círculo blanco con pupila negra)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(7, -2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(8, -2, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  },
  
  // Función para dibujar la preview en el menú de selección
  drawPreview(ctx, centerX, centerY, scale = 2) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    
    ctx.fillStyle = '#00BFFF'
    ctx.beginPath()
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.fillStyle = '#0080FF'
    ctx.beginPath()
    ctx.moveTo(-15, 0)
    ctx.lineTo(-23, -8)
    ctx.lineTo(-23, 8)
    ctx.fill()
    
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(7, -2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(8, -2, 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }
}

// ========== PERSONAJE: TIBURÓN PIXEL ART ==========
const sharkCharacter = {
  id: 'shark',
  name: 'Tiburón',
  description: '🦈 Poderoso y temible',
  radius: 18, // Un poco más grande que el pez
  canBreakPipes: true, // Puede romper tuberías
  ability: {
    name: 'Romper Tuberías',
    cooldown: 5000, // 5 segundos de cooldown
    duration: 5000 // Duración del efecto (5 segundos)
  },
  
  // Función para dibujar el tiburón en el canvas del juego
  draw(ctx, x, y, rotation) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    
    const s = 1.2 // Escala del tiburón
    
    // Cuerpo principal (azul claro con tonos pixel)
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(-12*s, -8*s, 24*s, 16*s) // Cuerpo central
    
    // Nariz/hocico puntiagudo
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(12*s, -5*s, 6*s, 10*s) // Extensión frontal
    ctx.fillRect(18*s, -3*s, 3*s, 6*s) // Punta de la nariz
    
    // Sombra inferior del cuerpo (más oscuro)
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(-12*s, 4*s, 24*s, 4*s)
    ctx.fillRect(12*s, 2*s, 6*s, 3*s)
    
    // Vientre blanco
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(-8*s, 5*s, 16*s, 3*s)
    
    // Cola en forma de media luna
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(-18*s, -6*s, 6*s, 12*s) // Base cola
    ctx.fillRect(-21*s, -8*s, 3*s, 4*s) // Aleta superior cola
    ctx.fillRect(-21*s, 4*s, 3*s, 4*s) // Aleta inferior cola
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(-18*s, 3*s, 6*s, 3*s) // Sombra cola
    
    // Aleta dorsal (arriba)
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(-3*s, -12*s, 6*s, 4*s) // Base aleta
    ctx.fillRect(-1*s, -16*s, 3*s, 4*s) // Punta aleta
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(-3*s, -12*s, 6*s, 1*s) // Sombra
    
    // Aletas pectorales (lados)
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(3*s, 8*s, 6*s, 4*s) // Aleta lateral derecha
    ctx.fillRect(-9*s, 8*s, 6*s, 4*s) // Aleta lateral izquierda
    
    // Ojo (redondo blanco con pupila negra)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(10*s, -6*s, 5*s, 5*s) // Parte blanca
    ctx.fillStyle = '#000000'
    ctx.fillRect(12*s, -4*s, 2*s, 2*s) // Pupila
    
    // Branquias (líneas)
    ctx.fillStyle = '#2980B9'
    ctx.fillRect(5*s, -2*s, 1*s, 4*s)
    ctx.fillRect(7*s, -2*s, 1*s, 4*s)
    ctx.fillRect(9*s, -2*s, 1*s, 4*s)
    
    // Borde pixel art (contorno negro)
    ctx.strokeStyle = '#1A5276'
    ctx.lineWidth = 0.5
    ctx.strokeRect(-12*s, -8*s, 24*s, 16*s)
    ctx.strokeRect(12*s, -5*s, 6*s, 10*s)
    ctx.strokeRect(-18*s, -6*s, 6*s, 12*s)
    
    // Dientes blancos (opcional, para más detalle)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(18*s, 0, 2*s, 1*s)
    ctx.fillRect(16*s, 1*s, 2*s, 1*s)
    
    ctx.restore()
  },
  
  // Función para dibujar la preview en el menú de selección
  drawPreview(ctx, centerX, centerY, scale = 1.5) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    
    const s = 1.2
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(-12*s, -8*s, 24*s, 16*s)
    ctx.fillRect(12*s, -5*s, 6*s, 10*s)
    ctx.fillRect(18*s, -3*s, 3*s, 6*s)
    
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(-12*s, 4*s, 24*s, 4*s)
    ctx.fillRect(12*s, 2*s, 6*s, 3*s)
    
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(-8*s, 5*s, 16*s, 3*s)
    
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(-18*s, -6*s, 6*s, 12*s)
    ctx.fillRect(-21*s, -8*s, 3*s, 4*s)
    ctx.fillRect(-21*s, 4*s, 3*s, 4*s)
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(-18*s, 3*s, 6*s, 3*s)
    
    ctx.fillStyle = '#4DB8E8'
    ctx.fillRect(-3*s, -12*s, 6*s, 4*s)
    ctx.fillRect(-1*s, -16*s, 3*s, 4*s)
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(-3*s, -12*s, 6*s, 1*s)
    
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(3*s, 8*s, 6*s, 4*s)
    ctx.fillRect(-9*s, 8*s, 6*s, 4*s)
    
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(10*s, -6*s, 5*s, 5*s)
    ctx.fillStyle = '#000000'
    ctx.fillRect(12*s, -4*s, 2*s, 2*s)
    
    ctx.fillStyle = '#2980B9'
    ctx.fillRect(5*s, -2*s, 1*s, 4*s)
    ctx.fillRect(7*s, -2*s, 1*s, 4*s)
    ctx.fillRect(9*s, -2*s, 1*s, 4*s)
    
    ctx.restore()
  }
}

// ========== PERSONAJE: MEDUSA ==========
const jellyfishCharacter = {
  id: 'jellyfish',
  name: 'Medusa',
  description: '🪼 Flota suavemente',
  radius: 16,
  canBreakPipes: false, // No puede romper tuberías
  ability: {
    name: 'Flotación Lenta',
    cooldown: 4000, // 4 segundos de cooldown
    duration: 6000 // Duración del efecto (6 segundos)
  },
  hasSlowFall: true, // Habilidad especial: caída lenta
  
  // Función para dibujar la medusa en el canvas del juego
  draw(ctx, x, y, rotation) {
    ctx.save()
    ctx.translate(x, y)
    // La medusa no rota tanto como otros personajes
    ctx.rotate(rotation * 0.3)
    
    const s = 1.1 // Escala
    
    // Campana/cuerpo superior (rosa claro)
    ctx.fillStyle = '#FFB6D9'
    ctx.beginPath()
    ctx.arc(0, -4*s, 12*s, Math.PI, 0, false)
    ctx.fill()
    
    // Detalles de la campana (rosa más oscuro)
    ctx.fillStyle = '#FF8FC7'
    ctx.beginPath()
    ctx.arc(0, -4*s, 9*s, Math.PI, 0, false)
    ctx.fill()
    
    // Parte inferior de la campana
    ctx.fillStyle = '#FFB6D9'
    ctx.fillRect(-12*s, -4*s, 24*s, 6*s)
    
    // Borde ondulado inferior
    ctx.fillStyle = '#FF8FC7'
    for (let i = -12; i < 12; i += 4) {
      ctx.beginPath()
      ctx.arc(i*s, 2*s, 2*s, 0, Math.PI, false)
      ctx.fill()
    }
    
    // Tentáculos (4 tentáculos ondulados)
    ctx.strokeStyle = '#FFB6D9'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    
    // Animación de tentáculos (usando Date.now() para movimiento)
    const time = Date.now() / 200
    
    // Tentáculo 1 (izquierda)
    ctx.beginPath()
    ctx.moveTo(-8*s, 2*s)
    ctx.quadraticCurveTo(-10*s, 8*s + Math.sin(time) * 2, -7*s, 14*s)
    ctx.stroke()
    
    // Tentáculo 2 (centro-izquierda)
    ctx.beginPath()
    ctx.moveTo(-3*s, 2*s)
    ctx.quadraticCurveTo(-4*s, 9*s + Math.sin(time + 1) * 2, -2*s, 16*s)
    ctx.stroke()
    
    // Tentáculo 3 (centro-derecha)
    ctx.beginPath()
    ctx.moveTo(3*s, 2*s)
    ctx.quadraticCurveTo(4*s, 9*s + Math.sin(time + 2) * 2, 2*s, 16*s)
    ctx.stroke()
    
    // Tentáculo 4 (derecha)
    ctx.beginPath()
    ctx.moveTo(8*s, 2*s)
    ctx.quadraticCurveTo(10*s, 8*s + Math.sin(time + 3) * 2, 7*s, 14*s)
    ctx.stroke()
    
    // Ojos (dos puntitos negros)
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(-4*s, -2*s, 1.5*s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(4*s, -2*s, 1.5*s, 0, Math.PI * 2)
    ctx.fill()
    
    // Manchas en la campana (decoración)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.arc(-5*s, -6*s, 2*s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(3*s, -7*s, 1.5*s, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  },
  
  // Función para dibujar la preview en el menú de selección
  drawPreview(ctx, centerX, centerY, scale = 1.8) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    
    const s = 1.1
    
    // Campana/cuerpo superior
    ctx.fillStyle = '#FFB6D9'
    ctx.beginPath()
    ctx.arc(0, -4*s, 12*s, Math.PI, 0, false)
    ctx.fill()
    
    ctx.fillStyle = '#FF8FC7'
    ctx.beginPath()
    ctx.arc(0, -4*s, 9*s, Math.PI, 0, false)
    ctx.fill()
    
    ctx.fillStyle = '#FFB6D9'
    ctx.fillRect(-12*s, -4*s, 24*s, 6*s)
    
    ctx.fillStyle = '#FF8FC7'
    for (let i = -12; i < 12; i += 4) {
      ctx.beginPath()
      ctx.arc(i*s, 2*s, 2*s, 0, Math.PI, false)
      ctx.fill()
    }
    
    // Tentáculos estáticos para preview
    ctx.strokeStyle = '#FFB6D9'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    
    ctx.beginPath()
    ctx.moveTo(-8*s, 2*s)
    ctx.quadraticCurveTo(-10*s, 8*s, -7*s, 14*s)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(-3*s, 2*s)
    ctx.quadraticCurveTo(-4*s, 9*s, -2*s, 16*s)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(3*s, 2*s)
    ctx.quadraticCurveTo(4*s, 9*s, 2*s, 16*s)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(8*s, 2*s)
    ctx.quadraticCurveTo(10*s, 8*s, 7*s, 14*s)
    ctx.stroke()
    
    // Ojos
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(-4*s, -2*s, 1.5*s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(4*s, -2*s, 1.5*s, 0, Math.PI * 2)
    ctx.fill()
    
    // Manchas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.arc(-5*s, -6*s, 2*s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(3*s, -7*s, 1.5*s, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }
}

// ========== REGISTRO DE PERSONAJES ==========
// Objeto que contiene todos los personajes disponibles
const characters = {
  fish: fishCharacter,
  shark: sharkCharacter,
  jellyfish: jellyfishCharacter
}

// ========== FUNCIÓN PARA OBTENER UN PERSONAJE ==========
function getCharacter(characterId) {
  return characters[characterId] || characters.fish // Por defecto devuelve el pez
}

// ========== FUNCIÓN PARA OBTENER TODOS LOS PERSONAJES ==========
function getAllCharacters() {
  return Object.values(characters)
}

// ========== FUNCIÓN PARA DIBUJAR FONDO DE PREVIEW ==========
function drawPreviewBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#87CEEB')
  gradient.addColorStop(1, '#E0F6FF')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
