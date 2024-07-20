window.addEventListener('DOMContentLoaded', () => {
  new Board(document.getElementById('board'))
})

const BOARD_WIDTH = 52
const PIN_ROWS = 5
const POWER_CONNECTION_METHODS = [ 'none', 'top-rails', 'first-rails' ]
const GRID_X_OFFSET = 12
const GRID_Y_OFFSET = 15
const GRID_SIZE = 16

class Board {
  constructor(div) {
    this.div = div

    this.addRail(0)
    this.addRail(1)
    this.addGap('numbers')
    this.addPins('top')
    this.addGap('wide')
    this.addPins('bottom')
    this.addGap('numbers')
    this.addRail(2)
    this.addRail(3)

    this.colHighlight = document.createElement('div')
    this.colHighlight.classList.add('highlight', 'col-highlight')
    this.div.appendChild(this.colHighlight)
    this.colHighlight.style.display = 'none'

    this.rowHighlight = document.createElement('div')
    this.rowHighlight.classList.add('highlight', 'row-highlight')
    this.div.appendChild(this.rowHighlight)
    this.rowHighlight.style.display = 'none'

    this.connectHighlight = document.createElement('div')
    this.connectHighlight.classList.add('highlight', 'connect-highlight')
    this.div.appendChild(this.connectHighlight)
    this.connectHighlight.style.display = 'none'

    this.power = document.createElement('div')
    this.power.classList.add('power', 'fivevolts')
    this.power.innerHTML = '+5V'
    this.div.appendChild(this.power)
    this.power.addEventListener('click', () => { this.cyclePowerWireup() })
    this.powerConnectionMethod = 'none'

    this.ground = document.createElement('div')
    this.ground.classList.add('power', 'ground')
    this.ground.innerHTML = 'Gnd'
    this.div.appendChild(this.ground)

    this.railEnds = {}
    for (let r = 0; r < 4; r++) {
      this.railEnds[`r${r}-left`] = this.div.querySelector(`.plug[data-ref="rail"][data-index="${r}"][data-col="0"]`)
      this.railEnds[`r${r}-right`] = this.div.querySelector(`.plug[data-ref="rail"][data-index="${r}"][data-col="${BOARD_WIDTH-1}"]`)
    }
    this.wireLayers = {}
    this.wireId = 0
    this.wireGrid = []
    const { x: endX, y : endY } = this.gridLock(this.ground)
    for (let r = 0; r <= endY; r++) {
      let row = []
      for (let c = 0; c <= endX; c++) {
        row.push([])
      }
      this.wireGrid.push(row)
    }
  }

  addLabel(div, label) {
    const span = document.createElement('span')
    if (label) { span.innerHTML = label }
    div.appendChild(span)
  }

  addPlug(div, ref, index, extra = {}) {
    const plug = document.createElement('span')
    plug.classList.add('plug')
    plug.dataset.ref = ref
    plug.dataset.index = index.toString()
    for (const key in extra) {
      plug.dataset[key] = extra[key]
    }
    plug.addEventListener('mouseenter', () => { this.moveHighlightTo(plug) })
    plug.addEventListener('mouseleave', () => { this.hideHighlight() })
    div.appendChild(plug)
  }

  addRail(railIndex) {
    const row = document.createElement('div')
    row.classList.add('plugrow')
    this.addLabel(row)
    for (let w = 0; w < BOARD_WIDTH; w++) {
      this.addPlug(row, 'rail', railIndex, { col: w })
    }
    this.addLabel(row)
    this.div.appendChild(row)
  }

  addGap(variant) {
    const gap = document.createElement('div')
    gap.classList.add('gap')
    if (variant === 'numbers') {
      this.addLabel(gap)
      for(let w = 0; w < BOARD_WIDTH; w++) {
        this.addLabel(gap, (w === 0 || (w % 5) === 4) ? w+1 : null)
      }
      this.addLabel(gap)
    } else if (variant === 'wide') {
      gap.classList.add('wide')
    }
    this.div.appendChild(gap)
  }

  addPins(location) {
    for (let r = 0; r < PIN_ROWS; r++) {
      const row = document.createElement('div')
      row.classList.add('plugrow')
      this.addLabel(row, String.fromCharCode(65 + r))
      for (let w = 0; w < BOARD_WIDTH; w++) {
        this.addPlug(row, location, w, { row: r })
      }
      this.addLabel(row, String.fromCharCode(65 + r))
      this.div.appendChild(row)
    }
  }

  moveHighlightTo(plug) {
    this.colHighlight.style.display = 'block'
    this.colHighlight.style.left = `${plug.offsetLeft}px`
    this.rowHighlight.style.display = 'block'
    this.rowHighlight.style.top = `${plug.offsetTop}px`

    const plugType = plug.dataset.ref
    if (plugType === 'rail') {
      const railStart = plug.parentElement.querySelector('.plug:nth-child(2)')
      const railEnd = this.div.querySelector(`.plug:nth-child(${BOARD_WIDTH+1})`)
      this.connectHighlight.style.display = 'block'
      this.connectHighlight.style.left = `${railStart.offsetLeft-1}px`
      this.connectHighlight.style.top = `${railStart.offsetTop-1}px`
      this.connectHighlight.style.width = `${(railEnd.offsetLeft + railEnd.offsetWidth) - railStart.offsetLeft}px`
      this.connectHighlight.style.height = `${railStart.offsetHeight}px`
    } else {
      let topRow = plug.parentElement
      while (1 === 1) {
        if (topRow.previousElementSibling.classList.contains('gap')) { break }
        topRow = topRow.previousElementSibling
      }
      let bottomRow = plug.parentElement
      while (1 === 1) {
        if (bottomRow.nextElementSibling.classList.contains('gap')) { break }
        bottomRow = bottomRow.nextElementSibling
      }
      const pinStart = topRow.querySelector(`.plug[data-index="${plug.dataset.index}"]`)
      const pinEnd = bottomRow.querySelector(`.plug[data-index="${plug.dataset.index}"]`)
      this.connectHighlight.style.display = 'block'
      this.connectHighlight.style.left = `${pinStart.offsetLeft-1}px`
      this.connectHighlight.style.top = `${pinStart.offsetTop-1}px`
      this.connectHighlight.style.width = `${pinStart.offsetWidth}px`
      this.connectHighlight.style.height =   `${(pinEnd.offsetTop + pinEnd.offsetHeight) - pinStart.offsetTop}px`
    }
  }

  hideHighlight() {
    this.colHighlight.style.display = 'none'
    this.rowHighlight.style.display = 'none'
    this.connectHighlight.style.display = 'none'
  }

  addWireLayer(layerName) {
    if (!(layerName in this.wireLayers)) {
      const layer = document.createElement('div')
      layer.classList.add('wirelayer')
      this.wireLayers[layerName] = { div: layer, wires: [] }
      this.div.appendChild(layer)
    }
    return this.wireLayers[layerName]
  }

  cyclePowerWireup() {
    let powerIdx = (POWER_CONNECTION_METHODS.indexOf(this.powerConnectionMethod) + 1) % POWER_CONNECTION_METHODS.length
    this.powerConnectionMethod = POWER_CONNECTION_METHODS[powerIdx]

    const { div, wires } = this.addWireLayer('power')
    div.innerHTML = ''
    // TODO: clear power wire IDs from grid
    // TODO: clear power from rail and plugs
    // TODO: make plugs unused

    let checkPlugs = {}
    switch (this.powerConnectionMethod) {
      case 'top-rails':
        checkPlugs = { 'r0-left': 'power', 'r1-left': 'power', 'r2-right': 'ground', 'r3-right': 'ground' }
        break
      case 'first-rails':
        checkPlugs = { 'r0-left': 'power', 'r1-right': 'ground', 'r2-left': 'power', 'r3-right': 'ground' }
        break
      case 'none':
      default:
    }

    let inuse = false
    for (const checkPlug in checkPlugs) {
      const plug = this.railEnds[checkPlug]
      if (!plug.dataset.hardWired) { inuse = true; break; }
    }
    if (inuse) {
      this.powerConnectionMethod = 'none'
      return // leave unconnected
    }
    // if all the 
  }

  gridLock(div) {
    let x = div.offsetLeft + (div.offsetWidth / 2)
    let y = div.offsetTop + (div.offsetHeight / 2)
    return { x, y }
  }

  gridRestore(x, y) {
    x = Math.floor( ((x - GRID_X_OFFSET) / GRID_SIZE ))
    y = Math.floor( ((y - GRID_Y_OFFSET) / GRID_SIZE ))
    x = x * GRID_SIZE + GRID_SIZE / 2 + GRID_X_OFFSET
    y = y * GRID_SIZE + GRID_SIZE / 2 + GRID_Y_OFFSET
    return { x, y }
  }

  drawWire(layerDiv, source, dest, color = null, connectedClass = null) {
    const {x: sourceX, y: sourceY} = this.gridLock(source)
    const {x: destX, y: destY} = this.gridLock(dest)

    if (sourceY === destY && sourceX === destX) { // no line
      return // nothing to draw
    } else if (sourceX === destX) {

    }

    let svg = layerDiv.querySelector('svg')
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      svg.setAttribute("aria-hidden","true")
      svg.setAttribute('viewbox', `0 0 ${layerDiv.offsetWidth} ${layerDiv.offsetHeight}`)
      svg.setAttribute('width', `${layerDiv.offsetWidth}px`)
      svg.setAttribute('height', `${layerDiv.offsetHeight}px`)
      layerDiv.appendChild(svg)
    }
    const wirePath = document.createElementNS("http://www.w3.org/2000/svg", 'path')
    wirePath.setAttribute('d', `M${sourceX} ${sourceY} L ${destX} ${destY}`)
    wirePath.setAttribute('stroke', color)
    wirePath.setAttribute('stroke-width', '3px')
    wirePath.setAttribute('fill', 'none')

    svg.appendChild(wirePath);
  }
}