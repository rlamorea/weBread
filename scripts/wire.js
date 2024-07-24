class Wire {
  constructor(from, to, options) {
    this.wireId = options.id || Wire.wireId++
    const fromElem = (from instanceof Plug) ? from.span : from
    this.from = (from.left && from.top) ? from : { left: fromElem.offsetLeft, top: fromElem.offsetTop}
    if (!options.aligned) { this.from = Wire.gridAlign(this.from) }
    const toElem = (to instanceof Plug) ? to.span : to
    this.to = (to.left && to.top) ? to : { left: toElem.offsetLeft, top: toElem.offsetTop }
    if (!options.aligned) { this.to = Wire.gridAlign(this.to) }
    this.color = options.color || Wire.nextColor()
    this.power = options.power
    this.svg = options.svg || Wire.svg

    if (this.power) {
      this.color = options.power === 'power' ? 'red' : 'black'
      const { left: endLeft, top: endTop } = Wire.gridAlign({ left: this.toElem.offsetLeft, top: this.toElem.offsetTop })
      let path = [ Wire.powerGrid[this.power].coordinates ]
      if (Wire.powerGrid[this.power].coordinates.top !== endTop) {
        path.push({ left: Wire.powerGrid[this.power].channelLeft, top: Wire.powerGrid[this.power].coordinates.top })
        path.push({ left: Wire.powerGrid[this.power].channelLeft, top: endTop })
      }
      path.push({ left: endLeft, top: endTop })
      this.drawWire(path)
      if (this.to instanceof Plug) { this.to.setStatus(this.power) }
    } else {
      let path = [ this.from, this.to ]
      this.drawWire(path)
    }
  }

  drawWire(path) {
    let wirePath = document.createElementNS("http://www.w3.org/2000/svg", 'path')
    wirePath.id = `wire-${this.wireId}`
    wirePath.setAttribute('stroke', this.color)
    wirePath.setAttribute('stroke-width', '3px')
    wirePath.setAttribute('stroke-linecap', `round`)
    wirePath.setAttribute('fill', 'none')

    let command = 'M'
    let pathStr = ''
    for (const point of path) {
      pathStr += `${command} ${point.left} ${point.top} `
      command = 'L'
    }
    wirePath.setAttribute('d', pathStr.trim())
    this.svg.appendChild(wirePath)
  }

  eraseWire() {
    const wirePath = this.svg.querySelector(`#wire-${this.wireId}`)
    wirePath.remove()
    if (this.to instanceof Plug) { this.to.setStatus('open') }
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

  const wireLayer = document.createElement("div")
  wireLayer.classList.add('wirelayer')
  board.div.appendChild(wireLayer)

  Wire.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  Wire.svg.setAttribute("aria-hidden","true")
  Wire.svg.setAttribute('viewbox', `0 0 ${wireLayer.offsetWidth} ${wireLayer.offsetHeight}`)
  Wire.svg.setAttribute('width', `${wireLayer.offsetWidth}px`)
  Wire.svg.setAttribute('height', `${wireLayer.offsetHeight}px`)
  wireLayer.appendChild(Wire.svg)
}
