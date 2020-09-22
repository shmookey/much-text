export const MuchText = (() => {

const { ceil, floor, min, max } = Math

const isMac = navigator.platform.indexOf('Mac') > -1
const cssSource = `
:root {
  --line-width:     80ch;
  --line-min-width: 80ch;
  --dead-width:     100%;
  --margin-width:   50px;
  --boundary-left:  0px;
}
* {
  box-sizing:      border-box;
}
:host {
  display:         block;
  appearance:      textfield;
  border:          1px solid #707070;
  font-family:     monospace;
  overflow:        auto auto;
}
slot {
  display:         none;
}
#doc {
  cursor:          text;
  user-select:     none;
  position:        relative;
  display:         grid;
  outline:         none;
  overflow-x:      hidden;
  grid-auto-rows:  minmax(calc(1em + 1ex), min-content);
  grid-auto-flow:  dense;
  white-space:     break-spaces;
  word-break:      break-all;
  justify-content: flex-start;
  grid-template-columns: var(--margin-width) var(--line-width) var(--dead-width);
}
#doc.disabled {
  cursor:          default;
}
#doc.no-wrap {
  overflow-x:      auto;
  white-space:     pre;
  word-break:      normal;
  width:           fit-content;
}
.caret {
  height:          calc(1em + 1ex);
  width:           1ch;
  position:        absolute;
  border-left:     1px solid #08080F;
  opacity:         0;
}
#doc:focus .caret {
  opacity:         1;
}
#doc.select:focus .caret {
  opacity:         0;
}
.line-selection {
  height:          calc(1em + 1ex);
  backdrop-filter: sepia(60%) invert(100%);
  position:        absolute;
}
.line {
  grid-column:     2;
  min-width:       var(--line-min-width);
  width:           var(--line-width);
}
.line-number {
  text-align:      right;
  padding-right:   20px;
  color:           #8F8C8F;
  grid-column:     1;
  width:           var(--margin-width);
}
.line-overflow {
  grid-column:     3;
  width:           var(--dead-width);
}
#doc .boundary {
  width:           1px;
  position:        absolute;
  top:             0px;
  height:          100%;
  left:            var(--boundary-left);
  border-left:     1px dashed #FFFFFF55;
  visibility:      hidden;
}
#doc.show-boundary .boundary {
  visibility:      visible;
}
.line, .line-number, .line-overflow {
  line-height:     calc(1em + 1ex);
  vertical-align:  middle;
}
#margin, #overflow-area, #text, .selection {
  display:         contents;
}
.line *, .line-selection, #caret {
  pointer-events:  none;
}
#doc.alternating-rows {
  background:      repeating-linear-gradient(to bottom, #2F2D2F 0px, #2F2D2F 20px, #2A2A2A 20px, #2A2A2A 40px);
}
#doc.alternating-lines .line:nth-child(odd), 
#doc.alternating-lines .line-number:nth-child(odd),
#doc.alternating-lines .line-overflow:nth-child(odd) {
  background: #2F2D2F;
}
#doc.alternating-lines.no-wrap .line:nth-child(odd), 
#doc.alternating-lines.no-wrap .line-number:nth-child(odd),
#doc.alternating-lines.no-wrap .line-overflow:nth-child(odd) {
  background: none;
}
#doc.alternating-lines.no-wrap {
  background: repeating-linear-gradient(to bottom, #2F2D2F 0px, #2F2D2F 20px, #2A2A2A 20px, #2A2A2A 40px);
}
#contextMenu {
  position: absolute;
  width: fit-content;
  background: #DCDCDC;
  color: black;
  cursor: default;
}
#contextMenu > div {
  height: 1.5em;
  padding: 0.25em 1.1em;
}
#contextMenu > div:hover {
  background: #ACACAC;
}
`

function createElement(tagName, props=null) {
  const e = document.createElement(tagName)
  if(props) for(let [k,v] of Object.entries(props)) e[k] = v
  return e
}

/** Extract the text between two line/column points. */
function getSlice(doc, startLine, startColumn, endLine, endColumn) {
  const nLines = 1 + endLine - startLine
  if(nLines == 1) {
    return doc[startLine].chars.slice(startColumn, endColumn).join('')
  } else {
    const first = doc[startLine].chars.slice(startColumn).join('')
    const last = doc[endLine].chars.slice(0, endColumn).join('')
    if(nLines < 3)
      return [first, last].join('\n')
    const rest = doc.slice(startLine+1, endLine).map(x => x.chars.join('')).join('\n')
    return [first, rest, last].join('\n')
  }
}

/** Create a line selection element. */
function mkLineSel(line, from, to, margin) {
  const e = createElement('div', {className: 'line-selection'})
  e.style.top   = `calc(${line} * (1em + 1ex))`
  e.style.left  = `calc(${margin}px + ${from}ch)`
  e.style.width = `calc(${to-from}ch)`
  return e
}
function mkLineSel2(top, from, to, margin) {
  const e = createElement('div', {className: 'line-selection'})
  e.style.top   = `${top}px`
  e.style.left  = `calc(${margin}px + ${from}ch)`
  e.style.width = `calc(${to-from}ch)`
  return e
}

class MuchInputEvent extends InputEvent {
  affectedRange
  extendedRange
  constructor(eventType, opts) {
    super(eventType, opts)
    this.affectedRange = opts.affectedRange
    this.extendedRange = opts.extendedRange
  }
}

class MuchText extends HTMLElement {
  // Configuration
  #cfgLineWrap     = true
  #cfgLineNums     = false
  #cfgAltLines     = 'off'
  #cfgDisabled     = false
  #cfgReadOnly     = false
  #cfgShowBoundary = true
  #cfgRows         = null
  #cfgCols         = null
  // UI state
  #lines
  #selection
  #visibleRegion
  #elements
  #changed
  #refreshScheduled
  #ctxMenuOpen
  #isDragging  = false
  #isFocused   = false
  #caretLine   = 0
  #caretColumn = 0
  #caretBlink  = null
  #topLine     = 0     // Line number of first visible line
  #bottomLine  = 0     // Line number of last visible line
  #updatedSlot = false // Have we updated the slot since the last slotchange?
  // Geometry 
  #contentBox  = null
  #textBox     = null
  #marginWidth = 0     // Pixel width of margin area
  #charWidth   = 0
  #charHeight  = 0
  // Highlighting
  lastRangeID = 0
  ranges      = null

  constructor() {
    super()
    this.ranges = []
    this.#lines = [{
      chars:   [],
      dirty:   false,
      element: createElement('div', {className: 'line'}),
      ranges:  [],
    }]
    this.#textBox = {
      left:   0,
      right:  1,
      top:    0,
      bottom: 1,
      width:  1,
      height: 1,
      cols:   1,
      rows:   1,
    }
    this.#visibleRegion = {
      scrollX:           0,
      scrollY:           0,
      firstLine:         0,
      firstCol:          0,
      lastCol:           0,
      lastLine:          0,
      firstLineOverflow: 0, // Number of vertical pixels hidden
      lastLineOverflow:  0,
      firstColOverflow:  0, // Number of vertical pixels hidden
      lastColOverflow:   0,
    }
    this.#refreshScheduled = false
    this.#ctxMenuOpen = false
    this.#changed = {
      contentBox:    false,
      textBox:       false,
      marginWidth:   false,
      charSize:      false,
      caretPosition: false,
    }
    this.attachShadow({
      mode:           'open',
      delegatesFocus: true,
    })
    this.#elements = {
      doc:          createElement('div',   {id: 'doc', part: 'doc', autofocus: true, tabIndex: 0}),
      margin:       createElement('div',   {id: 'margin', part: 'margin'}),
      text:         createElement('div',   {id: 'text', part: 'text'}),
      overflowArea: createElement('div',   {id: 'overflow-area'}),
      boundary:     createElement('div',   {className: 'boundary', part: 'boundary'}),
      caret:        createElement('div',   {className: 'caret', part: 'caret'}),
      style:        createElement('style', {textContent: cssSource}),
      slot:         createElement('slot'),
      ctxMenu:      createElement('div',   {id: 'contextMenu', part: 'contextMenu'}),
      ctxCut:       createElement('div',   {className: 'cut', textContent: 'Cut'}),
      ctxCopy:      createElement('div',   {className: 'copy', textContent: 'Copy'}),
      ctxPaste:     createElement('div',   {className: 'paste', textContent: 'Paste'}),
      textNode:     new Text(),
    }
    this.#elements.ctxMenu.append(
      this.#elements.ctxCut,
      this.#elements.ctxCopy,
      this.#elements.ctxPaste,
    )
    this.#elements.doc.append(
      this.#elements.margin,
      this.#elements.text,
      this.#elements.overflowArea, 
      this.#elements.boundary,
      this.#elements.caret)
    this.append(this.#elements.textNode)
    this.#caretBlink = this.#elements.caret.animate({
      visibility: ['visible', 'hidden', 'hidden'],
    }, {
      duration: 1000,
      iterations: Infinity,
    })
    this.#elements.text.appendChild(this.#lines[0].element)
    this.#elements.doc.addEventListener('click', () => {})
    this.#elements.doc.addEventListener('pointerdown', e => this.#handlePointerDown(e))
    this.#elements.doc.addEventListener('click',       e => this.#handleClick(e))
    this.#elements.doc.addEventListener('pointermove', e => this.#handlePointerMove(e))
    this.#elements.doc.addEventListener('pointerup',   e => this.#handlePointerUp(e))
    this.#elements.doc.addEventListener('keydown',     e => this.#handleKeyDown(e))
    this.#elements.doc.addEventListener('focus',       e => this.#handleFocus(e))
    this.#elements.doc.addEventListener('blur',        e => this.#handleBlur(e))
    this.addEventListener('scroll',                    e => this.#handleScroll(e))
    this.#elements.slot.addEventListener('slotchange', e => this.#handleSlotChange(e))
    this.#elements.doc.addEventListener('contextmenu', e => this.#openContextMenu(e))
    this.#elements.ctxMenu.addEventListener('click',   e => {})
    this.#elements.ctxMenu.addEventListener('pointerdown',   e => this.#contextMenuPointerEvent(e))
    this.#elements.ctxMenu.addEventListener('pointerup',   e => this.#contextMenuPointerEvent(e))
    this.#elements.ctxCopy.addEventListener('click',   e => this.#contextMenuCopy(e))
    this.#elements.ctxCut.addEventListener('click',    e => this.#contextMenuCut(e))
    this.#elements.ctxPaste.addEventListener('click',  e => this.#contextMenuPaste(e))

    const resizeObserver = new ResizeObserver(entries => {
      for(let entry of entries) {
        switch(entry.target) {
        case this:
          this.#contentBox = {
            left:    this.offsetLeft,
            top:     this.offsetTop,
            width:   entry.contentRect.width,
            height:  entry.contentRect.height,
            right:   this.offsetLeft + entry.contentRect.width,
            bottom:  this.offsetTop + entry.contentRect.bottom,
          }
          this.#changed.contentBox = true
          break
        case this.#elements.caret:
          this.#charWidth = entry.borderBoxSize[0].inlineSize
          this.#charHeight = entry.borderBoxSize[0].blockSize
          this.#changed.caretSize = true
          break
        }
      }
      this.#scheduleRefresh()
    })
    resizeObserver.observe(this)
    resizeObserver.observe(this.#elements.caret)
    this.shadowRoot.append(
      this.#elements.style,
      this.#elements.doc,
      this.#elements.slot)

    //this.#enableLineWrap()
    //this.#disableLineNumbers()
  }

  get debug() {
    return {
      lines:            this.#lines,
      elements:         this.#elements,
      selection:        this.#selection, 
      changed:          this.#changed, 
      refreshScheduled: this.#refreshScheduled, 
      contentBox:       this.#contentBox,
      textBox:          this.#textBox,
      visibleRegion:    this.#visibleRegion,
    }
  }

  #openContextMenu(ev) {
    ev.preventDefault()
    const x = ev.clientX - this.#contentBox.left
    const y = ev.clientY - this.#contentBox.top
    const ctxMenu = this.#elements.ctxMenu
    ctxMenu.style.left = `${x}px`
    ctxMenu.style.top = `${y}px`
    this.#ctxMenuOpen = true
    this.#elements.doc.append(ctxMenu)
    ctxMenu.focus()
  }

  #closeContextMenu() {
    this.#ctxMenuOpen = false
    this.#elements.ctxMenu.remove()
  }

  #contextMenuPointerEvent(ev) {
    ev.stopPropagation()
  }

  #contextMenuCopy(ev) {
    this.#clipboardCopy()
  }

  #contextMenuCut(ev) {
    if(this.#cfgReadOnly) 
      this.#clipboardCopy()
    else
      this.#clipboardCut()
  }

  #contextMenuPaste(ev) {
    this.#clipboardPaste()
  }



  /***************************************************************************
   *                                                                         *
   *    GEOMETRY                                                             *
   *                                                                         *
   ***************************************************************************/


  #determineVisibleRegion() {
    const vis = this.#visibleRegion
    const tBox = this.#textBox
    const cW = this.#charWidth
    const cH = this.#charHeight
    let y = vis.scrollY
    let first = 0
    let last = 0
    let nextLineHeight = this.#lineHeight(first)
    while(nextLineHeight != null && y > nextLineHeight) {
      y -= nextLineHeight
      first += 1
      nextLineHeight = this.#lineHeight(first)
    }
    vis.firstLineOverflow = y
    y += this.#contentBox.height
    last = first
    nextLineHeight = this.#lineHeight(last)
    while(nextLineHeight != null && y > nextLineHeight) {
      y -= nextLineHeight
      last += 1
      nextLineHeight = this.#lineHeight(last)
    }
    vis.firstCol = floor(vis.scrollX / cW)
    vis.firstColOverflow = vis.scrollX % cW
    vis.lastCol = floor((vis.scrollX+tBox.width) / cW)
    vis.lastColOverflow = (vis.scrollX+tBox.width) % cW
    const changed = !(first == vis.firstLine && last == vis.lastLine)
    vis.firstLine = first
    vis.lastLine = last
    return changed
  }

  #lineHeight(row) {
    const cH   = this.#charHeight
    const cols = this.#textBox.cols
    const wrap = this.#cfgLineWrap
    const line = this.#lines[row]
    if(!line) return null
    if(!wrap) return cH
    return cH * max(1, ceil(line.chars.length / cols))
  }

  /** Get the vertical position of a visible line, relative to the textBox. */
  #lineOffset(row) {
    const vis = this.#visibleRegion
    if(row < vis.firstLine || row > vis.lastLine) return null
    let top = -vis.firstLineOverflow
    for(let i=vis.firstLine; i<row; i++) {
      top += this.#lineHeight(i)
    }
    return top
  }

  /** Find the nearest line/column to a pixel coordinate in the text area. */
  nearestPosition(x, y) {
    let tBox = this.#textBox
    let region = this.#visibleRegion
    x = max(0, min(x, tBox.width)) + region.firstColOverflow
    y = max(0, min(y, tBox.height)) + region.firstLineOverflow
    let cH = this.#charHeight
    let cW = this.#charWidth
    let row = region.firstLine
    let nextLineHeight = this.#lineHeight(row)
    while(nextLineHeight != null && y > nextLineHeight) {
      y -= nextLineHeight
      row += 1
      nextLineHeight = this.#lineHeight(row)
    }
    row = min(row, this.#lines.length-1)
    let col = region.firstCol + floor(x / cW)
    if(y > cH) 
      col += floor(y / cH) * tBox.cols
    col = min(col, this.#lines[row].chars.length)
    return [row, col]
  }

  /** Update the textBox geometry. Does not access DOM layout. */
  #recalculateTextBox() {
    const margin   = this.#marginWidth
    const cBox     = this.#contentBox
    const left     = cBox.left + margin
    const height   = cBox.height
    const maxWidth = cBox.width - margin
    const width    = this.#cfgCols == null
                     ? maxWidth
                     : min(maxWidth, this.#cfgCols * this.#charWidth)
    const tBox = {
      top:      cBox.top,
      bottom:   cBox.bottom,
      height:   cBox.height,
      left:     left,
      maxWidth: maxWidth,
      width:    width,
      right:    left + width,
      maxCols:  floor(maxWidth / this.#charWidth),
      cols:     floor(width / this.#charWidth),
      rows:     floor(height / this.#charHeight),
    }
    let unchanged = true
    for(let [k,v] in Object.entries(tBox)) 
      unchanged = this.#textBox[k] == v
    this.#textBox = tBox
    return !unchanged
  }



  /***************************************************************************
   *                                                                         *
   *    ATTRIBUTES                                                           *
   *                                                                         *
   ***************************************************************************/


  static get observedAttributes() {
    return ['cols', 'wrap', 'line-nums', 'line-contrast',
      'disabled', 'readonly', 'show-boundary']
  }

  attributeChangedCallback(name, old, val) {
    switch(name) {
    case 'show-boundary':
      if(val == 'column')   this.#toggleBoundary(true)
      else if(val == 'off') this.#toggleBoundary(false)
      break
    case 'wrap':
      if(val == 'soft') this.#enableLineWrap()
      else if(val == 'off') this.#disableLineWrap()
      break
    case 'line-nums':
      if(val == 'on') this.#enableLineNumbers()
      else if(val == 'off') this.#disableLineNumbers()
      break
    case 'line-contrast':
      if(val == 'lines') this.#enableLineContrast(true)
      else if(val == 'rows') this.#enableLineContrast(false)
      else if(val == 'off') this.#disableLineContrast()
      break
    case 'readonly':
      if(val == 'true') this.#setReadOnly(true)
      else if(val == 'false') this.#setReadOnly(false)
      break
    case 'disabled':
      if(val == 'true') this.#setDisabled(true)
      else if(val == 'false') this.#setDisabled(false)
      break
    case 'cols':
      if(val == 'auto') {
        this.#setCols(null)
      } else {
        const x = Number.parseInt(val)
        this.#setCols(x)
      } 
      break
    }
  }



  /***************************************************************************
   *                                                                         *
   *    RANGE OPERATIONS                                                     *
   *                                                                         *
   ***************************************************************************/


  static isBetween(line, col, line1, col1, line2, col2) {
    if(line < line1 || line > line2)
      return false
    if(line == line1 && col < col1)
      return false
    if(line == line2 && col > col2)
      return false
    return true
  }

  static isInRange(row, col, range) {
    if(row < range.startLine || row > row.endLine)
      return false
    if(row == range.startLine && col < range.startColumn)
      return false
    if(row == range.endLine && col > range.endColumn)
      return false
    return true
  }

  /** An ordering for positions compatible with `Array.prototype.sort`. */
  static comparePoints(line1, col1, line2, col2) {
    if(line1 < line2) return -1
    if(line1 == line2 && col1 < col2) return -1
    if(line1 == line2 && col1 == col2) return 0
    return 1
  }

  /** An ordering for ranges compatible with `Array.prototype.sort`. */
  static compareRanges(a, b) {
    if(a.startLine   < b.startLine)   return -1
    if(a.startLine   > b.startLine)   return  1
    if(a.startColumn < b.startColumn) return -1
    if(a.startColumn > b.startColumn) return  1
    if(a.endLine     < b.endLine)     return -1
    if(a.endLine     > b.endLine)     return  1
    if(a.endColumn   < b.endColumn)   return -1
    if(a.endColumn   > b.endColumn)   return  1
    if(a.cls         < b.cls)         return -1
    if(a.cls         > b.cls)         return  1
    return 0
  }

  /** Return the minimum range spanning two ranges `a` and `b`. */
  static mergeRanges(a, b) {
    const r = {
      startLine:   a.startLine,
      startColumn: a.startColumn,
      startOffset: a.startOffset,
      endLine:     a.endLine,
      endColumn:   a.endColumn,
      endOffset:   a.endOffset,
    }
    if(MuchText.comparePoints(a.startLine, a.startColumn, b.startLine, b.startColumn) > 0) {
      r.startLine = b.startLine
      r.startColumn = b.startColumn
      r.startOffset = b.startOffset
    }
    if(MuchText.comparePoints(a.endLine, a.endColumn, b.endLine, b.endColumn) < 0) {
      r.endLine = b.endLine
      r.endColumn = b.endColumn
      r.endOffset = b.endOffset
    }
    return r
  }

  /** Test if `a` is contained entirely within `b`. */
  static isSubRange(a, b) {
    return comparePoints(a.startLine, a.startColumn, b.startLine, b.startColumn) >= 0 &&
           comparePoints(a.endLine, a.endColumn, b.endLine, b.endColumn) <= 0
  }

  /** Test if a position is before, within or after the specified range. */
  static relativePlacement(row, col, range) {
    if(row < range.startLine || (row == range.startLine && col < range.startColumn))
      return -1
    else if(row > range.endLine || (row == range.endLine && col > range.endColumn))
      return 1
    else
      return 0
  }



  /***************************************************************************
   *                                                                         *
   *    DOM INTERFACE GETTERS / SETTERS                                      *
   *                                                                         *
   ***************************************************************************/



  get caretPosition() {
    return [this.#caretLine, this.#caretColumn]
  }

  get cols() {
    return this.#cfgCols == null ? 'auto' : this.#cfgCols
  }

  set cols(x) {
    if(x == 'auto') {
      this.#setCols(null)
    } else {
      x = Number.parseInt(x)
      this.#setCols(x)
    }
    if(this.hasAttribute('cols'))
      this.setAttribute('cols', x.toString())
  }

  get wrap() {
    return this.#cfgLineWrap ? 'soft' : 'off'
  }

  set wrap(x) {
    if(x=='soft')
      this.#enableLineWrap()
    else if(x=='off')
      this.#disableLineWrap()
    if(this.hasAttribute('wrap'))
      this.setAttribute('wrap', x)
  }

  get lineNums() {
    return this.#cfgLineNums ? 'on' : 'off'
  }

  set lineNums(x) {
    if(x=='on')
      this.#enableLineNumbers()
    else if(x=='off')
      this.#disableLineNumbers()
    if(this.hasAttribute('line-nums'))
      this.setAttribute('line-nums', x)
  }

  get lineContrast() {
    return this.#cfgAltLines
  }

  set lineContrast(x) {
    if(x=='lines')
      this.#enableLineContrast(true)
    else if(x=='rows')
      this.#enableLineContrast(false)
    else if(x=='off')
      this.#disableLineContrast()
    if(this.hasAttribute('line-contrast'))
      this.setAttribute('line-contrast', x)
  }

  get disabled() {
    return this.#cfgDisabled
  }

  set disabled(x) {
    x = x == true
    this.#setDisabled(x)
    if(this.hasAttribute('disabled'))
      this.setAttribute('disabled', x)
  }

  get readonly() {
    return this.#cfgReadOnly
  }

  set readonly(x) {
    x = x == true
    this.#setReadOnly(x)
    if(this.hasAttribute('readonly'))
      this.setAttribute('readonly', x)
  }

  get showBoundary() {
    return this.#cfgShowBoundary ? 'column' : 'off'
  }

  set showBoundary(x) {
    if(x=='column')
      this.#toggleBoundary(true)
    else if(x=='off')
      this.#toggleBoundary(false)
    if(this.hasAttribute('show-boundary'))
      this.setAttribute('show-boundary', x)
  }



  /***************************************************************************
   *                                                                         *
   *    EDITING MODES                                                        *
   *                                                                         *
   ***************************************************************************/


  #toggleBoundary(state) {
    if(state) {
      this.#elements.doc.classList.add('show-boundary')
    } else {
      this.#elements.doc.classList.remove('show-boundary')
    }
    this.#cfgShowBoundary = state
  }

  #enableLineWrap() {
    this.#elements.doc.classList.remove('no-wrap')
    this.#cfgLineWrap = true
    this.#changed.wrapMode = true
    this.#scheduleRefresh()
  }

  #disableLineWrap() {
    this.#elements.doc.classList.add('no-wrap')
    this.#cfgLineWrap = false
    this.#changed.wrapMode = true
    this.#scheduleRefresh()
  }

  #enableLineNumbers() {
    this.#elements.doc.classList.add('show-line-nums')
    this.#elements.margin.style.display = 'contents'
    this.#marginWidth = 50
    this.#cfgLineNums = true
    if(this.#selection) this.#highlightSelection()
    this.#changed.marginWidth = true
    this.#scheduleRefresh()
  }

  #disableLineNumbers() {
    this.#elements.doc.classList.remove('show-line-nums')
    this.#elements.margin.style.display = 'none'
    this.#marginWidth = 5
    this.#cfgLineNums = false
    if(this.#selection) this.#highlightSelection()
    this.#changed.marginWidth = true
    this.#scheduleRefresh()
  }

  #enableLineContrast(useLines) {
    if(useLines) {
      this.#elements.doc.classList.add('alternating-lines')
      this.#elements.doc.classList.remove('alternating-rows')
    } else {
      this.#elements.doc.classList.remove('alternating-lines')
      this.#elements.doc.classList.add('alternating-rows')
    }
    this.#cfgAltLines = useLines ? 'lines' : 'rows'
  }

  #disableLineContrast() {
    this.#elements.doc.classList.remove('alternating-lines')
    this.#elements.doc.classList.remove('alternating-rows')
    this.#cfgAltLines = 'off'
  }

  #setReadOnly(state) {
    this.#cfgReadOnly = state
  }

  #setDisabled(state) {
    this.#cfgDisabled = state
    if(state)
      this.#elements.doc.classList.add('disabled')
    else
      this.#elements.doc.classList.remove('disabled')
    this.blur()
  }

  #setCols(state) {
    this.#cfgCols = state
    this.#changed.cols = true
    this.#scheduleRefresh()
  }



  /***************************************************************************
   *                                                                         *
   *    CLIPBOARD                                                            *
   *                                                                         *
   ***************************************************************************/


  #clipboardCut() {
    if(!this.#selection) return
    const text = this.getRange(this.#selection)
    this.deleteSelection()
    navigator.clipboard.writeText(text)
  }

  #clipboardCopy() {
    if(!this.#selection) return
    const text = this.getRange(this.#selection)
    navigator.clipboard.writeText(text)
  }

  async #clipboardPaste() {
    if(this.#selection) this.deleteSelection()
    const text = await navigator.clipboard.readText()
    this.insert(text)
  }



  /***************************************************************************
   *                                                                         *
   *    TEXT MANIPULATION                                                    *
   *                                                                         *
   ***************************************************************************/


  /** Replace the contents of the text area with a string. */
  setText(text, updateSlot=true) {
    const n = this.#lines.length-1
    this.deleteRange({startLine: 0, startColumn: 0, endLine: n, endColumn: this.#lines[n].chars.length}, true)
    this.insert(text, false, updateSlot)
  }

  /** Insert a string at the caret position. 
   *
   * Returns a [column, line] pair at the end of the inserted range. The caret
   * is optionally advanced to the end of the inserted text.
   */
  insert(text, advanceCaret=true, updateSlot=true) {
    const [line, column] = this.insertAt(this.#caretLine, this.#caretColumn, text, updateSlot)
    if(advanceCaret) {
      this.#caretLine = line
      this.#caretColumn = column
      this.#changed.caretPosition = true
      this.#scheduleRefresh()
    }
    return [line, column]
  }

  /** Insert a string at the given position. 
   *
   * Returns a [column, line] pair at the end of the inserted range.
   */
  insertAt(row, col, text, updateSlot=true, inputType='insertText') {
    // Update line data
    const line = this.#lines[row]
    const rest = line.chars.slice(col)
    const zone = this.findExtendedRange({startLine:row,startColumn:col,endLine:row,endColumn:col})
    const ranges = line.ranges.filter(r => !(r.endLine == row && r.endColumn < col))
    const textLines = text.split('\n')
    line.chars.splice(col, rest.length, ...Array.from(textLines[0]))
    line.dirty = true
    const newLines = textLines.slice(1).map((str, i) => ({
      chars:   Array.from(str),
      dirty:   true,
      element: createElement('div', {className: 'line', innerText: str}),
      ranges:  ranges.slice(),
    }))
    this.#lines.splice(row+1, 0, ...newLines)
    const last = this.#lines[row+newLines.length]
    last.chars.splice(last.chars.length, 0, ...rest)
    if(newLines.length > 0) last.element.append(rest.join(''))
    const nLines = newLines.length
    const lastLen = textLines[textLines.length-1].length
    const tailPosition = [row + nLines, nLines > 0 ? lastLen : col + lastLen]

    // Update ranges
    for(let range of this.ranges) {
      if(range.startLine == row && range.startColumn >= col) {
        if(textLines.length == 1) {
          range.startColumn += textLines[0].length
        } else {
          range.startLine += nLines
          range.startColumn = textLines[0].length + (range.startColumn - col)
          line.ranges.splice(line.ranges.indexOf(range),1)
        }
      } else if(range.startLine > row) {
        range.startLine += nLines
      }
      if(range.endLine == row && range.endColumn > col) {
        if(textLines.length == 1) {
          range.endColumn += textLines[0].length
        } else {
          range.endLine += nLines
          range.endColumn = textLines[0].length + (range.endColumn - col)
          if(range.startLine == row && range.startColumn >= col)
            line.ranges.splice(line.ranges.indexOf(range),1)
        }
      } else if(range.endLine > row) {
        range.endLine += nLines
      }
    }

    // Update DOM
    if(updateSlot) {
      const offset = this.#lines.slice(0,row).reduce((acc,x) => acc+x.chars.length+1, 0) + col
      this.#elements.textNode.insertData(offset, text)
    }
    //  this.#updatedSlot = true
    //}
    const affectedRange = {
      startLine: row,
      startColumn: col,
      endLine: tailPosition[0],
      endColumn: nLines == 0 ? tailPosition[1]
                             : last.chars.length,
    }
    const ev = new MuchInputEvent('input', {
      affectedRange,
      extendedRange: MuchText.mergeRanges(zone, this.findExtendedRange(affectedRange)),
      //extendedRange: this.findExtendedRange(affectedRange),
      // From InputEvent:
      inputType,
      data: text,
      dataTransfer: null,
      isComposing: false,
      ranges: null, // disabled - not supported in chrome yet
      // From UIEvent:
      detail: 0,
      view: null,
      sourceCapabilties: null,
      // From Event:
      bubbles: false,
      cancelable: false,
      composed: false,
    })
    this.dispatchEvent(ev)
    line.element.after(...newLines.map(x => x.element))
    if(nLines > 0) {
      this.#changed.lineCount = true
    }
    this.#changed.textContent = true
    this.#changed.caretPosition = true
    this.#scheduleRefresh()
    
    return tailPosition
  }

  /** Delete the text between two positions.
   *
   * The caret is optionally moved to the start of the deleted range.
   */
  deleteRange(range, moveCaret=true, inputType='deleteContent') {
    const {startLine,startColumn,endLine,endColumn} = range
    if(startLine==endLine && startColumn==endColumn) return
    const nLines = endLine - startLine
    const offset = this.offsetOf(startLine, startColumn)
    const len = this.rangeLength(startLine, startColumn, endLine, endColumn) 
    this.#elements.textNode.deleteData(offset, len)
    const start = this.#lines[startLine]
    const end = this.#lines[endLine]
    if(nLines == 0) {
      if(endColumn - startColumn == 0) return
      start.chars.splice(startColumn, endColumn-startColumn)
      start.dirty = true
    } else {
      start.chars.splice(startColumn, 
        start.chars.length - startColumn,
        ...end.chars.slice(endColumn))
      this.#lines.slice(startLine+1, endLine+1).forEach(e => e.element.remove())
      this.#lines.splice(startLine+1, nLines)
      start.dirty = true
      if(this.#lines.length > startLine+1) {
        this.#lines[startLine+1].dirty = true
      }
      this.#changed.lineCount = true
    }

    // Update annotations
    let i = 0
    while(i < this.ranges.length) {
      let annot = this.ranges[i]
      const relStart = MuchText.relativePlacement(annot.startLine, annot.startColumn, range)
      const relEnd = MuchText.relativePlacement(annot.endLine, annot.endColumn, range)
      if(relEnd < 0) {
        i++
      } else if(relEnd == 0 && relStart < 0) {
        annot.endLine = range.startLine
        annot.endColumn = range.startColumn
        i++
      } else if(relEnd == 0 && relStart == 0) {
        this.ranges.splice(i, 1)
      } else if(relEnd > 0 && relStart < 0) {
        annot.endLine -= nLines
        if(annot.endLine == range.endLine) 
          annot.endColumn -= range.endColumn
        i++
      } else if(relEnd > 0 && relStart == 0) {
        annot.startLine = range.startLine
        annot.startColumn = range.startColumn
        annot.endLine -= nLines
        if(annot.endLine == range.endLine) 
          annot.endColumn -= range.endColumn
        i++
      } else if(relEnd > 0 && relStart > 0) {
        break
      }
    }
    if(moveCaret) {
      this.#caretLine = startLine
      this.#caretColumn = startColumn
      this.#changed.caretPosition = true
    }
    const affectedRange = {
      startLine,
      startColumn,
      endLine: startLine,
      endColumn: startColumn,
    }
    const ev = new MuchInputEvent('input', {
      affectedRange,
      extendedRange: this.findExtendedRange(affectedRange),
      // From InputEvent:
      inputType,
      data: null,
      dataTransfer: null,
      isComposing: false,
      // disabled - not supported in chrome yet
      //ranges: [new StaticRange({
      //  startContainer: this.#elements.textNode,
      //  startOffset: offset,
      //  endContainer: this.#elements.textNode,
      //  endOffset: offset + text.length,
      //})],
      // From UIEvent:
      detail: 0,
      view: null,
      sourceCapabilties: null,
      // From Event:
      bubbles: false,
      cancelable: false,
      composed: false,
    })
    this.dispatchEvent(ev)
    this.#changed.textContent = true
    this.#scheduleRefresh()
  }

  rangeLength(startLine, startColumn, endLine, endColumn) {
    let c = startColumn
    let acc = -1 // account for no newline on final line
    for(let i=startLine; i<=endLine; i++) {
      const x = i==endLine ? endColumn 
                           : this.#lines[i].chars.length
      acc += x-c + 1
      c = 0
    }
    return acc
  }

  /** Get the text spanning between two points. */
  getRange(range) {
    return getSlice(this.#lines, range.startLine, range.startColumn, 
      range.endLine, range.endColumn)
  }

  /** Get the character index of a line,column position. */
  offsetOf(row, col) {
    return this.#lines.slice(0,row).reduce((acc,x) => acc+x.chars.length+1, 0) + col
  }



  /***************************************************************************
   *                                                                         *
   *    ANNOTATIONS                                                          *
   *                                                                         *
   ***************************************************************************/


  mark(startLine, startColumn, endLine, endColumn, cls) {
    // Make sure range is in bounds and not backwards
    startLine = max(0, min(startLine, this.#lines.length-1))
    endLine = max(startLine, min(endLine, this.#lines.length-1))
    startColumn = max(0, min(startColumn, this.#lines[startLine].chars.length))
    endColumn = startLine == endLine
      ? max(startColumn, min(endColumn, this.#lines[startLine].chars.length))
      : max(0, min(endColumn, this.#lines[endLine].chars.length))


    // Add to ranges list without messing up the order, don't add duplicates
    const range = {startLine, startColumn, endLine, endColumn, cls}
    let i = this.ranges.findIndex(r => MuchText.compareRanges(range, r) >= 0)
    if(i == -1 || MuchText.compareRanges(range, this.ranges[i]) > 0) {
      this.ranges.splice(i, 0, range)
      for(let j=startLine; j<=endLine; j++) {
        this.#lines[j].ranges.push(range)
        this.#lines[j].dirty = true
      }
    }
  }

  clearMarkings() {
    this.ranges = []
    this.#lines.forEach((line,i) => {
      line.ranges.splice(0, line.length)
      line.dirty = true
    })
  }

  /** Efficiently replace the markings that start in a given range.
   * 
   * `from` and `to` specify the range of lines (inclusive). The replacements
   *  must be sorted by start position.
   *
   * Note to self: ensure internal ranges list is kept ordered too! 
   */
  replaceMarkings(region, newRanges) {

    // Determine existing ranges starting in the given region
    const oldMin = max(0, this.ranges.findIndex(r => 
      r.startLine > region.startLine || 
      (r.startLine == region.startLine && r.startColumn >= region.startColumn)))
    let oldMax = this.ranges.findIndex(r => 
      r.startLine > region.endLine ||
      (r.startLine == region.endLine && r.startColumn > region.endColumn))
    if(oldMax == -1) oldMax = this.ranges.length
    const oldRanges = this.ranges.slice(oldMin, oldMax)

    let i = 0      // index into newRanges
    let j = 0      // index into oldRanges
    let c = oldMin // index into live ranges

    
    for(let k=region.startLine; k<=min(this.#lines.length-1, region.endLine); k++)
      this.#lines[k].ranges = this.#lines[k].ranges.filter(r =>
        r.startLine < region.startLine ||
        (r.startLine == region.startLine && r.startColumn < region.startColumn))
    
    while(i < newRanges.length || j < oldRanges.length) {
      let rNew     = newRanges[i]
      let rOld     = oldRanges[j]
      let purgeOld = false
      let addNew   = false
      let gotMatch = false

      if(!rNew)      purgeOld = true
      else if(!rOld) addNew   = true
      else {
        let cmp = MuchText.compareRanges(rOld, rNew)
        if(cmp < 0)       purgeOld = true
        else if(cmp == 0) gotMatch = true
        else              addNew   = true
      }

      if(purgeOld) {
        for(let k = rOld.startLine; k <= rOld.endLine; k++) {
          const line = this.#lines[k]
          if(k > region.endLine) line.ranges.splice(line.ranges.indexOf(rOld), 1)
          if(!rOld.hidden)       line.dirty = true
        }
        this.ranges.splice(c, 1)
        j++
      } else if(addNew) {
        for(let k = rNew.startLine; k <= rNew.endLine; k++) {
          const line = this.#lines[k]
          line.ranges.push(rNew)
          if(!rNew.hidden) line.dirty = true
        }
        this.ranges.splice(c, 0, rNew)
        i++ ; c++
      } else if(gotMatch) {
        for(let k = rOld.startLine; k <= rOld.endLine; k++) {
          this.#lines[k].ranges.push(rOld)
          // TODO: copy over other details potentially?
        }
        i++ ; j++ ; c++
      }
    }

    this.#changed.markings = true
    this.#scheduleRefresh()
  }

  #markingsAt(row, col) {
    const line = this.#lines[row]
    return line.ranges.filter(r => MuchText.isInRange(row, col, r))
  }

  findExtendedRange(range) {
    const start = [range.startLine, range.startColumn]
    let startMarks = this.#markingsAt(start[0], start[1])
    let newStart = [start[0], start[1]]
    let foundStart = false
    while(!foundStart) {
      for(let i=0; i<startMarks.length; i++) {
        let mark = startMarks[i]
        if(mark.startLine < start[0] || (mark.startLine == start[0] && mark.startColumn < start[1])) {
          newStart[0] = mark.startLine
          newStart[1] = mark.startColumn
        }
      }
      if(newStart[0] == start[0] && newStart[1] == start[1]) {
        foundStart = true
      } else {
        start[0] = newStart[0]
        start[1] = newStart[1]
        startMarks = this.#markingsAt(start[0], start[1])
      }
    }
    const end = [range.endLine, range.endColumn]
    let endMarks = this.#markingsAt(end[0], end[1])
    let newEnd = [end[0], end[1]]
    let foundEnd = false
    while(!foundEnd) {
      for(let i=0; i<endMarks.length; i++) {
        let mark = endMarks[i]
        if(mark.endLine > end[0] || (mark.endLine == end[0] && mark.endColumn > end[1])) {
          newEnd[0] = mark.endLine
          newEnd[1] = mark.endColumn
        }
      }
      if(newEnd[0] == end[0] && newEnd[1] == end[1]) {
        foundEnd = true
      } else {
        end[0] = newEnd[0]
        end[1] = newEnd[1]
        endMarks = this.#markingsAt(end[0], end[1])
      }
    }
    return {
      startLine:   start[0],
      startColumn: start[1],
      startOffset: this.offsetOf(start[0], start[1]),
      endLine:     end[0],
      endColumn:   end[1],
      endOffset:   this.offsetOf(end[0], end[1]),
    } 
  }



  /***************************************************************************
   *                                                                         *
   *    SELECTION                                                            *
   *                                                                         *
   ***************************************************************************/


  get selectedRange() {
    if(!this.#selection) return null
    else return {...this.#selection}
  }

  #startSelection() {
    if(this.#selection) this.clearSelection()
    this.#selection = {
      startLine:   this.#caretLine,
      startColumn: this.#caretColumn,
      endLine:     this.#caretLine,
      endColumn:   this.#caretColumn,
      element:     createElement('div', {className: 'selection'}),
    }
    this.#elements.doc.appendChild(this.#selection.element)
    this.#elements.doc.classList.add('select')
  }

  #addLineSelection(lineNumber, offset, from, to) {
    const line = this.#lines[lineNumber]
    const eSelection = this.#selection.element
    if(to == null) to = line.chars.length
    //const lineTop = eLine.offsetTop
    const width = this.#textBox.cols
    const margin = this.#marginWidth

    if(to <= width || !this.#cfgLineWrap) {
      const e = createElement('div', {className: 'line-selection'})
      e.style.top   = `calc(${offset.top}px + ${offset.row}*(1em + 1ex))`
      e.style.left  = `calc(${margin}px + ${from}ch)`
      e.style.width = `calc(${to-from}ch)`
      eSelection.appendChild(e)
      offset.row++
    } else {
      const fromRow = floor(from / width)
      const toRow = floor(to / width)
      let left = from % width
      for(let i=fromRow; i<=toRow; i++) {
        const right = i<toRow ? width : (to % width)
        const e = createElement('div', {className: 'line-selection'})
        e.style.top   = `calc(${offset.top}px + ${offset.row}*(1em + 1ex))`
        e.style.left  = `calc(${margin}px + ${left}ch)`
        e.style.width = `calc(${right - left}ch)`
        eSelection.appendChild(e)
        left = 0
        offset.row++
      }
    }
  }

  /** Render the selection. Affects DOM and styles. */
  #highlightSelection() {
    const selection = this.#selection
    if(!selection) throw 'no selection'
    Array.from(selection.element.children).map(e => e.remove())
    const isBackwards = 
      selection.endLine < selection.startLine || 
      selection.endLine == selection.startLine && selection.endColumn < selection.startColumn

    const startLine   = isBackwards ? selection.endLine : selection.startLine
    const endLine     = isBackwards ? selection.startLine : selection.endLine
    const startColumn = isBackwards ? selection.endColumn : selection.startColumn
    const endColumn   = isBackwards ? selection.startColumn : selection.endColumn
    
    let left = startColumn
    let offset = {
      top: this.#lines[startLine].element.offsetTop,
      row: 0,
    }
    for(let i=startLine; i<=endLine; i++) {
      let right = i==endLine ? endColumn : null
      this.#addLineSelection(i, offset, left, right)
      left = 0
    }
  }

  #selectToCaret() {
    const selection = this.#selection
    if(!selection) throw 'no selection'
    selection.endLine   = this.#caretLine
    selection.endColumn = this.#caretColumn
    this.#changed.selection = true
    this.#scheduleRefresh()
  }

  clearSelection() {
    if(!this.#selection) return
    this.#selection.element.remove()
    this.#elements.doc.classList.remove('select')
    this.#selection = null
  }

  getSelection() {
    if(!this.#selection) return ''
    const selection = this.#selection
    const isBackwards = 
      selection.endLine < selection.startLine || 
      selection.endLine == selection.startLine && selection.endColumn < selection.startColumn
    const startLine   = isBackwards ? selection.endLine : selection.startLine
    const endLine     = isBackwards ? selection.startLine : selection.endLine
    const startColumn = isBackwards ? selection.endColumn : selection.startColumn
    const endColumn   = isBackwards ? selection.startColumn : selection.endColumn
    return this.getRange(startLine, startColumn, endLine, endColumn)
  }

  deleteSelection() {
    if(!this.#selection) return
    const selection = this.#selection
    const isBackwards = 
      selection.endLine < selection.startLine || 
      selection.endLine == selection.startLine && selection.endColumn < selection.startColumn
    const startLine   = isBackwards ? selection.endLine : selection.startLine
    const endLine     = isBackwards ? selection.startLine : selection.endLine
    const startColumn = isBackwards ? selection.endColumn : selection.startColumn
    const endColumn   = isBackwards ? selection.startColumn : selection.endColumn
 
    this.deleteRange({startLine, startColumn, endLine, endColumn}, true)
 
    this.#selection.element.remove()
    this.#selection = null
  }

  /** Select text within a given range, clobbering any previous selection. */
  #selectRange(range) {
    this.#startSelection()
    this.#selection.startLine = range.startLine
    this.#selection.startColumn = range.startColumn
    this.#selection.endLine = range.endLine
    this.#selection.endColumn = range.endColumn
    this.#changed.selection = true
    this.#scheduleRefresh()
  }

  /** Select a region contained between the nearest whitespace to the caret. */
  #selectWord() {
    const row = this.#caretLine
    const line = this.#lines[row]
    let from, to
    for(from = this.#caretColumn; from > 0; from--)
      if(line.chars[from] == ' ' || line.chars[from] == '\t') break
    for(to = this.#caretColumn; to < line.chars.length; to++)
      if(line.chars[to] == ' ' || line.chars[to] == '\t') break
    this.#selectRange({startLine: row, startColumn: from + 1, endLine: row, endColumn: to})
  }



  /***************************************************************************
   *                                                                         *
   *    UI STATE UPDATE / REFRESH                                            *
   *                                                                         *
   ***************************************************************************/


  /** Queue an update element following a change in geometry. */ 
  #scheduleRefresh() {
    if(this.#refreshScheduled) return
    //window.queueMicrotask(() => {
    //  this.#refresh()
    //  this.#refreshScheduled = false
    //})
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.#refresh()
        this.#refreshScheduled = false
      }, 0)
    })
    this.#refreshScheduled = true
  }

  /** Update element following a change in geometry. 
   *
   * Don't call this synchronously, use `#scheduleRefresh` instead.
   */
  #refresh() {
    if(
      !this.isConnected ||
      !this.#contentBox
      ) return
    const changed = this.#changed

    // First determine what is to be done...
    let refreshTextBox        = false
    let refreshStyles         = false   
    let refreshVisibleRegion  = false
    let refreshVisibleContent = false
    let refreshCaret          = false
    let refreshLineNumbers    = false
    let refreshSelection      = false

    if(changed.cols) {
      refreshTextBox         = true
      refreshStyles          = true
      refreshVisibleRegion   = true
      changed.cols           = false
    }
    if(changed.markings) {
      refreshVisibleContent  = true
      changed.markings       = false
    }
    if(changed.contentBox) {
      refreshTextBox         = true
      refreshStyles          = true
      refreshVisibleRegion   = true
      changed.contentBox     = false
    }
    if(changed.caretSize) {
      refreshTextBox         = true
      refreshStyles          = true
      refreshVisibleRegion   = true
      changed.caretSize      = false
    }
    if(changed.marginWidth) {
      refreshTextBox         = true
      refreshVisibleRegion   = true
      refreshStyles          = true
      changed.marginWidth    = false
    }
    if(changed.scrollPosition) {
      refreshVisibleRegion   = true
      changed.scrollPosition = false
    }
    if(changed.caretPosition) {
      refreshCaret           = true
      changed.caretPosition  = false
    }
    if(changed.lineCount) {
      refreshLineNumbers     = true
      refreshVisibleRegion   = true
      changed.lineCount      = false
    }
    if(changed.textContent) {
      refreshVisibleContent  = true
      changed.textContent    = false
    }
    if(changed.wrapMode) {
      refreshTextBox         = true
      refreshVisibleRegion   = true
      refreshStyles          = true
      refreshCaret           = true
      refreshSelection       = true
      changed.wrapMode       = false
    }
    if(changed.selection) {
      refreshSelection       = true
      changed.selection      = false
    }

    // ...then do it
    let visibleRegionChanged = false
    if(refreshTextBox) 
      this.#recalculateTextBox()
    if(refreshLineNumbers) 
      this.#updateLineNumbers()
    if(refreshVisibleRegion) 
      visibleRegionChanged = this.#determineVisibleRegion()
    if(refreshVisibleContent || visibleRegionChanged)
      this.#updateVisibleRegion()
    if(refreshSelection && this.#selection) 
      this.#highlightSelection()
    if(refreshStyles) 
      this.#updateStyles()
    if(refreshCaret)
      this.#updateCaret()
  }

  #updateStyles() {
    const style  = this.#elements.doc.style
    const margin = this.#marginWidth
    const wrap   = this.#cfgLineWrap
    const cBox   = this.#contentBox
    const tBox   = this.#textBox

    style.setProperty('--margin-width',   `${margin}px`)
    style.setProperty('--boundary-left',  `calc(${margin+tBox.width}px + 0.5ch)`)
    if(wrap) {
      style.setProperty('--line-width',     `${tBox.cols}ch`)
      style.setProperty('--line-min-width', `${tBox.cols}ch`)
      style.setProperty('--dead-width',     `${tBox.maxWidth-tBox.width}px`)
    } else {
      style.setProperty('--line-width',      `fit-content`)
      style.setProperty('--line-min-width',  `${tBox.maxCols}ch`)
      style.setProperty('--dead-width',      `100%`)
    }
  }

  #updateLineNumbers() {
    let nHave = this.#elements.margin.children.length
    const nNeed = this.#lines.length
    let nExtra = nHave - nNeed
    while(nExtra > 0) {
      this.#elements.margin.lastElementChild.remove()
      nExtra--
    }
    while(nExtra < 0) {
      const e = createElement('div', {className: 'line-number'})
      e.innerText = nHave + 1
      this.#elements.margin.appendChild(e)
      nHave++
      nExtra++
    }
    // Repeat process for overflow area
    nHave = this.#elements.overflowArea.children.length
    nExtra = nHave - nNeed
    while(nExtra > 0) {
      this.#elements.overflowArea.lastElementChild.remove()
      nExtra--
    }
    while(nExtra < 0) {
      const e = createElement('div', {className: 'line-overflow'})
      this.#elements.overflowArea.appendChild(e)
      nHave++
      nExtra++
    }
  }

  #updateVisibleRegion() {
    const region = this.#visibleRegion
    for(let i=region.firstLine; i<=region.lastLine; i++) {
      this.#updateLine(i)
    }
  }

  /** [Re-]render a line of text. */
  #updateLine(i) {
    const line = this.#lines[i]
    const region = this.#visibleRegion
    if(!line || !line.dirty || !(i >= region.firstLine && i <= region.lastLine)) return
    

    const domRange = document.createRange()
    domRange.selectNodeContents(line.element)
    domRange.deleteContents()

    if(line.ranges.length == 0) {
      line.element.innerText = line.chars.join('')
      line.dirty = false
      return
    }

    const ranges = line.ranges.filter(r => !r.hidden)
    const starts = ranges.filter(r => r.startLine == i && r.startColumn > 0)
      .sort((a,b) => a.startColumn - b.startColumn)
    const ends = ranges.filter(r => r.endLine == i && r.endColumn > 0)
      .sort((a,b) => a.endColumn - b.endColumn)
    const active = new Set(ranges.filter(r => r.startLine < i || (r.startLine == i && r.startColumn == 0))
      .filter(r => !(r.endLine == i && r.endColumn == 0))) // second filter unnecessary? 
    let startIdx = 0
    let endIdx = 0
    let cur = 0
    while(startIdx < starts.length || endIdx < ends.length) {
      const classes = Array.from(active).map(r => r.cls).join(' ')
      const nextStart = startIdx < starts.length ? starts[startIdx].startColumn : Infinity
      const nextEnd = endIdx < ends.length ? ends[endIdx].endColumn : Infinity
      let n = 0
      if(nextStart < nextEnd) {
        active.add(starts[startIdx])
        startIdx++
        n = nextStart - cur
      } else if(nextStart == nextEnd) {
        active.add(starts[startIdx])
        active.delete(ends[endIdx])
        startIdx++
        endIdx++
        n = nextStart - cur
      } else {
        active.delete(ends[endIdx])
        endIdx++
        n = nextEnd - cur
      }
      const span = createElement('span', {className: classes, part: classes})
      span.innerText = line.chars.slice(cur, cur+n).join('')
      line.element.appendChild(span)
      cur += n
    }
    if(cur < line.chars.length) {
      const classes = Array.from(active).map(r => r.cls).join(' ')
      if(classes.length > 0) {
        const span = createElement('span', {className: classes, part: classes})
        span.innerText = line.chars.slice(cur, line.chars.length).join('')
        line.element.appendChild(span)
      } else {
        const text = document.createTextNode(line.chars.slice(cur, line.chars.length).join(''))
        line.element.appendChild(text)
      }
    }
    line.dirty = false
  }

  #updateCaret() {
    const cL = min(this.#lines.length-1, this.#caretLine)
    const cC = this.#caretColumn
    const ln = this.#lines[cL].element
    const h = this.#charHeight
    const margin = this.#marginWidth
    const tBox = this.#textBox
    const top = ln.offsetTop // this.#lineOffset(cL)
    if(cC > tBox.cols && this.#cfgLineWrap) {
      const n = floor(cC / tBox.cols)
      const rem = cC % tBox.cols
      this.#elements.caret.style.left = `calc(${margin}px + ${rem}ch)`
      this.#elements.caret.style.top = `${top + n*h}px` //`calc(${cL} * (1em + 1ex))`
    } else if(ln) {
      this.#elements.caret.style.left = `calc(${margin}px + ${cC}ch)`
      this.#elements.caret.style.top = `${top}px` //`calc(${cL} * (1em + 1ex))`
    }
    // Make sure the caret is not in the invisble part of its blink cycle
    this.#caretBlink.cancel()
    this.#caretBlink.play()
    // Highlight the current line
    if(this.#isFocused)
      if(ln != this.#elements.curLine) {
        if(this.#elements.curLine) {
          this.#elements.curLine.classList.remove('active')
          this.#elements.curLine.part.remove('active-line')
        }
        if(this.#elements.curLineNum) {
          this.#elements.curLineNum.classList.remove('active')
          this.#elements.curLineNum.part.remove('active-line')
        }
        if(this.#elements.curLineOver) {
          this.#elements.curLineOver.classList.remove('active')
          this.#elements.curLineOver.part.remove('active-line')
        }
        this.#elements.curLine = this.#lines[cL].element
        this.#elements.curLineNum = this.#elements.margin.children[cL]
        this.#elements.curLineOver = this.#elements.overflowArea.children[cL]
        this.#elements.curLine?.classList.add('active')
        this.#elements.curLineNum?.classList.add('active')
        this.#elements.curLineOver?.classList.add('active')
        this.#elements.curLine?.part.add('active-line')
        this.#elements.curLineNum?.part.add('active-line')
        this.#elements.curLineOver?.part.add('active-line')
      }
  }



  /***************************************************************************
   *                                                                         *
   *    EVENT HANDLING                                                       *
   *                                                                         *
   ***************************************************************************/


  #handlePointerDown(ev) {
    if(this.#ctxMenuOpen) {
      this.#closeContextMenu()
    }
    if(ev.button != 0) return
    if(this.#cfgDisabled) return
    const tBox = this.#textBox
    const [x, y] = [ev.clientX - tBox.left, ev.clientY - tBox.top]
    const [line, column] = this.nearestPosition(x, y)
    
    if(this.#selection) {
      this.#caretLine = line
      this.#caretColumn = column
      if(!ev.shiftKey) {
        this.clearSelection()
        this.#startSelection()
      } else {
        this.#selectToCaret()
      }
    } else if(ev.shiftKey) {
      this.#startSelection()
      this.#caretLine = line
      this.#caretColumn = column
      this.#selectToCaret()
    } else {
      this.#caretLine = line
      this.#caretColumn = column
      this.#startSelection()
    }

    this.#isDragging = true
    //this.#elements.text.setPointerCapture(ev.pointerId)
    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }

  /** Handle click events (other than those already handled on pointerdown). */
  #handleClick(ev) {
    if(this.#ctxMenuOpen) this.#closeContextMenu()
    else if(this.#cfgDisabled || ev.detail < 2) return
    else this.#selectWord()
  }

  #handlePointerMove(ev) {
    if(!this.#isDragging) return
    const tBox = this.#textBox
    const [x, y] = [ev.clientX - tBox.left, ev.clientY - tBox.top]
    const [line, column] = this.nearestPosition(x, y)
    this.#caretLine = line
    this.#caretColumn = column
    this.#selectToCaret()
  }

  #handlePointerUp(ev) {
    if(ev.button != 0) return
    if(this.#isDragging) {
      const sel = this.#selection
      if(sel && sel.startLine == sel.endLine && sel.startColumn == sel.endColumn)
        this.clearSelection()
    //  this.#elements.text.releasePointerCapture(ev.pointerId)
    }
    this.#isDragging = false
  }

  #handleContextMenu(ev) {
    ev.preventDefault()
  }

  #handleScroll(ev) {
    this.#visibleRegion.scrollX = this.scrollLeft
    this.#visibleRegion.scrollY = this.scrollTop
    this.#changed.scrollPosition = true
    this.#scheduleRefresh()
  }

  #handleFocus(ev) {
    if(this.#cfgDisabled) {
      this.blur()
    } else {
      this.#isFocused = true
      if(this.#elements.curLine) this.#elements.curLine.part.add('active-line')
      if(this.#elements.curLineNum) this.#elements.curLineNum.part.add('active-line')
      if(this.#elements.curLineOver) this.#elements.curLineOver.part.add('active-line')
      this.#updateCaret()
    }
  }

  #handleBlur(ev) {
    this.#isFocused = false
    if(this.#elements.curLine) this.#elements.curLine.part.remove('active-line')
    if(this.#elements.curLineNum) this.#elements.curLineNum.part.remove('active-line')
    if(this.#elements.curLineOver) this.#elements.curLineOver.part.remove('active-line')
  }

  #handleKeyDown(ev) {
    if(ev.isComposing || ev.keyCode === 229) return
   
    const isMod = (isMac && ev.metaKey) || (!isMac && ev.ctrlKey)
    switch(ev.code) {
      case 'Enter':      ev.preventDefault(); this.#keyEnter(ev); break
      case 'Backspace':  ev.preventDefault(); this.#keyBackspace(ev); break
      case 'Escape':     ev.preventDefault(); this.#keyEscape(ev); break
      case 'ArrowLeft':  ev.preventDefault(); this.#keyArrowLeft(ev); break
      case 'ArrowRight': ev.preventDefault(); this.#keyArrowRight(ev); break
      case 'ArrowUp':    ev.preventDefault(); this.#keyArrowUp(ev); break
      case 'ArrowDown':  ev.preventDefault(); this.#keyArrowDown(ev); break
      case 'Home':       ev.preventDefault(); this.#keyHome(ev); break
      case 'End':        ev.preventDefault(); this.#keyEnd(ev); break
      case 'KeyA':       if(isMod) { ev.preventDefault(); this.#keyModA(ev); break }
      case 'KeyC':       if(isMod) { ev.preventDefault(); this.#keyModC(ev); break }
      case 'KeyX':       if(isMod) { ev.preventDefault(); this.#keyModX(ev); break }
      case 'KeyV':       if(isMod) { ev.preventDefault(); this.#keyModV(ev); break }
      default:
        if(ev.location == KeyboardEvent.DOM_KEY_LOCATION_STANDARD
           && !ev.ctrlKey) {
          this.#keyTextInput(ev)
          ev.preventDefault()
        } else {
          //console.log(ev.key)
        }
    }

    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }

  #handleSlotChange(ev) {
    this.#elements.textNode = this.childNodes[0]
    
    if(this.#updatedSlot) {
      this.#updatedSlot = false
      console.log('ignoring self-update')
    } else {
      const text = this.#elements.slot.assignedNodes()[0].data
      this.setText(text, false)
    }
  }



  /***************************************************************************
   *                                                                         *
   *    KEYSTROKE ACTIONS                                                    *
   *                                                                         *
   ***************************************************************************/


  #keyEnter(ev) {
    if(this.#cfgReadOnly) return
    if(this.#selection)
      this.deleteSelection()
    this.insert('\n')
  }

  #keyBackspace(ev) {
    if(this.#cfgReadOnly) return
    if(this.#selection) {
      this.deleteSelection()
      return
    }
    const endLine = this.#caretLine
    const endColumn = this.#caretColumn
    let startLine = endLine
    let startColumn = endColumn - 1
    if(startColumn < 0) {
      if(startLine == 0) return
      startLine--
      startColumn = this.#lines[startLine].chars.length
    }
    this.deleteRange({startLine, startColumn, endLine, endColumn}, true)
  }

  #keyEscape(ev) {
    if(this.#selection)
      this.clearSelection()
  }

  #keyArrowLeft(ev) {
    const line = this.#lines[this.#caretLine].chars
    if(ev.shiftKey && !this.#selection)
      this.#startSelection()
    if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    else if(this.#caretColumn > 0)
      this.#caretColumn -= 1
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyArrowRight(ev) {
    const line = this.#lines[this.#caretLine].chars
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    else if(this.#caretColumn < line.length) 
      this.#caretColumn += 1
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyArrowUp(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    if(this.#caretLine > 0) {
      this.#caretLine -= 1
      const newLine = this.#lines[this.#caretLine].chars
      this.#caretColumn = Math.min(this.#caretColumn, newLine.length)
    }
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyArrowDown(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    if(this.#caretLine+1 < this.#lines.length) {
      this.#caretLine += 1
      const newLine = this.#lines[this.#caretLine].chars
      this.#caretColumn = Math.min(this.#caretColumn, newLine.length)
    }
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyModA(ev) {
    if(this.#selection) this.clearSelection()
    const caretLine = this.#caretLine
    const caretColumn = this.#caretColumn
    this.#caretLine = 0
    this.#caretColumn = 0
    this.#startSelection()
    this.#caretLine = this.#lines.length-1
    this.#caretColumn = this.#lines[this.#caretLine].chars.length
    this.#selectToCaret()
  }

  #keyModC(ev) {
    this.#clipboardCopy()
  }

  #keyModX(ev) {
    if(this.#cfgReadOnly) 
      this.#clipboardCopy()
    else
      this.#clipboardCut()
  }

  #keyModV(ev) {
    this.#clipboardPaste()
  }

  #keyHome(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    this.#caretColumn = 0
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyEnd(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    this.#caretColumn = line.length
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyTextInput(ev) {
    if(this.#cfgReadOnly) return 
    if(this.#selection) this.deleteSelection()
    this.insert(ev.key)
  }

}

customElements.define('much-text', MuchText)


return MuchText
})()


