const DEFAULT_WIDTH = 5

class Wire {
  constructor(from, to, options) {
    this.wireId = options.id || Wire.wireId++
    this.fromPlug = (from instanceof Plug) ? from : null
    const fromElem = (from instanceof Plug) ? from.span : from
    this.from = (from.left && from.top) ? from : { left: fromElem.offsetLeft, top: fromElem.offsetTop}
    if (!options.aligned) { this.from = Wire.gridAlign(this.from) }
    this.toPlug = (to instanceof Plug) ? to : null
    const toElem = (to instanceof Plug) ? to.span : to
    this.to = (to.left && to.top) ? to : { left: toElem.offsetLeft, top: toElem.offsetTop }
    if (!options.aligned) { this.to = Wire.gridAlign(this.to) }
    this.color = options.color || Wire.nextColor()
    this.width = options.width || DEFAULT_WIDTH
    if (typeof this.width === 'number') { this.width = `${this.width}px` }
    this.power = options.power
    this.carrying = this.power || options.carrying || 'signal'
    this.svg = options.svg || Wire.svg

    if (options.connect) {
      if (!this.toPlug || !this.fromPlug) { debugger }
      if (this.toPlug.variant === 'powered' || this.fromPlug.variant === 'powered') {
        this.carrying = 'power'
        this.color = 'red'
      }
      if (this.toPlug.variant === 'grounded' || this.fromPlug.variant === 'grounded') {
        this.carrying = 'ground'
        this.color = 'black'
      }
      const status = this.carrying === 'signal' ? 'inuse' : this.carrying
      this.toPlug.setStatus(status, this)
      this.fromPlug.setStatus(status, this)
      if (status !== 'inuse') {
        this.toPlug.setVariant(this.carrying + 'ed')
        this.fromPlug.setVariant(this.carrying + 'ed')
      }
    } else if (options.disconnect) {
      // TODO later
    }

    if (this.power) {
      this.color = options.power === 'power' ? 'red' : 'black'
      const { left: endLeft, top: endTop } = Wire.gridAlign(this.to)
      let path = [ Wire.powerGrid[this.power].coordinates ]
      if (Wire.powerGrid[this.power].coordinates.top !== endTop) {
        path.push({ left: Wire.powerGrid[this.power].channelLeft, top: Wire.powerGrid[this.power].coordinates.top })
        path.push({ left: Wire.powerGrid[this.power].channelLeft, top: endTop })
      }
      path.push({ left: endLeft, top: endTop })
      this.path = path
      this.drawWire()
      if (this.toPlug) { this.toPlug.setStatus(this.power) }
    } else {
      this.path = [ this.from, this.to ]
      this.drawWire()
    }
  }

  drawWire() {
    let wirePath = document.createElementNS("http://www.w3.org/2000/svg", 'path')
    wirePath.id = `wire-${this.wireId}`
    wirePath.setAttribute('stroke', this.color)
    wirePath.setAttribute('stroke-width', this.width)
    wirePath.setAttribute('stroke-linecap', `round`)
    wirePath.setAttribute('fill', 'none')

    let command = 'M'
    let pathStr = ''
    for (const point of this.path) {
      pathStr += `${command} ${point.left} ${point.top} `
      command = 'L'
    }
    wirePath.setAttribute('d', pathStr.trim())
    wirePath.wirePointer = this
    this.svg.appendChild(wirePath)
  }

  eraseWire() {
    const wirePath = this.svg.querySelector(`#wire-${this.wireId}`)
    wirePath.remove()
    if (this.toPlug) { this.toPlug.setStatus('open') }
  }

  propagateVariant(newVariant) {
    if (this.fromPlug.variant !== newVariant) {
      this.fromPlug.setVariant(newVariant, false)
      this.fromPlug.rail.checkVariant(this.fromPlug, newVariant)
    }
    if (this.toPlug.variant !== newVariant) {
      this.toPlug.setVariant(newVariant, false)
      this.toPlug.rail.checkVariant(this.toPlug, newVariant)
    }
    const testCarrying = newVariant.substring(0, newVariant.length - 2)
    if ((newVariant === 'powered' || newVariant === 'grounded') && testCarrying !== this.carrying) {
      this.carrying = testCarrying
      this.originalColor = this.color
      this.color = this.carrying === 'power' ? 'red' : 'black'
      const wirePath = this.svg.querySelector(`#wire-${this.wireId}`)
      if (wirePath) { wirePath.setAttribute('stroke', this.color) }
    }
  }
}

Wire.wireId = 1
Wire.wireColorIndex = 0
Wire.wireColors = [
  'orange',
  'yellow',
  'green',
  'blue',
  'cyan',
  'purple'
]

Wire.nextColor = () => {
  const col = Wire.wireColors[Wire.wireColorIndex]
  Wire.wireColorIndex = (Wire.wireColorIndex + 1) % Wire.wireColors.length
  return col
}

Wire.gridCoordinates = (point) => {
  const left = Math.floor((point.left - Wire.gridOffset.left + Wire.cellSize / 2) / Wire.cellSize )
  const top = Math.floor( (point.top - Wire.gridOffset.top + Wire.cellSize / 2) / Wire.cellSize )
  return { column: left, row: top }
}

Wire.getOffset = (gridCoordinates) => {
  return {
    left: gridCoordinates.column * Wire.cellSize + Wire.gridOffset.left,
    top: gridCoordinates.row * Wire.cellSize + Wire.gridOffset.top
  }
}

Wire.gridAlign = (point) => {
  return Wire.getOffset(Wire.gridCoordinates(point))
}

Wire.initialize = (board) => {
  // build the grid
  const plugs = Array.from(board.div.querySelectorAll('.plug'))
  const firstPlug = plugs.find((e) => { return !e.classList.contains('powered') } )
  const lastPlug = plugs.findLast((e) => { return !e.classList.contains('grounded') } )
  Wire.cellSize = Math.round((lastPlug.offsetLeft - firstPlug.offsetLeft) / board.dimensions.width)
  Wire.gridOffset = {
    left: firstPlug.offsetLeft + Math.floor(Wire.cellSize / 2) - 2,
    top: firstPlug.offsetTop + Math.floor (Wire.cellSize / 2) - 2
  }
  const gridRows = Math.round((lastPlug.offsetTop + lastPlug.offsetHeight - firstPlug.offsetTop) / Wire.cellSize)
  Wire.grid = Array.from(
    { length: gridRows },
    (e) => Array.from({ length: board.dimensions.width }, e => 'empty' )
  )

  Wire.powerGrid = {
    power: {
      coordinates: Wire.gridAlign({
        left: board.powerNode.offsetLeft + board.powerNode.offsetWidth / 2,
        top: board.powerNode.offsetTop + board.powerNode.offsetHeight / 2,
      })
    },
    ground: {
      coordinates: Wire.gridAlign({
        left: board.groundNode.offsetLeft + board.groundNode.offsetWidth / 2,
        top: board.groundNode.offsetTop + board.groundNode.offsetHeight / 2,
      })
    }
  }
  Wire.powerGrid.power.channelLeft = Wire.gridAlign({
    left: (Wire.powerGrid.power.coordinates.left + (Wire.getOffset({column: -1, row: 0}).left - Wire.powerGrid.power.coordinates.left) / 2),
    top: 0
  }).left
  Wire.powerGrid.ground.channelLeft = Wire.gridAlign({
    left: (Wire.powerGrid.ground.coordinates.left - (Wire.powerGrid.ground.coordinates.left - Wire.getOffset({column: board.dimensions.width + 1, row: 0}).left) / 2),
    top: 0
  }).left

  Wire.wireLayer = document.createElement("div")
  Wire.wireLayer.classList.add('wirelayer')
  board.div.appendChild(Wire.wireLayer)

  Wire.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  Wire.svg.setAttribute("aria-hidden","true")
  Wire.svg.setAttribute('viewbox', `0 0 ${Wire.wireLayer.offsetWidth} ${Wire.wireLayer.offsetHeight}`)
  Wire.svg.setAttribute('width', `${Wire.wireLayer.offsetWidth}px`)
  Wire.svg.setAttribute('height', `${Wire.wireLayer.offsetHeight}px`)
  Wire.wireLayer.appendChild(Wire.svg)
}

Wire.getWiresForPoint = (x, y) => {
  Wire.wireLayer.style.pointerEvents = 'stroke'
  const pathsUnder = document.elementsFromPoint(x, y)
  Wire.wireLayer.style.pointerEvents = 'none'
  return pathsUnder.filter((e) => { return e.tagName === 'path' })
}
