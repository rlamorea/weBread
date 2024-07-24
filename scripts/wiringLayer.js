
class WiringLayer {
  constructor(board) {
    this.board = board

    this.div = document.createElement('div')
    this.div.classList.add('wirelayer', 'interactive')
    this.board.div.appendChild(this.div)

    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.svg.setAttribute("aria-hidden","true")
    this.svg.setAttribute('viewbox', `0 0 ${this.div.offsetWidth} ${this.div.offsetHeight}`)
    this.svg.setAttribute('width', `${this.div.offsetWidth}px`)
    this.svg.setAttribute('height', `${this.div.offsetHeight}px`)
    this.div.appendChild(this.svg)

    this.div.addEventListener('mousemove', (e) => { this.mouseMove(e) })
    this.div.addEventListener('click', (e) => { this.clicked(e) })

    this.startMarker = document.createElement('div')
    this.startMarker.classList.add('plug-marker')
    this.div.appendChild(this.startMarker)
    this.startMarker.style.display = 'none'

    this.endMarker = document.createElement('div')
    this.endMarker.classList.add('plug-marker')
    this.div.appendChild(this.endMarker)
    this.endMarker.style.display = 'none'

    this.color = null
    this.div.style.display = 'none'

    this.rubberWire = null
    this.startPlug = null
    this.startCoords = null
  }

  activateForPlug(plug) {
    this.div.style.display = 'block'

    this.startMarker.style.display = 'block'
    this.startMarker.style.left = `${plug.span.offsetLeft}px`
    this.startMarker.style.top = `${plug.span.offsetTop}px`
    this.color = Wire.nextColor()
    this.startMarker.style.backgroundColor = this.color

    const span = plug.plugSpan()
    this.startPlug = span.plugPointer
    this.startCoords = Wire.gridAlign({ left: span.offsetLeft, top: span.offsetTop })
  }

  deactivate() {
    this.startCoords = null
    this.startPlug = null
    this.div.style.display = 'none'
  }

  getUnderPlug(pageX, pageY) {
    const underElems = document.elementsFromPoint(pageX, pageY)
    const plugElem = underElems.find( (e) => { return e.tagName === 'SPAN' && e.classList.contains('plug') })
    if (plugElem) { return plugElem.plugPointer }
    return null
  }

  clicked(e) {
    let toPlug = this.getUnderPlug(e.pageX, e.pageY)
    let wireId = null
    if (this.rubberWire) {
      wireId = this.rubberWire.id
      this.rubberWire.eraseWire()
      this.rubberWire = null
    }
    if (toPlug) {
      toPlug = toPlug.plugSpan().plugPointer
      new Wire(this.startPlug, toPlug, { id: wireId, color: this.color })
    }
    this.deactivate()
  }

  mouseMove(e) {
    if (e.target.tagName === 'path') { return } // ignore these cases
    let oldId = this.rubberWire?.id
    if (this.rubberWire) {
      this.rubberWire.eraseWire()
      this.rubberWire = null
    }
    let endPoint = { left: e.offsetX, top: e.offsetY }
    const plug = this.getUnderPlug(e.pageX, e.pageY)
    if (plug) {
      const plugSpan = plug.plugSpan()
      endPoint = Wire.gridAlign({ left: plugSpan.offsetLeft, top: plugSpan.offsetTop })
    }

    this.rubberWire = new Wire(
      this.startCoords,
      endPoint,
      { svg: this.svg, color: this.color, aligned: true, id: oldId })
  }
}