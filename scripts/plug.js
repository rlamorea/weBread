
class Plug {
  constructor(board, rail, parentDiv, location, index, subindex, options = {}) {
    this.board = board
    this.rail = rail
    this.location = location
    this.index = index
    this.subindex = subindex
    this.status = 'open'
    this.variant = options.variant

    this.span = document.createElement('span')
    this.span.classList.add('plug')
    if (this.variant) { this.span.classList.add(this.variant) }
    const extraData = options.data || {}
    for (const key in extraData) {
      this.span.dataset[key] = extraData[key]
    }
    this.span.addEventListener('mouseenter', () => { this.mouseEnter() })
    this.span.addEventListener('mouseleave', () => { this.board.hideHighlight() })
    this.span.addEventListener('click', () => { this.clicked() })
    parentDiv.appendChild(this.span)
    if (options.state) {
      this.span.style.visibility = options.state
    }
  }

  mouseEnter() {
    if (this.status !== 'open') { return }
    this.board.moveGridHighlightTo(this.span)
    this.rail.highlight()
  }

  clicked() {
    // TODO
  }

  setStatus(newStatus) {
    this.span.classList.remove(this.status)
    if (this.status === 'power' || this.status === 'ground') {
      this.span.style.visibility = 'hidden'
      this.rail.checkVariant()
    }
    this.status = newStatus
    this.span.classList.add(this.status)
    if (this.status === 'power' || this.status === 'ground') {
      this.span.style.visibility = 'visible'
      this.rail.checkVariant(this,this.status + 'ed')
    }
    if (newStatus === 'open') {
      this.span.classList.remove('inuse')
    } else {
      this.span.classList.add('inuse')
    }
  }

  setVariant(newVariant) {
    if (this.variant) { this.span.classList.remove(this.variant) }
    this.variant = newVariant
    if (this.variant) { this.span.classList.add(this.variant) }
  }
}