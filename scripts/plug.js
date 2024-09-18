
class Plug {
  constructor(board, rail, parentDiv, location, index, subindex, options = {}) {
    this.board = board
    this.rail = rail
    this.location = location
    this.index = index
    this.subindex = subindex
    this.status = 'open'
    this.variant = options.variant
    this.wire = null

    this.span = document.createElement('span')
    this.span.classList.add('plug')
    if (this.variant) { this.span.classList.add(this.variant) }
    this.span.plugPointer = this
    const extraData = options.data || {}
    for (const key in extraData) {
      this.span.dataset[key] = extraData[key]
    }
    this.span.addEventListener('mouseenter', () => { this.mouseEnter() })
    this.span.addEventListener('mouseleave', () => { this.mouseLeave() })
    this.span.addEventListener('click', (e) => { this.clicked(e) })
    parentDiv.appendChild(this.span)
    if (options.state) {
      this.span.style.visibility = options.state
    }
  }

  plugSpan() {
    const plug = this.rail.outerPlug || this
    return plug.span
  }

  mouseEnter() {
    if (this.status !== 'open') { return }
    this.plugSpan().classList.add('selected')
    this.board.moveGridHighlightTo(this.span)
    this.rail.highlight()
  }

  mouseLeave() {
    this.rail.highlight(false)
    this.board.hideHighlight()
    this.plugSpan().classList.remove('selected')
  }

  clicked(e) {
    this.rail.plugClicked(this, e)
    e.stopPropagation()
  }

  setStatus(newStatus, wire) {
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
      this.wire = null // TODO: disconnect and/or propagate wires
    } else {
      this.wire = wire
      this.span.classList.add('inuse')
      this.rail.plugRewired(this)
    }
  }

  setVariant(newVariant, propagate = true) {
    if (this.variant) { this.span.classList.remove(this.variant) }
    this.variant = newVariant
    if (this.variant) { this.span.classList.add(this.variant) }
    if (propagate && this.wire) {
      this.wire.propagateVariant(newVariant)
    }
  }
}