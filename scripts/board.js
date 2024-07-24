window.addEventListener('DOMContentLoaded', () => {
  new Board(document.getElementById('board'))
})

const BOARD_WIDTH = 52
const CHIP_ROWS = 1
const PIN_ROWS = 5
const POWER_CONNECTION_METHODS = [ 'none', 'default-power', 'split-power-top', 'split-ground-top' ]

class Board {
  constructor(div) {
    this.div = div
    this.dimensions = {
      width: BOARD_WIDTH,
      chips: CHIP_ROWS,
      pins: PIN_ROWS
    }

    this.rails = []
    this.chipRails = []

    this.addRowRails(2)
    for (let chipRow = 0; chipRow < CHIP_ROWS; chipRow++) {
      this.chipRails.push({ top: [], bottom: [] })
      this.addGap('numbers')
      this.addPinRails('top', chipRow)
      this.addGap('chip')
      this.addPinRails('bottom', chipRow)
      this.addGap('numbers')
      if (chipRow + 1 < CHIP_ROWS) {
        this.addRowRails(2)
      }
    }
    this.addRowRails(2)

    this.columnHighlight = this.createHighlight('col-highlight')
    this.rowHighlight = this.createHighlight('row-highlight')
    this.railHighlight = this.createHighlight('rail-highlight')

    this.powerNode = this.createNode('fivevolts', '+5V')
    this.groundNode = this.createNode('ground', 'GND')
    this.powerConnectionMethod = 'none'
    this.powerWires = []

    Wire.initialize(this)

    this.wiringLayer = new WiringLayer(this)
  }

  addLabel(div, label) {
    const span = document.createElement('span')
    if (label) { span.innerHTML = label }
    div.appendChild(span)
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
    } else if (variant === 'chip') {
      gap.classList.add('chip')
    }
    this.div.appendChild(gap)
  }

  addRow(parent) {
    if (!parent) { parent = this.div }
    const row = document.createElement('div')
    row.classList.add('plugrow')
    parent.appendChild(row)
    return row
  }

  addRowRails(count) {
    for (let row = 0; row < count; row++) {
      const row = this.addRow()
      this.rails.push(new Rail(this, row, 'rail', this.rails.length))
    }
  }

  addPinRails(location, index) {
    const pinBlock = document.createElement('div')
    pinBlock.classList.add('pin-block')
    this.div.appendChild(pinBlock)
    let rows = []
    for (let rowIndex = 0; rowIndex < PIN_ROWS; rowIndex++) {
      const row = this.addRow(pinBlock)
      this.addLabel(row, String.fromCharCode(65 + rowIndex))
      rows.push(row)
    }
    for (let col = 0; col < BOARD_WIDTH; col++) {
      this.chipRails[index][location] = new Rail(this, pinBlock, `pin-${location}`, index)
    }
    for (let row = 0; row < PIN_ROWS; row++) {
      this.addLabel(rows[row], String.fromCharCode(65 + row))
    }
  }

  createHighlight(type) {
    const highlight = document.createElement('div')
    highlight.classList.add('highlight', type)
    this.div.appendChild(highlight)
    highlight.style.display = 'none'
    return highlight
  }

  moveGridHighlightTo(plug) {
    this.columnHighlight.style.display = 'block'
    this.columnHighlight.style.left = `${plug.offsetLeft}px`
    this.rowHighlight.style.display = 'block'
    this.rowHighlight.style.top = `${plug.offsetTop}px`
  }

  moveRailHighlightTo(firstPlug, lastPlug) {
    this.railHighlight.style.display = 'block'
    this.railHighlight.style.left = `${firstPlug.offsetLeft-1}px`
    this.railHighlight.style.top = `${firstPlug.offsetTop-1}px`
    this.railHighlight.style.width = `${(lastPlug.offsetLeft + lastPlug.offsetWidth) - firstPlug.offsetLeft}px`
    this.railHighlight.style.height =  `${(lastPlug.offsetTop + lastPlug.offsetHeight) - firstPlug.offsetTop}px`
  }

  hideHighlight() {
    this.columnHighlight.style.display = 'none'
    this.rowHighlight.style.display = 'none'
    this.railHighlight.style.display = 'none'
  }

  createNode(type, text) {
    const node = document.createElement('div')
    node.classList.add('power', type)
    node.innerHTML = text
    node.addEventListener('click', e => { this.cyclePowerConnection() })
    this.div.appendChild(node)
    return node
  }

  cyclePowerConnection() {
    let powerIdx = (POWER_CONNECTION_METHODS.indexOf(this.powerConnectionMethod) + 1) % POWER_CONNECTION_METHODS.length
    this.powerConnectionMethod = POWER_CONNECTION_METHODS[powerIdx]

    // remove existing wires
    for (const wire of this.powerWires) {
      wire.eraseWire()
    }
    this.powerWires = []

    for (let railIndex = 0; railIndex < this.rails.length; railIndex++) {
      let fromNode = null
      let power = ''
      let conMethod = this.powerConnectionMethod
      switch (this.powerConnectionMethod) {
        case 'default-power':
          if (railIndex < 2) {
            fromNode = this.powerNode
            power = 'power'
            break
          } else if (railIndex >= this.rails.length - 2) {
            fromNode = this.groundNode
            power = 'ground'
            break
          }
          conMethod = 'split-ground-top' // for middle rails, ground on top
        case 'split-power-top':
        case 'split-ground-top':
          let topPower = conMethod.split('-')[1]
          power = (railIndex % 2 === 0) ? topPower : 'opposite'
          if (power === 'opposite') { power = topPower === 'power' ? 'ground' : 'power' }
          fromNode = (power === 'power') ? this.powerNode : this.groundNode
        case 'none':
        default:
          break
      }
      if (fromNode) {
        const rail = this.rails[railIndex]
        const toNode = (power === 'power') ? rail.powerPlug : rail.groundPlug
        this.powerWires.push(new Wire(fromNode, toNode, { power }))
      }
    }
  }

  plugClicked(plug) {
    this.wiringLayer.activateForPlug(plug)
  }
}
