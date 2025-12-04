// ========== SISTEMA DE NIVELES Y MUNDOS ==========
// Este archivo contiene la configuración de todos los mundos, niveles y jefes del juego

// ========== DEFINICIÓN DE MUNDOS ==========
const worlds = [
  {
    id: 1,
    name: 'Coral Gardens',
    theme: 'Arrecifes coloridos',
    backgroundColor: {
      top: '#87CEEB',
      bottom: '#E0F6FF'
    },
    pipeColor: {
      fill: '#FF6B9D',
      stroke: '#FF1493'
    },
    levels: [
      {
        id: 1,
        name: 'Bubble Dash Reefs',
        difficulty: 'easy',
        pipeSpeed: 2,
        pipeGap: 150,
        spawnRate: 90
      }
    ],
    boss: {
      name: 'Mini Pipe',
      health: 3,
      pattern: 'basic',
      description: 'Un pequeño jefe que dispara burbujas'
    }
  },
  {
    id: 2,
    name: 'Kelp Forest',
    theme: 'Algas retorcidas',
    backgroundColor: {
      top: '#2F4F2F',
      bottom: '#90EE90'
    },
    pipeColor: {
      fill: '#228B22',
      stroke: '#006400'
    },
    levels: [
      {
        id: 1,
        name: 'Twisty Kelp Trails',
        difficulty: 'medium',
        pipeSpeed: 2.5,
        pipeGap: 140,
        spawnRate: 85
      }
    ],
    boss: {
      name: 'Kelp Kraken',
      health: 5,
      pattern: 'tentacles',
      description: 'Un kraken de algas con tentáculos peligrosos'
    }
  },
  {
    id: 3,
    name: 'Sunken Ruins',
    theme: 'Ruinas sumergidas',
    backgroundColor: {
      top: '#1C1C3C',
      bottom: '#4A5568'
    },
    pipeColor: {
      fill: '#708090',
      stroke: '#2F4F4F'
    },
    levels: [
      {
        id: 1,
        name: 'Thunder Currents',
        difficulty: 'hard',
        pipeSpeed: 3,
        pipeGap: 130,
        spawnRate: 80
      }
    ],
    boss: {
      name: 'Storm Vortex',
      health: 7,
      pattern: 'whirlpool',
      description: 'Un vórtice de tormenta que genera corrientes'
    }
  },
  {
    id: 4,
    name: 'Abyss Factory',
    theme: 'Fábricas profundas',
    backgroundColor: {
      top: '#0A0A0A',
      bottom: '#1A1A2E'
    },
    pipeColor: {
      fill: '#4A4A4A',
      stroke: '#FF4500'
    },
    levels: [
      {
        id: 1,
        name: 'Gear Swim',
        difficulty: 'expert',
        pipeSpeed: 3.5,
        pipeGap: 120,
        spawnRate: 75
      }
    ],
    boss: {
      name: 'Mech Pipe',
      health: 10,
      pattern: 'mechanical',
      description: 'Una tubería mecánica con engranajes letales'
    }
  },
  {
    id: 5,
    name: 'Pipe Depths',
    theme: 'Fortaleza final',
    backgroundColor: {
      top: '#8B0000',
      bottom: '#FF4500'
    },
    pipeColor: {
      fill: '#DC143C',
      stroke: '#8B0000'
    },
    levels: [
      {
        id: 1,
        name: 'Lava Vents',
        difficulty: 'extreme',
        pipeSpeed: 4,
        pipeGap: 110,
        spawnRate: 70
      }
    ],
    boss: {
      name: 'Pipe Lord',
      health: 15,
      pattern: 'final',
      description: 'El señor de las tuberías, el jefe final definitivo'
    }
  }
]

// ========== PROGRESO DEL JUGADOR ==========
let currentWorldIndex = 0
let currentLevelIndex = 0
let unlockedWorlds = [0] // El primer mundo está desbloqueado

// Cargar progreso guardado
function loadProgress() {
  const saved = localStorage.getItem('gameProgress')
  if (saved) {
    const progress = JSON.parse(saved)
    currentWorldIndex = progress.currentWorld || 0
    currentLevelIndex = progress.currentLevel || 0
    unlockedWorlds = progress.unlockedWorlds || [0]
  }
}

// Guardar progreso
function saveProgress() {
  const progress = {
    currentWorld: currentWorldIndex,
    currentLevel: currentLevelIndex,
    unlockedWorlds: unlockedWorlds
  }
  localStorage.setItem('gameProgress', JSON.stringify(progress))
}

// Obtener mundo actual
function getCurrentWorld() {
  return worlds[currentWorldIndex]
}

// Obtener nivel actual
function getCurrentLevel() {
  const world = getCurrentWorld()
  return world.levels[currentLevelIndex]
}

// Desbloquear siguiente mundo
function unlockNextWorld() {
  const nextWorldIndex = currentWorldIndex + 1
  if (nextWorldIndex < worlds.length && !unlockedWorlds.includes(nextWorldIndex)) {
    unlockedWorlds.push(nextWorldIndex)
    saveProgress()
    return true
  }
  return false
}

// Cambiar a siguiente nivel
function nextLevel() {
  const world = getCurrentWorld()
  if (currentLevelIndex < world.levels.length - 1) {
    currentLevelIndex++
    saveProgress()
    return true
  }
  return false
}

// Cambiar a siguiente mundo
function nextWorld() {
  if (currentWorldIndex < worlds.length - 1) {
    currentWorldIndex++
    currentLevelIndex = 0
    saveProgress()
    return true
  }
  return false
}

// Cambiar a un mundo específico
function selectWorld(worldIndex) {
  if (unlockedWorlds.includes(worldIndex)) {
    currentWorldIndex = worldIndex
    currentLevelIndex = 0
    saveProgress()
    return true
  }
  return false
}

// Obtener todos los mundos
function getAllWorlds() {
  return worlds
}

// Verificar si un mundo está desbloqueado
function isWorldUnlocked(worldIndex) {
  return unlockedWorlds.includes(worldIndex)
}

// Resetear progreso (para testing)
function resetProgress() {
  currentWorldIndex = 0
  currentLevelIndex = 0
  unlockedWorlds = [0]
  localStorage.removeItem('gameProgress')
}

// Inicializar al cargar
loadProgress()
