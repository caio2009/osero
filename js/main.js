// ---

const SETTINGS = {
  TILE_SIZE: 60,
  HORIZONTAL_TILE_NUMBER: 8,
  VERTICAL_TILE_NUMBER: 8,
  BOARD_DIVISOR_WIDTH: 1,
  DISK_SIZE: 50
}

// ---

const GAME = {
  canvas: null,
  ctx: null,
  boardMatrix: [],
  currentPlayer: 1,
  errors: []
}

// ---

function initCanvas({ width, height }) {
  if (!width || !height)
    return new Error("Error: width and height is required to initialize canvas.")

  const canvas = document.createElement("canvas")
  canvas.id = "canvas"
  canvas.width = width
  canvas.height = height

  document.querySelector("#boardContainer").append(canvas)

  return canvas
}

function initBoardMatrix() {
  for (let i = 0; i < SETTINGS.VERTICAL_TILE_NUMBER; i++) {
    GAME.boardMatrix.push([])

    for (let j = 0; j < SETTINGS.HORIZONTAL_TILE_NUMBER; j++) {
      GAME.boardMatrix[i].push(0)
    }
  }

  const middleCol = SETTINGS.HORIZONTAL_TILE_NUMBER / 2
  const middleRow = SETTINGS.VERTICAL_TILE_NUMBER / 2

  GAME.boardMatrix[middleRow][middleCol - 1] = 1
  GAME.boardMatrix[middleRow - 1][middleCol] = 1
  GAME.boardMatrix[middleRow - 1][middleCol - 1] = 2
  GAME.boardMatrix[middleRow][middleCol] = 2
}

function drawBoard() {
  const canvas = GAME.canvas
  const ctx = GAME.ctx

  // Board background
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Board tiles
  ctx.fillStyle = "darkgreen"
  for (let i = 0; i < SETTINGS.VERTICAL_TILE_NUMBER; i++) {
    for (let j = 0; j < SETTINGS.HORIZONTAL_TILE_NUMBER; j++) {
      const x = j * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH)
      const y = i * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH)

      ctx.fillRect(x, y, SETTINGS.TILE_SIZE, SETTINGS.TILE_SIZE)
    }
  }

  // Disks
  GAME.boardMatrix.forEach((row, i) => {
    row.forEach((col, j) => {
      if (col !== 0) {
        drawDisk({ col: j, row: i }, col)
      }
    })
  })
}

function drawDisk(tilePosition, player) {
  if (!tilePosition)
    return new Error("Error: tile position is missing to draw disk.")

  const ctx = GAME.ctx

  let x = y = 0
  if (tilePosition.col > 0) {
    x = tilePosition.col * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH)
  }
  if (tilePosition.row > 0) {
    y = tilePosition.row * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH)
  }
  x += (SETTINGS.DISK_SIZE / 2) + ((SETTINGS.TILE_SIZE - SETTINGS.DISK_SIZE) / 2)
  y += (SETTINGS.DISK_SIZE / 2) + ((SETTINGS.TILE_SIZE - SETTINGS.DISK_SIZE) / 2)

  ctx.fillStyle = player === 1 ? "black" : "white"
  ctx.beginPath()
  ctx.arc(x, y, SETTINGS.DISK_SIZE / 2, 0, 2 * Math.PI)
  ctx.fill()
  ctx.closePath()
}

function highlightTile(tilePosition) {
  if (!tilePosition)
    return new Error("Error: tile position is missing to highlight tile.")

  const ctx = GAME.ctx

  let x = 0
  let y = 0
  if (tilePosition.col > 0) {
    x = tilePosition.col * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH)
  }
  if (tilePosition.row > 0) {
    y = tilePosition.row * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH)
  }

  drawBoard()
  // Highlight
  ctx.fillStyle = "green"
  ctx.fillRect(x, y, SETTINGS.TILE_SIZE, SETTINGS.TILE_SIZE)

  drawDisk(tilePosition, GAME.currentPlayer)
}

function flipDisks(tilePosition) {
  if (!tilePosition)
    return new Error("Error: tile position is missing to flip disks.")

  const variationValues = {
    top: { row: -1, col: 0 },
    right: { row: 0, col: 1 },
    bottom: { row: 1, col: 0 },
    left: { row: 0, col: -1 },
    topRight: { row: -1, col: 1 },
    bottomRight: { row: 1, col: 1 },
    bottomLeft: { row: 1, col: -1 },
    topLeft: { row: -1, col: -1 }
  }

  const matrix = GAME.boardMatrix
  let hasFlipped = false

  Object.keys(variationValues).forEach((key) => {
    let outflankDisk = null
    const colVariationValue = variationValues[key].col
    const rowVariationValue = variationValues[key].row
    let i = colVariationValue
    let j = rowVariationValue

    // Find the outflank disk
    while (true) {
      const col = tilePosition.col + i
      const row = tilePosition.row + j

      if (
        col > matrix.length - 1 ||
        row > matrix.length - 1 ||
        col < 0 ||
        row < 0 ||
        matrix[row][col] === 0
      ) {
        break
      }

      if (matrix[row][col] === GAME.currentPlayer) {
        outflankDisk = { row, col }
        break
      }

      i += colVariationValue
      j += rowVariationValue
    }

    // After find the outflank disk flip the disks to flip
    if (outflankDisk) {
      i = colVariationValue
      j = rowVariationValue

      while (true) {
        const col = tilePosition.col + i
        const row = tilePosition.row + j

        if (col === outflankDisk.col && row === outflankDisk.row) break

        matrix[row][col] = GAME.currentPlayer
        hasFlipped = true

        i += colVariationValue
        j += rowVariationValue
      }
    }
  })

  if (!hasFlipped) throw new Error("Could not flip the disks")
}

function updatePlayersScore() {
  const player1ScoreElement = document.querySelector("#player1Score")
  const player2ScoreElement = document.querySelector("#player2Score")

  const reducedArray = GAME.boardMatrix.reduce((prev, curr) => prev.concat(curr))

  const player1Score = reducedArray.filter((value) => value === 1).length
  const player2Score = reducedArray.filter((value) => value === 2).length

  player1ScoreElement.innerHTML = player1Score
  player2ScoreElement.innerHTML = player2Score
}

function main() {
  const canvas = initCanvas({
    width: SETTINGS.HORIZONTAL_TILE_NUMBER * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH) - SETTINGS.BOARD_DIVISOR_WIDTH,
    height: SETTINGS.VERTICAL_TILE_NUMBER * (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH) - SETTINGS.BOARD_DIVISOR_WIDTH
  })

  GAME.canvas = canvas
  GAME.ctx = canvas.getContext("2d")

  // ---

  initBoardMatrix()
  drawBoard()
  updatePlayersScore()

  // ---

  // Highlight tile
  canvas.addEventListener("mousemove", (event) => {
    const x = event.x - canvas.offsetLeft
    const y = event.y - canvas.offsetTop

    const tileCol = Math.floor(x / (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH))
    const tileRow = Math.floor(y / (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH))

    if (GAME.boardMatrix[tileRow][tileCol] === 0) {
      highlightTile({ col: tileCol, row: tileRow })
    } else {
      // Don't overwrite the disks already on board
      drawBoard()
    }
  })
  // Reset highlight
  canvas.addEventListener("mouseout", () => {
    drawBoard()
  })
  // Put disk on board
  canvas.addEventListener("click", (event) => {
    const x = event.x - canvas.offsetLeft
    const y = event.y - canvas.offsetTop

    const tileCol = Math.floor(x / (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH))
    const tileRow = Math.floor(y / (SETTINGS.TILE_SIZE + SETTINGS.BOARD_DIVISOR_WIDTH))

    if (GAME.boardMatrix[tileRow][tileCol] === 0) {
      try {
        flipDisks({ col: tileCol, row: tileRow })
        GAME.boardMatrix[tileRow][tileCol] = GAME.currentPlayer
        GAME.currentPlayer = GAME.currentPlayer === 1 ? 2 : 1
        drawBoard()
        updatePlayersScore()
      } catch {
        if (!GAME.errors.includes("InvalidMoveError")) {
          GAME.errors.push("InvalidMoveError")

          const alertElement = document.querySelector(".alert")
          alertElement.style.opacity = 100

          let timer = null

          if (timer) clearTimeout(timer)

          timer = setTimeout(() => {
            alertElement.style.opacity = 0
            GAME.errors = GAME.errors.filter((value) => value !== "InvalidMoveError")
          }, 2000)
        }
      }
    }
  })

  document.querySelector("#forfeitButton").addEventListener("click", () => {
    GAME.currentPlayer = GAME.currentPlayer === 1 ? 2 : 1
  })
  document.querySelector("#restartButton").addEventListener("click", () => {
    document.location.reload()
  })
}

main()
