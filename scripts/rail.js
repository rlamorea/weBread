const RAIL_TYPES = [ 'row', 'pin', 'switch' ]

class Rail {
  constructor(board, parent, type, index, options) {
    this.board = board
    this.type = type
    this.index = index

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
    }
  }

  highlight(show = true) {
    this.board.moveRailHighlightTo(this.plugs[0].span, this.plugs.at(-1).span)
    if (this.type === 'pin-top' || this.type === 'pin-bottom') {
      if (show) {
        const start = (this.type === 'pin-top') ? 0 : this.plugs.length - 1
        const end = (this.type === 'pin-top') ? this.plugs.length - 1 : 0
        const inc = (this.type === 'pin-top') ? 1 : -1
        for (let plugIndex = start; plugIndex !== end; plugIndex += inc) {
          const plug = this.plugs[plugIndex]
          if (plug.status === 'open') {
            plug.span.classList.add('selected')
            break
          }
        }
      } else {
        for (const plug of this.plugs) {
          if (plug.span.classList.contains('selected')) {
            plug.span.classList.remove('selected')
            break
          }
        }
      }
    }
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
}
