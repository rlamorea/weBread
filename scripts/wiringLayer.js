
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
    this.startMarker.endpoint = 'start'
    this.div.appendChild(this.startMarker)
    this.startMarker.style.display = 'none'
    this.startMarker.addEventListener('click', (e) => { this.endpointClicked(e) })

    this.endMarker = document.createElement('div')
    this.endMarker.classList.add('plug-marker')
    this.endMarker.endpoint = 'end'
    this.div.appendChild(this.endMarker)
    this.endMarker.style.display = 'none'
    this.endMarker.addEventListener('click', (e) => { this.endpointClicked(e) })

    this.color = null
    this.div.style.display = 'none'

    this.rubberWire = null
    this.startPlug = null
    this.startCoords = null

    this.deleteIcon = document.createElement('i')
    this.deleteIcon.classList.add('delete')
    this.deleteIcon.innerHTML = '&#x1f5d1;' //'&#x274c;'
    this.div.appendChild(this.deleteIcon)
    this.deleteIcon.style.display = 'none'
    this.deleteIcon.addEventListener('click', (e) => { this.deleteClicked(e) })

    this.downIcon = document.createElement('i')
    this.downIcon.classList.add('down')
    this.downIcon.innerHTML = '&#x25bc;'
    this.div.appendChild(this.downIcon)
    this.downIcon.style.display = 'none'
    this.downIcon.addEventListener('click', (e) => { this.downClicked(e) })

    this.upIcon = document.createElement('i')
    this.upIcon.classList.add('up')
    this.upIcon.innerHTML = '&#x25b2;'
    this.div.appendChild(this.upIcon)
    this.upIcon.style.display = 'none'
    this.upIcon.addEventListener('click', (e) => { this.upClicked(e) })

    let bottom = 10
    for (let color = Wire.wireColors.length -1; color >= 0; color--) {
      const colorDiv = document.createElement('div')
      colorDiv.classList.add('color')
      colorDiv.style.bottom = `${bottom}px`
      colorDiv.style.backgroundColor = Wire.wireColors[color]
      colorDiv.dataset.color = Wire.wireColors[color]
      colorDiv.addEventListener('click', (e) => { this.colorClicked(e) })

      bottom -= 30
    }

    this.mode = 'none'
  }

  activateForPlug(plug) {
    this.mode = 'add-wire'
    this.div.style.display = 'block'

    this.startMarker.style.display = 'block'
    this.startMarker.style.left = `${plug.span.offsetLeft}px`
    this.startMarker.style.top = `${plug.span.offsetTop}px`
    this.color = (plug.variant === 'powered') ? 'red' : (plug.variant === 'grounded') ? 'black' : Wire.nextColor()
    this.startMarker.style.backgroundColor = this.color

    const span = plug.plugSpan()
    this.startPlug = span.plugPointer
    this.startCoords = Wire.gridAlign({ left: span.offsetLeft, top: span.offsetTop })
  }

  activateForWires(wirePaths) {
    this.mode = 'edit-wire'
    this.div.style.display = 'block'
    this.div.classList.add('editing')
    this.deleteIcon.style.display = 'block'

    this.wirePaths = wirePaths
    this.wireIndex = 0
    if (wirePaths.length > 1) {
      this.upIcon.style.display = 'block'
      this.downIcon.style.display = 'block'
    }

    this.showEditWire()
  }

  showEditWire() {
    let oldId = null
    if (this.rubberWire) {
      oldId = this.rubberWire.wireId
      this.rubberWire.eraseWire()
      this.rubberWire = null
    }
    const wire = this.wirePaths[this.wireIndex].wirePointer
    this.color = wire.color
    this.rubberWire = new Wire(
      wire.from,
      wire.to,
      { id: oldId, svg: this.svg, color: this.color }
    )

    if (wire.fromPlug) {
      this.startMarker.style.display = 'block'
      this.startMarker.style.left = `${wire.fromPlug.span.offsetLeft}px`
      this.startMarker.style.top = `${wire.fromPlug.span.offsetTop}px`
      this.startMarker.style.backgroundColor = this.color
    }
    if (wire.toPlug) {
      this.endMarker.style.display = 'block'
      this.endMarker.style.left = `${wire.toPlug.span.offsetLeft}px`
      this.endMarker.style.top = `${wire.toPlug.span.offsetTop}px`
      this.endMarker.style.backgroundColor = this.color
    }
  }

  checkShortCircuit(endPlug) {
    return ((this.startPlug.variant === 'powered' && endPlug.variant === 'grounded') ||
            (this.startPlug.variant === 'grounded' && endPlug.variant === 'powered'))
  }

  deactivate() {
    this.mode = 'none'
    this.startCoords = null
    this.startPlug = null
    this.div.style.display = 'none'
    this.div.classList.remove('editing')
    this.startMarker.style.display = 'none'
    this.endMarker.style.display = 'none'
  }

  getUnderPlug(pageX, pageY) {
    const underElems = document.elementsFromPoint(pageX, pageY)
    const plugElem = underElems.find( (e) => { return e.tagName === 'SPAN' && e.classList.contains('plug') })
    if (plugElem) { return plugElem.plugPointer }
    return null
  }

  clicked(e) {
    e.stopPropagation()
    let toPlug = this.getUnderPlug(e.pageX, e.pageY)
    let wireId = null
    if (this.rubberWire) {
      wireId = this.rubberWire.wireId
      this.rubberWire.eraseWire()
      this.rubberWire = null
    }
    if (toPlug && this.checkShortCircuit(toPlug)) { toPlug = null }
    if (this.mode === 'move-wire') {
      wireId = this.wirePaths[this.wireIndex].wirePointer.wireId
    }
    if (toPlug) {
      toPlug = toPlug.plugSpan().plugPointer
      if (this.mode === 'move-wire') {
        this.wirePaths[this.wireIndex].wirePointer.eraseWire()
      }
      const wire = new Wire(
        this.startPlug,
        toPlug,
        { id: wireId, color: this.color, connect: true }
      )
      if (this.mode === 'move-wire') {
        this.wirePaths[this.wireIndex] = document.getElementById(`wire-${wireId}`)
      }
    } else if (this.mode === 'move-wire') {
      this.wirePaths[this.wireIndex].style.visibility = 'visible'
    }
    if (this.mode === 'move-wire') {
      this.mode = 'edit-wire'
      this.div.classList.add('editing')
      this.showEditWire()
    } else {
      this.deactivate()
    }
  }

  mouseMove(e) {
    if (this.mode !== 'add-wire' && this.mode !== 'move-wire') { return }
    if (e.target.tagName === 'path') { return } // ignore these cases
    let oldId = this.rubberWire?.wireId
    if (this.rubberWire) {
      this.rubberWire.eraseWire()
      this.rubberWire = null
    }
    let endPoint = { left: e.offsetX, top: e.offsetY }
    const plug = this.getUnderPlug(e.pageX, e.pageY)
    if (plug && !this.checkShortCircuit(plug)) {
      const plugSpan = plug.plugSpan()
      endPoint = Wire.gridAlign({ left: plugSpan.offsetLeft, top: plugSpan.offsetTop })
      this.div.classList.remove('nowire')
    } else {
      this.div.classList.add('nowire')
    }

    this.rubberWire = new Wire(
      this.startCoords,
      endPoint,
      { svg: this.svg, color: this.color, aligned: true, id: oldId, width: '3px', carrying: 'temp' })
  }

  downClicked(e) {
    e.stopPropagation()
    this.wireIndex = (this.wireIndex + 1) % this.wirePaths.length
    this.showEditWire()
  }

  upClicked(e) {
    e.stopPropagation()
    this.wireIndex -= 1
    if (this.wireIndex < 0) { this.wireIndex = this.wirePaths.length - 1 }
    this.showEditWire(e)
  }

  endpointClicked(e) {
    e.stopPropagation()
    const endpoint = e.target.endpoint
    const wireSpan = this.wirePaths[this.wireIndex]
    wireSpan.style.visibility = 'hidden' // hide actual wire

    const wire = this.wirePaths[this.wireIndex].wirePointer
    this.startCoords = (endpoint === 'start') ? wire.to : wire.from

    if (endpoint === 'start') {
      this.startMarker.style.left = this.endMarker.style.left
      this.startMarker.style.top = this.endMarker.style.top
    }
    this.endMarker.style.display = 'none'

    if (this.rubberWire) {
      this.rubberWire.eraseWire()
      this.rubberWire = null
    }
    this.startPlug = (endpoint === 'start') ? wire.toPlug : wire.fromPlug
    this.startCoords = Wire.gridAlign(this.startCoords)
    this.mode = 'move-wire'
    this.div.classList.remove('editing')
  }
}