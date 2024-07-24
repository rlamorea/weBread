const RAIL_TYPES = [ 'row', 'pin', 'switch' ]

class Rail {
  constructor(board, parent, type, index, options) {
    this.board = board
    this.type = type
    this.index = index
    this.outerPlug = null

    this.powerPlug = null
    this.groundPlug = null
    this.plugs = []
    if (type === 'rail') {
      this.powerPlug = new Plug(board, this, parent, type, index, 'power', { state: 'hidden' })
      for (let col = 0; col < board.dimensions.width; col++) {
        this.plugs.push(new Plug(board, this, parent, type, index, col))
      }
      this.groundPlug = new Plug(board, this, parent, type, index, 'ground', { state: 'hidden' })
    } else if (type.startsWith('pin')) {
      for (let rowIndex = 0; rowIndex < board.dimensions.pins; rowIndex++) {
        const row = parent.querySelector(`.plugrow:nth-child(${rowIndex+1})`)
        this.plugs.push(new Plug(board, this, row, type, index, rowIndex))
      }
      this.getOuterPlug()
    }
  }

  highlight(show = true) {
    this.board.moveRailHighlightTo(this.plugs[0].span, this.plugs.at(-1).span)
  }

  checkVariant(ignorePlug, newVariant = null) {
    let sharedVariant = null
    for (const plug of this.plugs) {
      if (plug === ignorePlug) { continue }
      if (plug.variant === 'powered' || plug.variant === 'grounded') { sharedVariant = plug.status }
    }
    if (this.powerPlug && this.powerPlug !== ignorePlug && this.powerPlug.variant === 'powered') { sharedVariant = 'powered' }
    if (this.groundPlug && this.groundPlug !== ignorePlug && this.groundPlug.variant === 'grounded') { sharedVariant = 'grounded' }
    if (sharedVariant !== newVariant) {
      for (const plug of this.plugs) { plug.setVariant(newVariant) }
    }
  }

  getOuterPlug() {
    if (!this.type.startsWith('pin')) { return }
    let plug = this
    let start = 0, end = this.plugs.length - 1, inc = 1
    if (this.type === 'pin-bottom') {
      start = end; end = 0; inc = -1
    }
    for (let plugIndex = start; plugIndex !== end; plugIndex += inc) {
      const testPlug = this.plugs[plugIndex]
      if (testPlug.status === 'open') { plug = testPlug; break; }
    }
    this.outerPlug = plug
    return plug
  }

  plugClicked(plug) {
    plug = this.outerPlug || plug
    this.board.plugClicked(plug)
  }
}
