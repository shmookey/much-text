export const MuchText = (() => {

const { ceil, floor, min, max } = Math

const isMac = navigator.platform.indexOf('Mac') > -1
function formatKeyCombo(isMod, isShift, key) {
  let buf = ""
  if(isMac) {
    if(isMod)   buf += "⌘"
    if(isShift) buf += "⇧"
  } else {
    if(isMod)   buf += "Ctrl+"
    if(isShift) buf += "Shift+"
  }
  buf += key.toUpperCase()
  return buf
}

// TODO: internally style using parts instead of ids
const htmlSource = `
<style>
:root {
}
* {
  box-sizing:      border-box;
}
:host {
  display:         flow-root;
  appearance:      textarea;
  outline:          1px solid #707070;
  overflow:        auto auto;
  font-family:     Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace, serif;
  font-size:       13px;
  /*font-family:     monospace;
  font: 400 13.3333px Arial;*/
  font-kerning:    none;
  hanging-punctuation: none;
  font-variant-numeric: tabular-nums;
  resize:          auto;
  cursor:          text;
  contain:         size layout;
}
slot {
  display:         none;
}
#doc {
  --line-width:     80ch;
  --line-min-width: 80ch;
  --dead-width:     100%;
  --margin-width:   50px;
  --boundary-left:  0px;
  --line-height:    (15px);
  /*padding-top:     2px;*/
  user-select:     none;
  position:        relative;
  display:         grid;
  outline:         none;
  /*overflow-x:      hidden;*/
  grid-auto-rows:  minmax(calc(var(--line-height)), min-content);
  grid-auto-flow:  dense;
  overflow-wrap:   anywhere;
  white-space:     break-spaces;
  word-break:      break-all;
  line-break:      anywhere;
  hyphens:         none;
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
#caret {
  display:         inline-block;
  font-family:     Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace, serif;
  font-size:       13px;
  height:          calc(var(--line-height));
  width:           1ch;
  position:        absolute;
  border-left:     1px solid #08080F;
  opacity:         0;
}
#doc:focus #caret {
  opacity:         1;
}
#doc.select:focus #caret {
  opacity:         0;
}
.line-selection {
  height:          calc(var(--line-height));
  backdrop-filter: sepia(50%) hue-rotate(30deg) invert(100%);
  position:        absolute;
  min-width:       1ch;
}
.line, #placeholder {
  grid-column:     2;
  display:         inline-block;
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
#doc.show-boundary #boundary {
  visibility:      visible;
}
.line, .line-number, .line-overflow, #placeholder {
  line-height:     calc(var(--line-height));
  vertical-align:  middle;
}
#margin {
  display:         none;
}
#doc.show-line-nums #margin {
  display:         contents;
}
#overflow-area, #text, .selection {
  display:         contents;
}
.line *, .line-selection, #caret, #placeholder {
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
  position: fixed;
  width: fit-content;
  background: white;
  cursor: default;
  color: #808080;
  border: 1px solid #B0B0B0;
  font-family: system-ui;
  font-size: 1.0em;
  padding: 5px 0px;
}
#contextMenu:focus {
  outline: none;
}
#contextMenu .item {
  height: 25px;
  padding: 5px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
#contextMenu .label {
  width: 100px;
}
#contextMenu > .item.enabled {
  color: #101010;
}
#contextMenu > .item.enabled:hover {
  background: #ACACAC;
}
#contextMenu .item.separator {
  height: 0.5em;
  border-bottom: 1px solid #B0B0B0;
  margin-bottom: 0.5em;
}
#placeholder {
  position:   absolute;
  opacity:    50%;
  top:        0;
  background: transparent;
}
#ruler {
  position: sticky;
  left: 0;
  right: 0;
  bottom:   0;
  height:   25px;
  display:  flex;
  background: #D0D0D0;
  font-family: system-ui;
  padding:     5px 10px;
  align-items: center;
  cursor:      default;
}
#ruler #status {
  flex-grow: 1;
}
#ruler #position {
}
</style>
<div id='doc' part='doc' tabindex='0'>
  <div id='margin' part='margin'></div>
  <div id='text' part='text'>
    <div id='placeholder' part='placeholder'></div>
  </div>
  <div id='overflow-area' part='overflow-area'></div>
  <div id='boundary' part='boundary'></div>
  <div id='caret' part='caret'></div>
</div>
<slot></slot>
`
/*<div id='ruler' part='ruler'>
  <div id='status' part='status'></div>
  <div id='position' part='position'>
    <span id='position-line' part='position-line'>0</span>, 
    <span id='position-row' part='position-row'>0</span>
  </div>
</div>*/

function createContextMenu(items) {
  const elem = createElement('div', {id: 'contextMenu', part: 'contextMenu', tabIndex: 0})
  const itemElems = items.map(item => {
    const e = createElement('div', {className: 'item', part: 'item'})
    switch(item.type) {
    case 'separator':
      e.classList.add('separator')
      e.part.add('separator')
      break
    case 'action':
      e.classList.add('action')
      e.classList.add(item.name)
      e.part.add('action')
      e.part.add(item.name)
      const lbl = createElement('div', {
        className: 'label',
        part: 'ctxLabel',
        textContent: item.label,
      })
      const key = createElement('div', {
        className: 'key',
        part: 'ctxKey',
        textContent: formatKeyCombo(item.isMod, item.isShift, item.key),
      })
      e.append(lbl, key)
      break
    }
    return e
  })
  elem.append(...itemElems)
  return elem
}


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
  e.style.top   = `calc(${line} * calc(var(--line-height)))`
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

/** Advance a (row, col) position by the length of a range.
 *
 * Used for moving annotations after an insertion.
 */
function pushForward(row, col, range, cols=Infinity) {
  if(row < range.startLine || (row == range.startLine && col < range.startColumn))
    return [row, col]
  let n = range.endLine - range.startLine
  let m = range.endColumn - range.startColumn
  let r = row == range.startLine ? [row + n, col + m] : [row + n, col]
  if(r[1] > cols) {
    r[0] += 1
    r[1] -= cols
  }
  return r
}

function pushRangeForward(a, b, cols=Infinity) {
  let start = pushForward(a.startLine, a.startColumn, b, cols)
  let end = pushForward(a.endLine, a.endColumn, b, cols)
  return {startLine: start[0], startColumn: start[1], 
    endLine: end[0], endColumn: end[1]}
}

function pullBack(row, col, range, cols=Infinity) {
  let rel = MuchText.relativePlacement(row, col, range)
  if(rel < 0)
    return [row, col]
  else if(rel == 0)
    return [range.startLine, range.startColumn]
  let n = range.endLine - range.startLine
  let m = range.endColumn - range.startColumn
  let r = row == range.endLine ? [row - n, col - m] : [row - n, col]
  if(r[1] > cols) {
    r[0] += 1
    r[1] -= cols
  }
  return r
}

function pullRangeBack(a, b, cols=Infinity) {
  let start = pullBack(a.startLine, a.startColumn, b, cols)
  let end = pullBack(a.endLine, a.endColumn, b, cols)
  if(start[0] == end[0] && start[1] == end[1])
    return null
  return {startLine: start[0], startColumn: start[1], 
    endLine: end[0], endColumn: end[1]}
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

/* HISTORY ENTRY

  entry = {
    type:  'insert' or 'delete',
    text:  <the inserted or deleted string>,
    range: <affected range>
  }
 
  For insert actions, a post-insertion `range` is used. For deletions, a pre-
  insertion range is used. 
*/

class MuchText extends HTMLElement {
  static formAssociated = true

  #internals
  #config
  #lines
  #selection
  #visibleRegion
  #elements
  #changed
  #refreshScheduled
  #ctxMenuOpen
  #history  // Undo buffer and status
  #isDragging   = false
  #isFocused    = false
  #caretLine    = 0
  #caretColumn  = 0
  #stickyColumn = 0
  #caretBlink   = null
  #updatedSlot  = false // Have we updated the slot since the last slotchange?
  #contentBox   = null
  #textBox      = null
  #marginWidth  = 0     // Pixel width of margin area
  #charWidth    = 0
  #charHeight   = 0
  ranges        = null

  constructor() {
    super()
    this.#internals = this.attachInternals()
    this.#config = {
      lineWrap      : true,
      hardWrap      : false,
      lineNums      : false,
      altLines      : 'off',
      disabled      : false,
      readOnly      : false,
      showBoundary  : true,
      cols          : null,
      undoDepth     : 100,
      rowNavigation : true,
      eolNavigation : true,
      showRuler     : true,
    }
    this.#history = {
      buffer: [],
      index:  0,  // Position in buffer, for repeated undo/redo actions
    }
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
      cols:   80,
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
    this.shadowRoot.innerHTML = htmlSource
    const contextMenu = createContextMenu([{
      type:    'action',
      name:    'undo',
      label:   'Undo',
      isMod:   true,
      isShift: false,
      key:     'Z',
    }, {
      type:    'action',
      name:    'redo',
      label:   'Redo',
      isMod:   true,
      isShift: true,
      key:     'Z',
    }, {
      type:    'separator',
    }, {
      type:    'action',
      name:    'cut',
      label:   'Cut',
      isMod:   true,
      isShift: false,
      key:     'X',
    }, {
      type:    'action',
      name:    'copy',
      label:   'Copy',
      isMod:   true,
      isShift: false,
      key:     'C',
    }, {
      type:    'action',
      name:    'paste',
      label:   'Paste',
      isMod:   true,
      isShift: false,
      key:     'V',
    }, {
      type:    'action',
      name:    'select-all',
      label:   'Select all',
      isMod:   true,
      isShift: false,
      key:     'A',
    }])
    this.#elements = {
      doc:          this.shadowRoot.querySelector('#doc'), 
      margin:       this.shadowRoot.querySelector('#margin'), 
      text:         this.shadowRoot.querySelector('#text'), 
      overflowArea: this.shadowRoot.querySelector('#overflow-area'), 
      placeholder:  this.shadowRoot.querySelector('#placeholder'), 
      boundary:     this.shadowRoot.querySelector('#boundary'), 
      caret:        this.shadowRoot.querySelector('#caret'), 
      slot:         this.shadowRoot.querySelector('slot'), 
      //ruler:        this.shadowRoot.querySelector('#ruler'), 
      //rulerPosLine: this.shadowRoot.querySelector('#ruler #position-line'), 
      //rulerPosRow:  this.shadowRoot.querySelector('#ruler #position-row'), 
      ctxMenu:      contextMenu,
      ctxCut:       contextMenu.querySelector('.cut'), 
      ctxCopy:      contextMenu.querySelector('.copy'), 
      ctxPaste:     contextMenu.querySelector('.paste'), 
      ctxUndo:      contextMenu.querySelector('.undo'), 
      ctxRedo:      contextMenu.querySelector('.redo'), 
      ctxSelectAll: contextMenu.querySelector('.select-all'), 
      textNode:     new Text(),
    }
    this.#elements.text.append(this.#lines[0].element,)
    this.#updateLineNumbers()
    this.#caretBlink = this.#elements.caret.animate({
      visibility: ['visible', 'hidden', 'hidden'],
    }, {
      duration: 1000,
      iterations: Infinity,
    })
    this.#elements.doc.addEventListener('click',           () => {})
    this.#elements.doc.addEventListener('pointerdown',     e => this.#handlePointerDown(e))
    this.#elements.doc.addEventListener('click',           e => this.#handleClick(e))
    this.#elements.doc.addEventListener('pointermove',     e => this.#handlePointerMove(e))
    this.#elements.doc.addEventListener('pointerup',       e => this.#handlePointerUp(e))
    this.addEventListener('keydown',         e => this.#handleKeyDown(e))
    this.#elements.doc.addEventListener('focus',           e => this.#handleFocus(e))
    this.#elements.doc.addEventListener('blur',            e => this.#handleBlur(e))
    this.addEventListener('scroll',                        e => this.#handleScroll(e))
    //this.#elements.slot.addEventListener('slotchange',     e => this.#handleSlotChange(e))
    this.#elements.doc.addEventListener('contextmenu',     e => this.#openContextMenu(e))
    this.#elements.ctxMenu.addEventListener('click',       e => {})
    this.#elements.ctxMenu.addEventListener('blur',        e => this.#closeContextMenu(e))
    this.#elements.ctxMenu.addEventListener('pointerdown', e => this.#contextMenuPointerEvent(e))
    this.#elements.ctxMenu.addEventListener('pointerup',   e => this.#contextMenuPointerEvent(e))
    this.#elements.ctxCopy.addEventListener('click',       e => this.#contextMenuCopy(e))
    this.#elements.ctxCut.addEventListener('click',        e => this.#contextMenuCut(e))
    this.#elements.ctxPaste.addEventListener('click',      e => this.#contextMenuPaste(e))
    this.#elements.ctxUndo.addEventListener('click',       e => this.#contextMenuUndo(e))
    this.#elements.ctxRedo.addEventListener('click',       e => this.#contextMenuRedo(e))
    this.#elements.ctxSelectAll.addEventListener('click',  e => this.#contextMenuSelectAll(e))

    this.append(this.#elements.textNode)
    this.#disableLineNumbers()
    let firstResize = true
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

    //this.shadowRoot.append(
    //  this.#elements.style,
    //  this.#elements.doc,
    //  this.#elements.slot)
    //this.#enableLineWrap()
  }

  get debug() {
    return {
      config:           this.#config,
      lines:            this.#lines,
      elements:         this.#elements,
      selection:        this.#selection, 
      changed:          this.#changed, 
      refreshScheduled: this.#refreshScheduled, 
      contentBox:       this.#contentBox,
      textBox:          this.#textBox,
      visibleRegion:    this.#visibleRegion,
      charWidth:        this.#charWidth,
      charHeight:       this.#charHeight,
    }
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
    vis.firstLineOverflow = y % cH
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
    const wrap = this.#config.lineWrap
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
    const width    = this.#config.cols == null
                     ? maxWidth
                     : min(maxWidth, this.#config.cols * this.#charWidth)
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
   *    ATTRIBUTES & DOM INTERFACE                                           *
   *                                                                         *
   ***************************************************************************/


  static get observedAttributes() {
    return ['cols', 'wrap', 'line-nums', 'line-contrast', 'placeholder',
      'disabled', 'readonly', 'show-boundary', 'row-navigation', 'eol-navigation',
      'undo-depth']
  }

  attributeChangedCallback(name, old, val) {
    switch(name) {
    case 'show-boundary':
      if(val == 'column')   this.#toggleBoundary(true)
      else if(val == 'off') this.#toggleBoundary(false)
      break
    case 'wrap':
      if(val == 'hard') {
         this.#config.hardWrap = true
         this.#config.lineWrap = false
         this.#elements.doc.classList.remove('no-wrap')
      } else if(val == 'soft') {
         this.#config.hardWrap = false
         this.#config.lineWrap = true
         this.#elements.doc.classList.remove('no-wrap')
      } else if(val == 'off') {
         this.#config.hardWrap = false
         this.#config.lineWrap = false
         this.#elements.doc.classList.add('no-wrap')
      }
      this.#changed.wrapMode = true
      this.#scheduleRefresh()
      break
    case 'row-navigation':
      if(val == 'row')       this.#config.rowNavigation = true
      else if(val == 'line') this.#config.rowNavigation = false
      break
    case 'eol-navigation':
      if(val == 'wrap')     this.#config.eolNavigation = true
      else if(val == 'off') this.#config.eolNavigation = false
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
    case 'placeholder':
      this.#elements.placeholder.textContent = val
      break
    case 'cols':
      if(val == 'auto') {
        this.#setCols(null)
      } else {
        const x = Number.parseInt(val)
        this.#setCols(x)
      } 
      break
    case 'undo-depth':
      this.#setUndoDepth(Number.parseInt(x))
      break
    }
  }

  get caretPosition()     { return [this.#caretLine, this.#caretColumn] }
  set caretPosition(x)    { this.#moveTo(...x) }
  get cols()              { return this.#config.cols == null ? 'auto' : this.#config.cols }
  set cols(x)             { this.setAttribute('cols', x) }
  get disabled()          { return this.#config.disabled }
  set disabled(x)         { this.setAttribute('disabled', x) }
  get eolNavigation()     { return this.#config.eolNavigation ? 'wrap' : 'off' }
  set eolNavigation(x)    { this.setAttribute('eol-navigation', x) }
  get form()              { return this.#internals.form; }
  get lineContrast()      { return this.#config.altLines }
  set lineContrast(x)     { this.setAttribute('line-contrast', x) }
  get lineNums()          { return this.#config.lineNums ? 'on' : 'off' }
  set lineNums(x)         { this.setAttribute('line-nums', x) }
  get name()              { return this.getAttribute('name'); }
  get placeholder()       { return this.#elements.placeholder.textContent }
  set placeholder(x)      { this.setAttribute('placeholder', x) }
  get readonly()          { return this.#config.readOnly }
  set readonly(x)         { this.setAttribute('readonly', x) }
  get rowNavigation()     { return this.#config.rowNavigation ? 'row' : 'line' }
  set rowNavigation(x)    { this.setAttribute('row-navigation', x) }
  get showBoundary()      { return this.#config.showBoundary ? 'column' : 'off' }
  set showBoundary(x)     { this.setAttribute('show-boundary', x) }
  get type()              { return this.localName; }
  get undoDepth()         { return this.#config.undoDepth }
  set undoDepth(x)        { this.setAttribute('undo-depth', x) }
  get validity()          { return this.#internals.validity }
  get validationMessage() { return this.#internals.validationMessage }
  get value()             { return this.textContent }
  set value(x)            { this.setText(x) }
  get willValidate()      { return this.#internals.willValidate }
  get wrap()              { return this.#config.hardWrap ? 'hard' : this.#config.lineWrap ? 'soft' : 'off' }
  set wrap(x)             { this.setAttribute('wrap', x) }

  checkValidity()  { return this.#internals.checkValidity() }
  reportValidity() { return this.#internals.reportValidity() }



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

  /** Get the number of lines and columns spanned by a range. 
   *
   * A span is represented as a `[lines, cols]` pair. `lines` counts the number
   * of line breaks within the range. `cols` is the difference between the
   * start and end columns, it is negative if the start column is greater. 
   */
  static rangeSpan(range) {
    return [range.endLine - range.startLine, range.endColumn - range.startColumn]
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
    this.#config.showBoundary = state
  }

  #enableLineWrap() {
    this.#elements.doc.classList.remove('no-wrap')
    this.#config.lineWrap = true
    this.#changed.wrapMode = true
    this.#scheduleRefresh()
  }

  #disableLineWrap() {
    this.#elements.doc.classList.add('no-wrap')
    this.#config.lineWrap = false
    this.#changed.wrapMode = true
    this.#scheduleRefresh()
  }

  #enableLineNumbers() {
    this.#elements.doc.classList.add('show-line-nums')
    //this.#elements.margin.style.display = 'contents'
    this.#marginWidth = 50
    this.#config.lineNums = true
    if(this.#selection) this.#highlightSelection()
    this.#changed.marginWidth = true
    this.#scheduleRefresh()
  }

  #disableLineNumbers() {
    this.#elements.doc.classList.remove('show-line-nums')
    //this.#elements.margin.style.display = 'none'
    this.#marginWidth = 0
    this.#config.lineNums = false
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
    this.#config.altLines = useLines ? 'lines' : 'rows'
  }

  #disableLineContrast() {
    this.#elements.doc.classList.remove('alternating-lines')
    this.#elements.doc.classList.remove('alternating-rows')
    this.#config.altLines = 'off'
  }

  #setReadOnly(state) {
    this.#config.readOnly = state
  }

  #setDisabled(state) {
    this.#config.disabled = state
    if(state)
      this.#elements.doc.classList.add('disabled')
    else
      this.#elements.doc.classList.remove('disabled')
    this.blur()
  }

  #setCols(state) {
    this.#config.cols = state
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
    this.deleteSelection('deleteByCut')
    navigator.clipboard.writeText(text)
  }

  #clipboardCopy() {
    if(!this.#selection) return
    const text = this.getRange(this.#selection)
    navigator.clipboard.writeText(text)
  }

  async #clipboardPaste() {
    const text = await navigator.clipboard.readText()
    if(this.#selection) {
      this.replaceRange(this.#selection, text, true, 'insertFromPaste')
      this.clearSelection()
    } else {
      this.insert(text, 'insertFromPaste')
    }
  }



  /***************************************************************************
   *                                                                         *
   *    TEXT MANIPULATION                                                    *
   *                                                                         *
   ***************************************************************************/


  /** Replace the contents of the text area with a string. */
  setText(text, updateSlot=true) {
    const n = this.#lines.length-1
    this.deleteRange({startLine: 0, startColumn: 0, endLine: n, endColumn: this.#lines[n].chars.length}, true, 'deleteContent')
    const [line, column] = this.insertAt(this.#caretLine, this.#caretColumn, text, updateSlot, 'reset', false)
  }

  /** Insert a string at the caret position. 
   *
   * Returns a [column, line] pair at the end of the inserted range. The caret
   * is optionally advanced to the end of the inserted text.
   */
  insert(text, inputType='insertText') {
    const [line, column] = this.insertAt(this.#caretLine, this.#caretColumn, text, true, inputType, true)
    return [line, column]
  }

  /** Insert a string at the given position. 
   *
   * Arguments:
   *   row, col     The position at which insertion begins.
   *   text         String containing the text to be inserted.
   *   updateSlot   Should the insertion be applied to the light-DOM text node?
   *   inputType    Value to use for DOM input event's inputType property
   *   advanceCaret Should the caret advance to the end of the inserted range?
   *
   * Return value: a [column, line] pair at the end of the inserted range.
   *
   * If the inserted text contains lines that are longer than the maximum width
   * and hard wrapping is enabled, line breaks are inserted in and after the
   * input as necessary. Creates a new history entry containing the primary
   * insertion and any additional line break insertions applied as a result of
   * hard wrapping. The start and end markers of annotations that begin after
   * the insertion point are pushed forward by the length of the input text to
   * maintain their positions in the document, those that start before the
   * insertion point are stretched. Annotations starting after the insertion
   * point but on the same line may also be stretched if hard wrapping is on and
   * a line break must be inserted after their start point. The set of stretched
   * annotations is used to determine the `affectedRange` for the input event.
   * The least superset of the `affectedRange` containing no partial annotations
   * is given as the `extendedRange`. 
   *
   * Events: Emits an 'input' event of the type given as `inputType`. May emit
   * more than one event if hard wrapping is enabled and the action requires
   * insertion of additional line breaks further down the line.
   *
   * Perf: Affects the DOM. Does not affect styles. Does not force layout. Is
   * linear with respect to the input length, quadratic with respect to the
   * number of affected annotations.
   */
  insertAt(row, col, text, updateSlot=true, inputType='insertText', advanceCaret=true) {
    if(this.#lines.length == 0 || (this.#lines.length == 1 && this.#lines[0].chars.length == 0) && 
       text.length > 0) {
      this.#elements.placeholder.remove()
    }
    // Update line data
    const line = this.#lines[row]
    const next = this.#lines[row+1]
    const rest = line.chars.slice(col)
    const zone = this.findExtendedRange({startLine:row,startColumn:col,endLine:row,endColumn:col})
    const ranges = line.ranges.filter(r => !(r.endLine == row && r.endColumn < col))
    const textLines = text.split('\n')
    const cols = this.#textBox.cols
    line.chars.splice(col, rest.length, ...Array.from(textLines[0]))
    if(this.#config.hardWrap) {
      for(let i=1; i<textLines.length; i++) {
        let ln = textLines[i]
        if(ln.length > cols) {
          const rem = ln.slice(cols)
          ln = ln.slice(0, cols)
          textLines[i] = ln
          textLines.splice(i+1, 0, rem)
        }
      }
      let extras = []
      while(line.chars.length > cols) {
        let chars = line.chars.slice(cols, cols*2)
        extras.push(chars.join(''))
        line.chars.splice(cols, cols)
      }
      textLines.splice(0, 0, ...extras)
    }
    line.dirty = true
    const newLines = textLines.slice(1).map((str, i) => ({
      chars:   Array.from(str),
      dirty:   true,
      element: createElement('div', {className: 'line', innerText: str}),
      ranges:  ranges.slice(),
    }))
    this.#lines.splice(row+1, 0, ...newLines)
    let last = this.#lines[row+newLines.length]
    last.chars.splice(last.chars.length, 0, ...rest)
    if(newLines.length > 0) last.element.append(rest.join(''))
    let lastLen = textLines[textLines.length-1].length
    let nLines = newLines.length
    const tailPosition = [row + nLines, nLines > 0 ? lastLen : col + lastLen]
    let hardTail = false
    let shiftNext = 0
    let newLineRegion = null
    let tailLine = null
    if(this.#config.hardWrap && last.chars.length > cols) {
      hardTail = true
      const rem = last.chars.slice(cols)
      last.chars.splice(cols, rem.length)
      tailLine = {
        chars:   rem,
        dirty:   true,
        element: createElement('div', {className: 'line', innerText: rem.join('')}),
        ranges:  last.ranges.slice(),
      }
      this.#lines.splice(row + nLines + 1, 0, tailLine)
      last.element.innerText = last.chars.join('')
      newLines.push(tailLine)
      newLineRegion = {
        startLine: tailPosition[0],
        startColumn: this.#lines[tailPosition[0]].chars.length,
        endLine: tailPosition[0] + 1,
        endColumn: 0,
      }
    }

    // Update ranges
    const affectedRange = {
      startLine: row,
      startColumn: col,
      endLine: tailPosition[0],
      endColumn: tailPosition[1],
    }
    let i = 0
    while(i < this.ranges.length) {
      const annotation = this.ranges[i]
      let newRange = pushRangeForward(annotation, affectedRange)
      annotation.startLine   = newRange.startLine
      annotation.startColumn = newRange.startColumn
      annotation.endLine     = newRange.endLine
      annotation.endColumn   = newRange.endColumn
      if(hardTail) {
        newRange = pushRangeForward(annotation, newLineRegion)
        annotation.startLine   = newRange.startLine
        annotation.startColumn = newRange.startColumn
        annotation.endLine     = newRange.endLine
        annotation.endColumn   = newRange.endColumn
        last.ranges = last.ranges.filter(r => r.startLine <= tailPosition[0])
        tailLine.ranges = tailLine.ranges.filter(r => r.endLine > tailPosition[0])
      }
      i++
    }

    // Update DOM
    if(updateSlot) {
      const offset = this.#lines.slice(0,row).reduce((acc,x) => acc+x.chars.length+1, 0) + col
      const txt = textLines.join('\n')
      this.#elements.textNode.insertData(offset, txt)
      if(hardTail) {
        const tailOffset = this.#lines.slice(row,tailPosition[0]+1).reduce((acc,x) => acc+x.chars.length+1, 0) 
        this.#elements.textNode.insertData(offset - col + tailOffset, '\n')

      }
    }
    //  this.#updatedSlot = true
    //}
    let after = !hardTail ? null : {
      action: 'insertLineBreak',
      type:   'insert',
      text:   '\n',
      range: newLineRegion,
    }
    this.#addHistoryEntry('insert', affectedRange, text, inputType, after)
    if(hardTail) {
      affectedRange.endLine = newLineRegion.endLine
      affectedRange.endColumn = newLineRegion.endColumn
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
    if(newLines.length > 0) {
      this.#changed.lineCount = true
    }
    this.#changed.textContent = true
    
    if(advanceCaret) {
      this.#moveTo(tailPosition[0], tailPosition[1])
    }

    this.#scheduleRefresh()
    return tailPosition
  }

  /** Delete the text between two positions.
   *
   * The caret is optionally moved to the start of the deleted range.
   */
  deleteRange(range, moveCaret=true, inputType='deleteContent', isReplacing=false) {
    const {startLine,startColumn,endLine,endColumn} = range
    if(startLine==endLine && startColumn==endColumn) return
    const text = this.getRange(range)
    const nLines = endLine - startLine
    const offset = this.offsetOf(startLine, startColumn)
    const len = this.rangeLength(startLine, startColumn, endLine, endColumn) 
    this.#elements.textNode.deleteData(offset, len)
    const start = this.#lines[startLine]
    const end = this.#lines[endLine]
    const startLen = start.chars.length
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
      if(this.#lines.length > startLine+1)
        this.#lines[startLine+1].dirty = true
      for(let r of end.ranges) 
        if(!start.ranges.includes(r))
          start.ranges.push(r)
      this.#changed.lineCount = true
    }
    let hardTail = false
    let tailLine = null
    const cols = this.#textBox.cols
    if(this.#config.hardWrap && start.chars.length > cols) {
      hardTail = true
      const newLineOffset = offset - startColumn + cols
      this.#elements.textNode.insertData(newLineOffset, '\n')
      const rem = start.chars.slice(cols)
      start.chars.splice(cols, rem.length)
      tailLine = {
        chars:   rem,
        dirty:   true,
        element: createElement('div', {className: 'line', innerText: rem.join('')}),
        ranges:  start.ranges.slice(),
      }
      this.#lines.splice(startLine + 1, 0, tailLine)
      start.element.innerText = start.chars.join('')
      start.element.after(tailLine.element)
    }

    const newLineRegion = {
      startLine,
      startColumn: start.chars.length,
      endLine: startLine+1,
      endColumn: 0,
    }
    // Update annotations
    let i = 0
    while(i < this.ranges.length) {
      const annotation = this.ranges[i]
      let newRange = pullRangeBack(annotation, range)
      if(newRange == null) {
        this.ranges.splice(i, 1)
        start.ranges.splice(start.ranges.indexOf(annotation), 1)
      } else {
        annotation.startLine   = newRange.startLine
        annotation.startColumn = newRange.startColumn
        annotation.endLine     = newRange.endLine
        annotation.endColumn   = newRange.endColumn
        if(hardTail) {
          newRange = pushRangeForward(annotation, newLineRegion)
          annotation.startLine   = newRange.startLine
          annotation.startColumn = newRange.startColumn
          annotation.endLine     = newRange.endLine
          annotation.endColumn   = newRange.endColumn
        }
        i++
      }
      if(hardTail) {
        start.ranges = start.ranges.filter(r => r.startLine <= startLine)
        tailLine.ranges = tailLine.ranges.filter(r => r.endLine > startLine)
      }
    }
    if(moveCaret) 
      this.#moveTo(startLine, startColumn)
    
    const affectedRange = {
      startLine,
      startColumn,
      endLine: hardTail ? newLineRegion.endLine : startLine,
      endColumn: hardTail ? newLineRegion.endColumn : startColumn,
    }
    const after = !hardTail ? null : {
      action: 'insertLineBreak',
      type:   'insert',
      text:   '\n',
      range:  newLineRegion,
    }
    this.#addHistoryEntry(isReplacing ? 'replace' : 'delete', range, text, inputType, after)
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
    if(this.#lines.length == 0 || (this.#lines.length == 1 && this.#lines[0].chars.length == 0)) {
      this.#elements.text.append(this.#elements.placeholder)
    }
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

  /** Replace text in a range as a single operation in the undo history. */
  replaceRange(range, text, moveCaret, inputType) {
    this.deleteRange(range, false, 'deleteContent', true)
    this.insertAt(range.startLine, range.startColumn, text, true, moveCaret, inputType)
  }



  /***************************************************************************
   *                                                                         *
   *    UNDO / REDO                                                          *
   *                                                                         *
   ***************************************************************************/


  /** Record an action in the undo buffer. */
  #addHistoryEntry(type, range, text, action, after=null) {
    if(action == 'reset') {
      this.#history.index = 0
      this.#history.buffer.splice(0, this.#history.buffer.length)
      return
    } else if(action == 'historyUndo' || action == 'historyRedo') {
      return 
    }

    const history = this.#history
    if(history.index < history.buffer.length) {
      history.buffer.splice(history.index, history.buffer.length - history.index)
    }
    const last = history.buffer[history.index-1]
    if(history.index > 0 && (action == 'insertText' || action == 'insertLineBreak') && 
       (last?.action == 'insertText' || last?.action == 'insertLineBreak') &&
       last?.open && last?.range.endLine == range.startLine && last?.range.endColumn == range.startColumn) {
      last.text += text
      last.range.endLine = range.endLine
      last.range.endColumn = range.endColumn
    } else if(history.index > 0 && action == 'deleteContentBackward' && last?.action == 'deleteContentBackward' &&
       last?.open && last?.range.startLine == range.endLine && last?.range.startColumn == range.endColumn) {
      last.text = text + last.text
      last.range.startLine = range.startLine
      last.range.startColumn = range.startColumn
    } else if(history.index > 0 && action == 'deleteContentForward' && last?.action == 'deleteContentForward' &&
       last?.open && last?.range.startLine == range.startLine && last?.range.startColumn == range.startColumn) {
      last.text += text
      last.range.endLine = range.endLine
      last.range.endColumn = range.endColumn
    } else if(last?.type == 'replace') {
      last.replacement = {type, range, text, action, after, open: false, replacement: null}
    } else {
      if(last) last.open = false
      const entry = {type, range, text, action, after, open: true, replacement: null}
      history.buffer.push(entry)
      if(history.length > this.#config.cfgUndoDepth)
        history.buffer.shift()
      else
        history.index++
    }
  }

  /** Revert to previous state in history buffer. */
  #undo() {
    const history = this.#history
    if(history.index == 0)
      return
    const entry = history.buffer[history.index-1]
    entry.open = false
    history.index--
    if(entry.after) {
      this.deleteRange(entry.after.range, true, 'historyUndo')
    }
    if(entry.type == 'insert') {
      this.deleteRange(entry.range, true, 'historyUndo')
    } else if(entry.type == 'delete') {
      this.insertAt(entry.range.startLine, entry.range.startColumn, entry.text, true, 'historyUndo')
    } else if(entry.type == 'replace') {
      this.deleteRange(entry.replacement.range, true, 'historyUndo')
      this.insertAt(entry.range.startLine, entry.range.startColumn, entry.text, true, 'historyUndo')
    }
  }

  /** Restore to next state in history buffer. */
  #redo() {
    const history = this.#history
    if(history.index >= history.buffer.length)
      return
    const entry = history.buffer[history.index]
    entry.open = false
    history.index++
    if(entry.type == 'insert') {
      this.insertAt(entry.range.startLine, entry.range.startColumn, entry.text, true, 'historyRedo')
    } else if(entry.type == 'delete') {
      this.deleteRange(entry.range, true, 'historyRedo')
    } else if(entry.type == 'replace') {
      this.deleteRange(entry.range, true, 'historyUndo')
      this.insertAt(entry.range.replacement.startLine, entry.range.replacement.startColumn, entry.replacement.text, true, 'historyUndo')
    }
    // not needed: 'after' only ever means hard wrapping which will be handled anyway
    //if(entry.after) {
    //  const aft = entry.after
    //  this.insertAt(aft.range.startLine, aft.range.startColumn, aft.text, true, 'historyRedo')
    //}
  }

  /** Change the maximum number of undo entries. */
  #setUndoDepth(x) {
    const len = this.#history.buffer.length
    if(x < len) {
      this.#history.buffer.splice(0, len - x)
      this.#history.index -= len - x
    }
    this.#config.undoDepth = x
    
  }


  /***************************************************************************
   *                                                                         *
   *    ANNOTATIONS                                                          *
   *                                                                         *
   ***************************************************************************/


  annotate(startLine, startColumn, endLine, endColumn, cls) {
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

  clearAnnotations() {
    this.ranges = []
    this.#lines.forEach((line,i) => {
      line.ranges.splice(0, line.length)
      line.dirty = true
    })
  }

  /** Efficiently replace the annotations that start in a given range.
   * 
   * `from` and `to` specify the range of lines (inclusive). The replacements
   *  must be sorted by start position.
   *
   *  Note: ensure internal ranges list is kept ordered too! 
   */
  replaceAnnotations(region, newRanges) {

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
        (r.startLine == region.startLine && r.startColumn < region.startColumn) ||
        r.startLine > region.endLine ||
        (r.startLine == region.endLine && r.startColumn > region.endColumn) 
      )
    
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

    this.#changed.annotations = true
    this.#scheduleRefresh()
  }

  #annotationsAt(row, col) {
    const line = this.#lines[row]
    if(!line) return []
    return line.ranges.filter(r => MuchText.isInRange(row, col, r))
  }

  findExtendedRange(range) {
    const start = [range.startLine, range.startColumn]
    let startMarks = this.#annotationsAt(start[0], start[1])
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
        startMarks = this.#annotationsAt(start[0], start[1])
      }
    }
    const end = [range.endLine, range.endColumn]
    let endMarks = this.#annotationsAt(end[0], end[1])
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
        endMarks = this.#annotationsAt(end[0], end[1])
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

    if(to <= width || !this.#config.lineWrap) {
      const e = createElement('div', {className: 'line-selection'})
      e.style.top   = `calc(${offset.top}px + ${offset.row} * calc(var(--line-height)))`
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
        e.style.top   = `calc(${offset.top}px + ${offset.row} * calc(var(--line-height)))`
        e.style.left  = `calc(${margin}px + ${left}ch)`
        e.style.width = `calc(${right - left}ch)`
        eSelection.appendChild(e)
        left = 0
        offset.row++
      }
    }
  }

  /** Render the selection. Both accesses and changes DOM and styles! */
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
    let cols = this.#textBox.cols
    if(this.#config.lineWrap && startColumn > cols) {
      offset.top += floor(startColumn / cols) * this.#charHeight
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

  deleteSelection(inputType='deleteContent') {
    if(!this.#selection) return
    const selection = this.#selection
    const isBackwards = 
      selection.endLine < selection.startLine || 
      selection.endLine == selection.startLine && selection.endColumn < selection.startColumn
    const startLine   = isBackwards ? selection.endLine : selection.startLine
    const endLine     = isBackwards ? selection.startLine : selection.endLine
    const startColumn = isBackwards ? selection.endColumn : selection.startColumn
    const endColumn   = isBackwards ? selection.startColumn : selection.endColumn
 
    this.deleteRange({startLine, startColumn, endLine, endColumn}, true, inputType)
 
    this.#selection.element.remove()
    this.#selection = null
    this.#elements.doc.classList.remove('select')
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

  #selectAll() {
    if(this.#selection) this.clearSelection()
    this.#startSelection()
    this.#selection = {
      startLine:   0,
      startColumn: 0,
      endLine:     this.#lines.length-1,
      endColumn:   this.#lines[this.#lines.length-1].chars.length,
      element:     this.#selection.element,
    }
    this.#changed.selection = true
    this.#scheduleRefresh()
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
    if(changed.annotations) {
      refreshVisibleContent  = true
      changed.annotations    = false
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
    const wrap   = this.#config.lineWrap || this.#config.hardWrap
    const cBox   = this.#contentBox
    const tBox   = this.#textBox
    const cols   = this.#config.cols

    style.setProperty('--margin-width',   `${margin}px`)
    style.setProperty('--boundary-left',  `calc(${margin+tBox.width}px + 0.5ch)`)
    if(wrap) {
      if(cols == null) {
        style.setProperty('--line-width',     `${tBox.cols}ch`)
        style.setProperty('--line-min-width', `${tBox.cols}ch`)
      } else {
        style.setProperty('--line-width',     `${cols}ch`)
        style.setProperty('--line-min-width', `${cols}ch`)
      }
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
    const ln = this.#lines[cL]
    const h = this.#charHeight
    const margin = this.#marginWidth
    const tBox = this.#textBox
    const top = ln.element.offsetTop // this.#lineOffset(cL)
    const cols = this.#config.cols
    const wrapPoint = cols == null ? tBox.cols : cols

    if(cC >= wrapPoint && this.#config.lineWrap) {
      const n = floor(cC / wrapPoint)
      const rem = cC % wrapPoint
      if(rem == 0 && cC != 0 && cC == ln.chars.length) {
        this.#elements.caret.style.left = `calc(${margin}px + ${cC}ch)`
        this.#elements.caret.style.top = `${top}px` //`calc(${cL} * (1em + 1ex))`
      } else {
        this.#elements.caret.style.left = `calc(${margin}px + ${rem}ch)`
        this.#elements.caret.style.top = `${top + n*h}px` //`calc(${cL} * (1em + 1ex))`
      }
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
    if(this.#config.disabled) return
    const tBox = this.#textBox
    const [x, y] = [ev.clientX - tBox.left, ev.clientY - tBox.top]
    const [line, column] = this.nearestPosition(x, y)
    
    if(this.#selection) {
      this.#moveTo(line, column)
      if(!ev.shiftKey) {
        this.clearSelection()
        this.#startSelection()
      } else {
        this.#selectToCaret()
      }
    } else if(ev.shiftKey) {
      this.#startSelection()
      this.#moveTo(line, column)
      this.#selectToCaret()
    } else {
      this.#moveTo(line, column)
      this.#startSelection()
    }

    this.#isDragging = true
    //this.#elements.text.setPointerCapture(ev.pointerId)
  }

  /** Handle click events (other than those already handled on pointerdown). */
  #handleClick(ev) {
    if(this.#ctxMenuOpen) this.#closeContextMenu()
    else if(this.#config.disabled || ev.detail < 2) return
    else this.#selectWord()
  }

  #handlePointerMove(ev) {
    if(!this.#isDragging) return
    const tBox = this.#textBox
    const [x, y] = [ev.clientX - tBox.left, ev.clientY - tBox.top]
    const [line, column] = this.nearestPosition(x, y)
    this.#moveTo(line, column)
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
    if(this.#config.disabled) {
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
      case 'Delete':     ev.preventDefault(); this.#keyDelete(ev); break
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
      case 'KeyZ':       if(isMod) { ev.preventDefault(); this.#keyModZ(ev); break }
      case 'KeyY':       if(isMod) { ev.preventDefault(); this.#keyModY(ev); break }
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
    if(this.#config.readOnly) return
    if(this.#selection) {
      this.replaceRange(this.#selection, '\n', true, 'insertLineBreak')
      this.clearSelection()
    } else {
      this.insert('\n', 'insertLineBreak')
    }
  }

  #keyBackspace(ev) {
    if(this.#config.readOnly) return
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
    this.deleteRange({startLine, startColumn, endLine, endColumn}, true, 'deleteContentBackward')
  }

  #keyDelete(ev) {
    if(this.#config.readOnly) return
    if(this.#selection) {
      this.deleteSelection()
      return
    }
    const range = {
      startLine:   this.#caretLine,
      startColumn: this.#caretColumn,
      endLine:     this.#caretLine,
      endColumn:   this.#caretColumn + 1,
    }
    if(range.endColumn > this.#lines[range.endLine].chars.length) {
      if(range.endLine == this.#lines.length-1) return
      range.endLine++
      range.endColumn = 0
    }
    this.deleteRange(range, true, 'deleteContentForward')
  }

  #keyEscape(ev) {
    if(this.#selection)
      this.clearSelection()
  }

  #keyArrowLeft(ev) {
    const line = this.#lines[this.#caretLine].chars
    if(ev.shiftKey && !this.#selection)
      this.#startSelection()
    if(!ev.shiftKey && this.#selection) {
      this.#moveTo(this.#selection.startLine, this.#selection.startColumn)
      this.clearSelection()
    } else
      this.#moveLeft()
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyArrowRight(ev) {
    const line = this.#lines[this.#caretLine].chars
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    else
      this.#moveRight()
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyArrowUp(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    this.#moveUp()
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyArrowDown(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    this.#moveDown()
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyModA(ev) {
    this.#selectAll()
  }

  #keyModC(ev) {
    this.#clipboardCopy()
  }

  #keyModX(ev) {
    if(this.#config.readOnly) 
      this.#clipboardCopy()
    else
      this.#clipboardCut()
  }

  #keyModV(ev) {
    this.#clipboardPaste()
  }

  #keyModZ(ev) {
    this.#undo()
  }

  #keyModY(ev) {
    this.#redo()
  }

  #keyHome(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    if(this.#config.rowNavigation && this.#config.lineWrap) {
      const cols = this.#textBox.cols
      this.#moveTo(this.#caretLine, floor(this.#caretColumn / cols) * cols)
    } else
      this.#moveTo(this.#caretLine, 0)
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyEnd(ev) {
    if(ev.shiftKey && !this.#selection) 
      this.#startSelection()
    else if(!ev.shiftKey && this.#selection)
      this.clearSelection()
    const line = this.#lines[this.#caretLine]
    if(this.#config.rowNavigation && this.#config.lineWrap) {
      const cols = this.#textBox.cols
      this.#moveTo(this.#caretLine, min(line.chars.length, ceil(this.#caretColumn / cols) * cols))
    } else
      this.#moveTo(this.#caretLine, line.chars.length)
    if(this.#selection)
      this.#selectToCaret()
  }

  #keyTextInput(ev) {
    if(this.#config.readOnly) return 
    if(this.#selection) {
      this.replaceRange(this.#selection, ev.key, true, 'insertText')
      this.clearSelection()
    } else {
      this.insert(ev.key, 'insertText')
    }
  }



  /***************************************************************************
   *                                                                         *
   *    CONTEXT MENU                                                         *
   *                                                                         *
   ***************************************************************************/


  #openContextMenu(ev) {
    ev.preventDefault()
    const x = ev.clientX 
    const y = ev.clientY 
    const ctxMenu = this.#elements.ctxMenu
    ctxMenu.style.left = `${x}px`
    ctxMenu.style.top = `${y}px`
    this.#ctxMenuOpen = true
    this.#elements.doc.append(ctxMenu)
    this.#elements.ctxPaste.classList.add('enabled')
    this.#elements.ctxSelectAll.classList.add('enabled')
    if(this.#history.index > 0) {
      this.#elements.ctxUndo.classList.add('enabled')
    } else {
      this.#elements.ctxUndo.classList.remove('enabled')
    }
    if(this.#history.index < this.#history.buffer.length) {
      this.#elements.ctxRedo.classList.add('enabled')
    } else {
      this.#elements.ctxRedo.classList.remove('enabled')
    }
    if(this.#selection) {
      this.#elements.ctxCopy.classList.add('enabled')
      this.#elements.ctxCut .classList.add('enabled')
    } else { 
      this.#elements.ctxCopy.classList.remove('enabled')
      this.#elements.ctxCut .classList.remove('enabled')
    }
    ctxMenu.focus()
  }

  #closeContextMenu() {
    if(!this.#ctxMenuOpen) return
    this.#ctxMenuOpen = false
    this.#elements.ctxMenu.remove()
  }

  #contextMenuPointerEvent(ev) {
    ev.stopPropagation()
  }

  #contextMenuCopy(ev) {
    if(!this.#elements.ctxCopy.classList.contains('enabled')) return
    this.#clipboardCopy()
  }

  #contextMenuCut(ev) {
    if(!this.#elements.ctxCut.classList.contains('enabled')) return
    if(this.#config.readOnly) 
      this.#clipboardCopy()
    else
      this.#clipboardCut()
  }

  #contextMenuPaste(ev) {
    if(!this.#elements.ctxPaste.classList.contains('enabled')) return
    this.#clipboardPaste()
  }

  #contextMenuUndo(ev) {
    if(!this.#elements.ctxUndo.classList.contains('enabled')) return
    this.#undo()
  }

  #contextMenuRedo(ev) {
    if(!this.#elements.ctxRedo.classList.contains('enabled')) return
    this.#redo()
  }

  #contextMenuSelectAll(ev) {
    if(!this.#elements.ctxSelectAll.classList.contains('enabled')) return
    this.#selectAll()
  }



  /***************************************************************************
   *                                                                         *
   *    CARET MOVEMENT                                                       *
   *                                                                         *
   ***************************************************************************/


  /** Move the cursor to a given (logical) line and column. */
  #moveTo(row, col) {
    const nLines = this.#lines.length - 1
    const cols = this.#textBox.cols
    row = min(nLines, row)
    const line = this.#lines[row]
    this.#caretLine = row
    this.#caretColumn = min(col, line.chars.length)
    this.#stickyColumn = this.#caretColumn % cols
    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }

  #moveUp() {
    const cL   = this.#caretLine
    const cC   = this.#caretColumn
    const sC   = this.#stickyColumn
    const cols = this.#textBox.cols
    const line = this.#lines[cL]

    if(this.#config.rowNavigation && this.#config.lineWrap) {
      if(cC > cols) {
        if(sC > cC % cols) 
          this.#caretColumn -= cols - (sC - cC % cols)
        else
          this.#caretColumn -= cols
      } else if(cL > 0) {
        this.#caretLine -= 1
        const newLine = this.#lines[this.#caretLine]
        const n = ceil(max(1,newLine.chars.length) / cols) - 1
        const r = newLine.chars.length % cols
        this.#caretColumn = min(newLine.chars.length, n*cols + sC)
      }
    } else if(cL > 0) {
      this.#caretLine -= 1
      const newLine = this.#lines[this.#caretLine]
      this.#caretColumn = min(sC, newLine.chars.length)
    }

    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }

  #moveDown() {
    const cL   = this.#caretLine
    const cC   = this.#caretColumn
    const sC   = this.#stickyColumn
    const cols = this.#textBox.cols
    const line = this.#lines[cL]

    const newLine = this.#lines[cL+1]
    if(this.#config.rowNavigation && this.#config.lineWrap) {
      const cols = this.#textBox.cols
      const n = floor(cC / cols)
      if(line.chars.length > (n+1)*cols) {
        this.#caretColumn = min((n+1)*cols + sC, line.chars.length)
      } else if(cL + 1 < this.#lines.length) {
        let r = sC % cols
        if(r == 0 && sC != 0) r = cols
        this.#caretLine++
        this.#caretColumn = min(newLine.chars.length, r)
      }
    } else if(cL + 1 < this.#lines.length) {
      this.#caretLine++
      this.#caretColumn = min(sC, newLine.chars.length)
    }

    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }

  #moveLeft() {
    const cL   = this.#caretLine
    const cC   = this.#caretColumn
    const cols = this.#textBox.cols
    const line = this.#lines[cL]

    if(this.#config.eolNavigation && cC == 0 && cL > 0) {
      const newLine = this.#lines[cL - 1]
      this.#caretLine--
      this.#caretColumn = newLine.chars.length
      this.#stickyColumn = newLine.chars.length
    } else if(cC > 0) { 
      this.#caretColumn -= 1
      this.#stickyColumn -= 1
    }
    this.#stickyColumn = this.#caretColumn % cols
    if(this.#stickyColumn == 0 && this.#caretColumn != 0) this.#stickyColumn = cols
    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }

  #moveRight() {
    const cL     = this.#caretLine
    const cC     = this.#caretColumn
    const line   = this.#lines[cL]
    const nLines = this.#lines.length
    const len    = line.chars.length
    const cols = this.#textBox.cols

    if(this.#config.eolNavigation && cC == len && cL+1 < nLines) {
      this.#caretLine++
      this.#caretColumn = 0
      this.#stickyColumn = 0
    } else if(cC < len) { 
      this.#caretColumn += 1
      this.#stickyColumn += 1
    }
    this.#stickyColumn = this.#caretColumn % cols
    if(this.#stickyColumn == 0 && this.#caretColumn != 0) this.#stickyColumn = cols
    this.#changed.caretPosition = true
    this.#scheduleRefresh()
  }


}

customElements.define('much-text', MuchText)


return MuchText
})()


