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
const WORD_BREAK_CHARS = Array.from(` ~!@#$%^&*-=+|;:'",.?()[]{}<>\t\n`)

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
  border:          1px solid #707070;
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
  contain:         size;
  padding:         2px;
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
  --tab-width:      4;
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
  tab-size:        var(--tab-width);
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
#line-effect-layer > * {
  position:        absolute;
}
.line-effect {
  grid-column:     1/4;
  grid-row-end:    span 1;
  left:            0;
  right:           0;
  top:             0;
  bottom:          0;
}
.line {
  z-index:         1;
  position:        relative;
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
#overflow-area, #text {
  display:         contents;
}

.line *, #caret, #placeholder {
  pointer-events:  none;
}

#placeholder {
  position:   absolute;
  opacity:    50%;
  top:        0;
  background: transparent;
}



/*
 *    LINE CONTRAST
 */

#doc.alternating-lines #line-effect-layer .line-effect:nth-child(odd) { 
  backdrop-filter: brightness(110%);
}



/*
 *    CONTEXT MENU
 */

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
  z-index: 1;
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



/*
 *    CARET
 */

#caret, #char {
  display:         inline-block;
  font-family:     Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace, serif;
  font-size:       13px;
  height:          calc(var(--line-height));
  width:           1ch;
  position:        absolute;
  border-left:     1px solid #08080F;
  opacity:         0;
}
#doc.select:focus #caret {
  opacity:         0;
}
#doc:focus #caret {
  opacity:         1;
}
#doc.select:focus #caret {
  opacity:         0;
}



/*
 *    LAYERS
 */

#selection-background-layer,
#selection-foreground-layer,
#line-effect-layer {
  display:         contents;
}



/*
 *    SELECTION
 */

#selection-background-layer > *,
#selection-foreground-layer > * {
  grid-column:     2 / span 1;
  grid-row-end:    span 1;
  position:        absolute;
  top:             0;
  bottom:          0;
  left:            0;
  right:           0;
}

#selection-background-layer > * {
}

#selection-foreground-layer > * {
  z-index:            1;
}

.selection,
.selection-effect {
  height:          calc(var(--line-height));
  min-width:       1ch;
  position:        absolute;
}

.selection {
  background:      #3390FF;
}
.selection-effect {
  backdrop-filter: invert(100%);
}

#doc.enable-selection-effects .selection {
  filter:          invert(100%);
}

/*
 *    RULER
 */

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
  <div id='line-effect-layer'></div>
  <div id='selection-background-layer'></div>
  <div id='margin' part='margin'></div>
  <div id='text' part='text'>
    <div id='placeholder' part='placeholder'></div>
  </div>
  <div id='boundary' part='boundary'></div>
  <div id='selection-foreground-layer'>
  </div>
  <div id='caret' part='caret'></div>
  <div id='char'></div>
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


function createElement(tagName, props=null, styles=null) {
  const e = document.createElement(tagName)
  if(props) for(let [k,v] of Object.entries(props)) e[k] = v
  if(styles) for(let [k,v] of Object.entries(styles)) e.style[k] = v
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

/** Compare two line sets.
 *
 * Arguments:
 *   as - Reference line set ('before')
 *   bs - Comparison line set ('after')
 *
 * Returns:
 *   A lineset diff object, with three properties `insertions`, `deletions` and
 *   `alterations` which are lists of line selection triples [line, start, end].
 *
 * This function computes the set of insertions, deletions and alterations on
 * line set `as` to yield line set `bs`. Insertions occur when a line number in
 * `bs` does not occur in `as`. Deletions occur when a line number in `as` does
 * not occur in `bs`. Alterations occur when a line number occurs in both line
 * sets, but the start and/or end columns are different. For insertions and
 * alterations, the line selection triple from `bs` is added to the insertions
 * or alterations list respectively. For deletions, the triple from `as` is
 * added to the deletions list.
 * 
 * The arguments must be sorted by line number.
 */
function diffLineSets(as, bs) {
  const buf = {insertions: [], deletions: [], alterations: []}
  let ai = 0
  let bi = 0
  while(true) {
    let a = as[ai]
    let b = bs[bi]
    if(!a && !b) {
      break
    } else if(a && !b) {
      buf.deletions.push(a)
      ai++
    } else if(b && !a) {
      buf.insertions.push(b)
      bi++
    } else {
      if(a[0] < b[0]) {
        buf.deletions.push(a)
        ai++
      } else if(b[0] < a[0]) {
        buf.insertions.push(b)
        bi++
      } else if(a[1] != b[1] || a[2] != b[2]) {
        buf.alterations.push(b)
        ai++
        bi++
      } else {
        ai++
        bi++
      } 
    }
  }
  return buf
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
  #selectionLineSet
  #selectionElements
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
      selectionFx   : false,
      expandTab     : false,
      tabWidth      : 4,    
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
    this.#selectionLineSet = []
    this.#selectionElements = []
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
      placeholder:  this.shadowRoot.querySelector('#placeholder'), 
      boundary:     this.shadowRoot.querySelector('#boundary'), 
      caret:        this.shadowRoot.querySelector('#caret'), 
      char:         this.shadowRoot.querySelector('#char'), 
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
      lineEffectLayer:          this.shadowRoot.querySelector('#line-effect-layer'), 
      selectionBackgroundLayer: this.shadowRoot.querySelector('#selection-background-layer'), 
      selectionForegroundLayer: this.shadowRoot.querySelector('#selection-foreground-layer'), 
    }
    this.#lines[0].element.append(this.#elements.caret)
    this.#elements.text.append(this.#lines[0].element,)
    this.#updateLineNumbers()
    this.#caretBlink = this.#elements.caret.animate({
      visibility: ['visible', 'hidden', 'hidden'],
    }, {
      duration: 1000,
      iterations: Infinity,
    })
    //this.#elements.doc.addEventListener('click',           () => {})
    this.addEventListener('pointerdown',     e => this.#handlePointerDown(e))
    this.addEventListener('click',           e => this.#handleClick(e))
    this.addEventListener('pointermove',     e => this.#handlePointerMove(e))
    this.addEventListener('pointerup',       e => this.#handlePointerUp(e))
    this.addEventListener('keydown',         e => this.#handleKeyDown(e))
    this.addEventListener('focus',           e => this.#handleFocus(e))
    this.addEventListener('blur',            e => this.#handleBlur(e))
    this.addEventListener('scroll',          e => this.#handleScroll(e))
    //this.#elements.slot.addEventListener('slotchange',     e => this.#handleSlotChange(e))
    this.addEventListener('contextmenu',     e => this.#openContextMenu(e))
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
          console.log(entry)
          this.#changed.contentBox = true
          break
        case this.#elements.char:
          this.#charWidth = entry.borderBoxSize[0].inlineSize
          this.#charHeight = entry.borderBoxSize[0].blockSize
          this.#changed.caretSize = true
          break
        }
      }
      this.#scheduleRefresh()
    })
    resizeObserver.observe(this)
    resizeObserver.observe(this.#elements.char)
    this.#charWidth = this.#elements.char.offsetWidth
    this.#charHeight = this.#elements.char.offsetHeight
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
      marginWidth:      this.#marginWidth,
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
    while(nextLineHeight != null && y >= nextLineHeight) {
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
    const cH      = this.#charHeight
    const wrap    = this.#config.lineWrap
    const cfgCols = this.#config.cols
    const cols    = wrap && cfgCols != null ? cfgCols 
                                            : this.#textBox.cols
    const line    = this.#lines[row]
    if(!line) return null
    const width   = this.#charToColumn(row, line.chars.length)
    if(!wrap) return cH
    return cH * max(1, ceil(width / cols))
  }

  /** Get the vertical position of a visible line, relative to the textBox's bounding box. */
  //#lineOffset(row) {
  //  const vis = this.#visibleRegion
  //  if(row < vis.firstLine || row > vis.lastLine) return null
  //  let i   = vis.firstLine
  //  let top = -vis.firstLineOverflow
  //  while(i<row) {
  //    top += this.#lineHeight(i)
  //    i++
  //  }
  //  return top
  //}

  /** Get the vertical position of a visible line, relative to the start of the document. */
  #lineDocOffset(row) {
    let top = 0
    for(let i=0; i<row; i++) {
      top += this.#lineHeight(i)
    }
    return top
  }

  /** Find the column for a given character number in a line, taking tabs into account. */
  #charToColumn(line, char) {
    const tW = this.#config.tabWidth
    const ln = this.#lines[line]
    const pos = min(char, ln.chars.length)
    let x = 0
    let t = tW // Distance to next tab stop
    for(let i=0; i<pos; i++) {
      if(ln.chars[i] == '\t') {
        x += t
        t = tW
      } else {
        x += 1
        t = t>1 ? t-1 : tW
      }
    }
    return x
  }

  /** Find the character number for a given absolute column and a line number. */
  #columnToChar(line, col) {
    const tW = this.#config.tabWidth
    const ln = this.#lines[line]
    let x = 0
    let m = 0
    let t = tW // Distance to next tab stop
    for(let i=0; m<col; i++) {
      x += 1
      if(ln.chars[i] == '\t') {
        m += t
        t = tW
      } else {
        m += 1
        t = t>1 ? t-1 : tW
      }
    }
    return x
  }

  /** Find the wrap-aware sub-row and column for a given absolute column. */
  #subLineOffset(col) {
    const wrap  = this.#config.lineWrap
    const cols  = this.#config.cols
    const width = this.#textBox.cols
    if(!wrap)
      return [0, col]
    else if(cols != null)
      return [floor(col / cols), col % cols]
    else
      return [floor(col / width), col % width]
  }

  /** Find the absolute column for a wrapped sub-row and relative column. */
  #invSubLineOffset(row, col) {
    const wrap  = this.#config.lineWrap
    const cols  = this.#config.cols
    const width = this.#textBox.cols
    if(!wrap)
      return col
    else if(cols != null)
      return row * cols + col
    else
      return row * width + col
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
    const cols = this.#config.cols == null ? tBox.cols : this.#config.cols
    if(y > cH) 
      col += floor(y / cH) * cols
    const colsWidth = this.#charToColumn(row, this.#lines[row].chars.length)
    col = min(col, colsWidth)
    const chr = this.#columnToChar(row, col)
    return [row, chr]
  }

  /** Update the textBox geometry. Does not access DOM layout. */
  #recalculateTextBox() {
    const margin   = this.#marginWidth
    const cBox     = this.#contentBox
    const left     = cBox.left + margin
    const height   = cBox.height
    const maxWidth = cBox.width - margin
    const width    = this.#config.cols == null
                     ? maxWidth - this.#charWidth/2 // workaround for buggy monospace wrapping
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
      'undo-depth', 'selection-effects', 'expand-tab', 'tab-width']
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
      this.#resetSelection()
      break
    case 'row-navigation':
      if(val == 'row')       this.#config.rowNavigation = true
      else if(val == 'line') this.#config.rowNavigation = false
      break
    case 'eol-navigation':
      if(val == 'wrap')     this.#config.eolNavigation = true
      else if(val == 'off') this.#config.eolNavigation = false
      break
    case 'selection-effects':
      if(val == 'overlay') {
        this.#config.selectionFx = true
        this.#elements.doc.classList.add('enable-selection-effects')
      } else if(val == 'off') {
        this.#config.selectionFx = false
        this.#elements.doc.classList.remove('enable-selection-effects')
      }
      this.#resetSelection()
      break
    case 'line-nums':
      if(val == 'on') this.#enableLineNumbers()
      else if(val == 'off') this.#disableLineNumbers()
      this.#resetSelection()
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
      this.#resetSelection()
      break
    case 'undo-depth':
      this.#setUndoDepth(Number.parseInt(x))
      break
    case 'expand-tab':
      if(val == 'true')       this.#config.expandTab = true
      else if(val == 'false') this.#config.expandTab = false
      break
    case 'tab-width': {
      const x = Number.parseInt(val)
      this.#config.tabWidth = x
      this.#elements.doc.style.setProperty('--tab-width', x)
      break
    }
    }
  }

  get annotations()       { return JSON.parse(JSON.stringify(this.ranges)) }
  get caretPosition()     { return [this.#caretLine, this.#caretColumn] }
  set caretPosition(x)    { this.#moveTo(...x) }
  get cols()              { return this.#config.cols == null ? 'auto' : this.#config.cols }
  set cols(x)             { this.setAttribute('cols', x) }
  get disabled()          { return this.#config.disabled }
  set disabled(x)         { this.setAttribute('disabled', x) }
  get expandTab()         { return this.#config.expandTab }
  set expandTab(x)        { this.setAttribute('expand-tab', x) }
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
  get selectionEffects()  { return this.#config.selectionFx ? 'overlay' : 'off' }
  set selectionEffects(x) { this.setAttribute('selection-effects', x) }
  get showBoundary()      { return this.#config.showBoundary ? 'column' : 'off' }
  set showBoundary(x)     { this.setAttribute('show-boundary', x) }
  get tabWidth()          { return this.#config.tabWidth }
  set tabWidth(x)         { this.setAttribute('tab-width', x) }
  get type()              { return this.localName }
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

  /** An ordering for ranges and annotations compatible with `Array.prototype.sort`. */
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
    return MuchText.comparePoints(a.startLine, a.startColumn, b.startLine, b.startColumn) >= 0 &&
           MuchText.comparePoints(a.endLine, a.endColumn, b.endLine, b.endColumn) <= 0
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

  static ensureForwards(range) {
    if(MuchText.comparePoints(range.startLine, range.startColumn, range.endLine, range.endColumn) < 0)
      return range
    else
      return {
        startLine: range.endLine,
        startColumn: range.endColumn,
        endLine: range.startLine,
        endColumn: range.startColumn,
      }
  }

  /** Returns a new range guaranteed to be in range and not backwards. */
  #normalizeRange(range) {
    range = {startLine: range.startLine, startColumn: range.startColumn, 
             endLine:   range.endLine,   endColumn:   range.endColumn}
    range = MuchText.ensureForwards(range)
    if(range.startLine < 0) {
      range.startLine = 0
      range.startColumn = 0
    }
    const lastLine = this.#lines.length - 1
    const lastCol = this.#lines[lastLine].chars.length
    if(MuchText.comparePoints(range.startLine, range.startColumn, lastLine, lastCol) > 0) {
      range.startLine = lastLine
      range.startColumn = lastCol
    } else {
      range.startColumn = min(range.startColumn, this.#lines[range.startLine].chars.length)
    }
    if(MuchText.comparePoints(range.endLine, range.endColumn, lastLine, lastCol) > 0) {
      range.endLine = lastLine
      range.endColumn = lastCol
    } else {
      range.endColumn = min(range.endColumn, this.#lines[range.endLine].chars.length)
    }
    return range
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
    this.setSelection(this.#selection)
    this.#changed.marginWidth = true
    this.#scheduleRefresh()
  }

  #disableLineNumbers() {
    this.#elements.doc.classList.remove('show-line-nums')
    //this.#elements.margin.style.display = 'none'
    this.#marginWidth = 0
    this.#config.lineNums = false
    this.setSelection(this.#selection)
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

  /**  Convert a char list to a string for display in HTML.
   *
   * Note: this function converts tabs to spaces so that they wrap correctly,
   * it is not meant for exporting source text.
   */
  #prepareText(chars, offset=0) {
    const tW = this.#config.tabWidth
    let t = offset % tW // Distance to next tab stop
    if(t == 0) t = tW
    else t = tW - t
    return chars.map(c => {
      if(c == '\t') {
        offset += t
        const spaces = Array(t).fill(' ').join('')
        t = tW
        return spaces
      } else {
        offset += 1
        t = t>1 ? t-1 : tW
        return c
      }
    }).join('')
  }

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
      element: createElement('div', {className: 'line', innerText: this.#prepareText(Array.from(str))}),
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
        element: createElement('div', {className: 'line', innerText: this.#prepareText(rem)}),
        ranges:  last.ranges.slice(),
      }
      this.#lines.splice(row + nLines + 1, 0, tailLine)
      last.element.innerText = this.#prepareText(last.chars)
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
    range = this.#normalizeRange(range)
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
        element: createElement('div', {className: 'line', innerText: this.#prepareText(rem)}),
        ranges:  start.ranges.slice(),
      }
      this.#lines.splice(startLine + 1, 0, tailLine)
      start.element.innerText = this.#prepareText(start.chars)
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
    const range = {startLine, startColumn, endLine, endColumn, cls, hidden: false}
    let idx = this.ranges.findIndex(r => MuchText.compareRanges(r, range) > 0)
    if(idx == -1) idx = this.ranges.length
    this.ranges.splice(idx, 0, range)
    for(let i=startLine; i<=endLine; i++) {
      const ln = this.#lines[i] 
      let j = ln.ranges.findIndex(x => MuchText.compareRanges(x, range) > 0)
      if(j == -1) j = ln.ranges.length
      ln.ranges.splice(j, 0, range)
      ln.dirty = true
    }

    this.#changed.annotations = true
    this.#scheduleRefresh()
  }

  clearAnnotations() {
    this.ranges = []
    this.#lines.forEach((line,i) => {
      line.ranges.splice(0, line.ranges.length)
      line.dirty = true
    })
    this.#changed.annotations = true
    this.#scheduleRefresh()
  }

  /** Efficiently replace the annotations that start in a given range.
   * 
   *  Any existing annotations that are not present in the replacement list are
   *  removed, while new annotations are added. The replacements must be sorted
   *  in `MuchText.compareRanges` order.
   */
  replaceAnnotations(region, newRanges) {
    // Step 1: Find annotations starting in the replacement region
    //
    // These annotations occur as a (possibly empty) sub-list of `this.ranges`
    // which we will call `oldRanges`, bounded by indices `oldMin` and `oldMax`
    // such that for all `oldMin <= x < oldMax`, `this.ranges[x]` starts within
    // `region`, and all other annotations start elsewhere.
    //
    // We calculate `oldMin` to be the index of the first annotation to start
    // on or after the region's starting point, and `oldMax` to be the index of
    // the first annotation to start on or after the region's ending point. For
    // both values, if no such index can be found, `this.ranges.length` is used
    // instead.
    let oldMin = this.ranges.findIndex(r => MuchText.relativePlacement(r.startLine, r.startColumn, region) >= 0)
    let oldMax = this.ranges.findIndex(r => MuchText.relativePlacement(r.startLine, r.startColumn, region) > 0)
    if(oldMin == -1) oldMin = this.ranges.length
    if(oldMax == -1) oldMax = this.ranges.length
    const oldRanges = this.ranges.slice(oldMin, oldMax)

    // Step 2: Diff the old and new annotation lists for the replacement region
    //
    // Some of the annotations in the replacement list may be identical to
    // annotations that are already applied. We are only interested in those
    // that occur in one list but not the other. We will construct two lists
    // `insertions` and `deletions` to keep track of annotations being added
    // to or removed from `this.ranges`, which we will use to update all of
    // the affected lines in the next step.
    //
    // Using two markers `i` and `j` to keep track of our place in `newRanges`
    // and `oldRanges` respectively, we iterate over the pair of lists by
    // comparing the sort-order of `newRanges[i]` and `oldRanges[j]`. A lower
    // sort order for the `newRanges` item indicates an insertion, a higher
    // value indicates a deletion. A third marker `c` tracks our position in
    // `this.ranges`.
    const insertions = []
    const deletions = []
    let i = 0      // index into newRanges
    let j = 0      // index into oldRanges
    let c = oldMin // index into live ranges
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
        this.ranges.splice(c, 1)
        deletions.push(rOld)
        j++
      } else if(addNew) {
        this.ranges.splice(c, 0, rNew)
        insertions.push(rNew)
        i++
        c++
      } else if(gotMatch) {
        i++
        j++
        c++
      }
    }

    // Step 3: Mark affected lines as dirty
    for(let ann of deletions) {
      for(let i=ann.startLine; i<=ann.endLine; i++) {
        const ln = this.#lines[i]
        const j = ln.ranges.indexOf(ann)
        if(j == -1) console.info('Line annotation consistency check failure. This is a bug in much-text! I would be grateful if you could let me know about it on the much-text issue tracker at http://github.com/shmookey/much-text/issues')
        else ln.ranges.splice(j, 1)
        if(!ann.hidden) ln.dirty = true
      }
    }
    for(let ann of insertions) {
      for(let i=ann.startLine; i<=ann.endLine; i++) {
        const ln = this.#lines[i]
        let j = ln.ranges.findIndex(x => MuchText.compareRanges(x, ann) > 0)
        if(j == -1) j = ln.ranges.length
        ln.ranges.splice(j, 0, ann)
        if(!ann.hidden) ln.dirty = true
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

  /* Selections are displayed using <div>s in the selection-background layer
   * for each line that contains selected characters, with the same dimensions
   * as the line box, which contains a <span> that is sized (using spaces) and
   * positioned (using margin-left) to occupy the same area as the selected
   * characters. Optionally, this is mirrored on the selection-foreground.
   *
   * The "line set" of a selection is an array of triples [line, start, end]
   * of integer values representing the selected columns for each line that
   * contains selected characters. When the selection changes (e.g. in response
   * to pointer movement during a mouse drag operation) a new line set is
   * generated and compared to the previous (or "active") line set using a
   * diffing algorithm. The algorithm determines the minimal set of insertions,
   * deletions and alterations required to update the DOM to reflect the new
   * selection.
   */


  get selectedRange() {
    if(!this.#selection) return null
    else return {...this.#selection}
  }

  #createLineSet(range) {
    if(!range) return []
    range = this.#normalizeRange(range)
    const buf = []
    let row = range.startLine
    let col = range.startColumn
    let i = 0
    for(i=range.startLine; i<range.endLine; i++) {
      const end = this.#lines[i].chars.length
      buf.push([i, col, end])
      col = 0
    }
    buf.push([i, col, range.endColumn])
    return buf
  }

  #createLineBoxes(line, start, end, cls='selection') {
    const len  = this.#charToColumn(line, this.#lines[line].chars.length)
    const startCol = this.#charToColumn(line, start)
    const endCol = this.#charToColumn(line, end)
    const cols = this.#config.lineWrap ? (this.#config.cols ? this.#config.cols
                                                            : this.#textBox.cols)
                                       : len+1
    const buf  = []
    let i = startCol
    let r = floor(startCol / cols)
    while(true) {
      const boundary = ceil((i+0.1)/cols)*cols
      if(endCol <= boundary) {
        buf.push([r, i % cols, endCol - i])
        break
      } else {
        buf.push([r, i % cols, boundary - i])
        r++
        i = boundary
      }
    }
    
    const rows = buf.map(([r,l,w]) => createElement('div', {
      className: cls,
      part:      cls,
    }, {
      top:        `calc(var(--line-height) * ${r})`,
      marginLeft: `${l}ch`,
      width:      `${w}ch`,
    }))
    const elem = createElement('div', {}, {gridRowStart: line+1})
    elem.append(...rows)
    return elem
  }

  #resetSelection() {
    const sel = this.#selection
    this.setSelection(null)
    this.setSelection(sel)
  }

  setSelection(range) {
    const elems   = this.#selectionElements
    const lineset = this.#createLineSet(range)
    const diff    = diffLineSets(this.#selectionLineSet, lineset)

    for(let [line, start, end] of diff.insertions) {
      if(elems[line]) throw 'Internal error'
      const bgDiv = this.#createLineBoxes(line, start, end)
      this.#elements.selectionBackgroundLayer.append(bgDiv)

      let fxDiv = null
      if(this.#config.selectionFx) {
        fxDiv = this.#createLineBoxes(line, start, end, 'selection-effect')
        this.#elements.selectionForegroundLayer.append(fxDiv)
      }

      elems[line] = [bgDiv, fxDiv]
    }
    for(let [line, start, end] of diff.deletions) {
      elems[line][0].remove()
      elems[line][1]?.remove()
      delete elems[line]
    }
    for(let [line, start, end] of diff.alterations) {
      if(!elems[line]) throw 'Internal error'
      const bgDiv = this.#createLineBoxes(line, start, end)
      elems[line][0].replaceWith(bgDiv)

      let fxDiv = null
      if(this.#config.selectionFx) {
        fxDiv = this.#createLineBoxes(line, start, end, 'selection-effect')
        elems[line][1].replaceWith(fxDiv)
      }

      elems[line] = [bgDiv, fxDiv]
    }

    this.#selection = range
    this.#selectionLineSet = lineset
  }

  #startSelection() {
    if(this.#selection) this.clearSelection()
    this.#selection = {
      startLine:   this.#caretLine,
      startColumn: this.#caretColumn,
      endLine:     this.#caretLine,
      endColumn:   this.#caretColumn,
    }
    this.#elements.doc.classList.add('select')
  }

//  #addLineSelection(lineNumber, offset, from, to) {
//    const line = this.#lines[lineNumber]
//    const eSelection  = this.#elements.selectionBackgroundLayer
//    const fxSelection = this.#elements.selectionForegroundLayer
//    if(to == null) to = line.chars.length
//    const wrap = this.#config.lineWrap
//    const cols = this.#config.cols
//    const width = cols == null ? this.#textBox.cols : cols
//    const margin = this.#marginWidth
//
//    const mkLineSel = () => createElement('div', {
//      className: 'line-selection', 
//      part:      'line-selection'
//    })
//    const mkLineFX = () => createElement('div', {
//      className: 'line-selection-effect',
//      part:      'line-selection-effect'
//    })
//
//    if(to <= width || !this.#config.lineWrap) {
//      const e = mkLineSel()
//      e.style.gridRow = lineNumber+1
//      e.style.left  = `calc(${margin}px + ${from}ch)`
//      e.style.width = `calc(${to-from}ch)`
//      eSelection.appendChild(e)
//      const fx = mkLineFX() 
//      fx.style.gridRow = lineNumber+1
//      fx.style.left  = `calc(${margin}px + ${from}ch)`
//      fx.style.width = `calc(${to-from}ch)`
//      fxSelection.appendChild(fx)
//      offset.row++
//    } else {
//      const fromRow = floor(from / width)
//      const toRow = floor(to / width)
//      let left = from % width
//      let j = 1
//      for(let i=fromRow; i<=toRow; i++) {
//        const right = i<toRow ? width : (to % width)
//        const e = mkLineSel()
//        e.style.gridRow = lineNumber+1  
//        e.style.top   = `calc(${i} * calc(var(--line-height)))`
//        e.style.left  = `calc(${margin}px + ${left}ch)`
//        e.style.width = `calc(${right - left}ch)`
//        eSelection.appendChild(e)
//        const fx = mkLineFX()
//        fx.style.gridRow = lineNumber+1
//        fx.style.top   = `calc(${i} * calc(var(--line-height)))`
//        fx.style.left  = `calc(${margin}px + ${left}ch)`
//        fx.style.width = `calc(${right - left}ch)`
//        fxSelection.appendChild(fx)
//        left = 0
//        offset.row++
//        j++
//      }
//    }
//  }

  /** Render the selection. Both accesses and changes DOM and styles! */
//  #highlightSelection() {
//    const selection = this.#selection
//    if(!selection) throw 'no selection'
//    Array.from(this.#elements.selectionBackgroundLayer.childNodes).map(e => e.remove())
//    Array.from(this.#elements.selectionForegroundLayer.childNodes).map(e => e.remove())
//    const isBackwards = 
//      selection.endLine < selection.startLine || 
//      selection.endLine == selection.startLine && selection.endColumn < selection.startColumn
//
//    const startLine   = isBackwards ? selection.endLine : selection.startLine
//    const endLine     = isBackwards ? selection.startLine : selection.endLine
//    const startColumn = isBackwards ? selection.endColumn : selection.startColumn
//    const endColumn   = isBackwards ? selection.startColumn : selection.endColumn
//    
//    let left = startColumn
//    let offset = {
//      top: this.#lineDocOffset(startLine), // this.#lines[startLine].element.offsetTop,
//      row: 0,
//    }
//    let cols = this.#textBox.cols
//    if(this.#config.lineWrap && startColumn > cols) {
//      offset.top += floor(startColumn / cols) * this.#charHeight
//    }
//    for(let i=startLine; i<=endLine; i++) {
//      let right = i==endLine ? endColumn : null
//      this.#addLineSelection(i, offset, left, right)
//      left = 0
//    }
//  }

  #selectToCaret() {
    const selection = this.#selection
    if(!selection) throw 'no selection'
    selection.endLine   = this.#caretLine
    selection.endColumn = this.#caretColumn
//    this.#changed.selection = true
//    this.#scheduleRefresh()
    this.setSelection(selection)
  }

  clearSelection() {
    if(!this.#selection) return
//    Array.from(this.#elements.selectionBackgroundLayer.childNodes).map(e => e.remove())
//    Array.from(this.#elements.selectionForegroundLayer.childNodes).map(e => e.remove())
    this.#elements.doc.classList.remove('select')
    this.#selection = null
    this.setSelection(null)
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
    this.deleteRange(this.#normalizeRange(this.#selection), true, inputType)
    this.clearSelection()
  }

  /** Select text within a given range, clobbering any previous selection. */
  selectRange(range) {
    this.#startSelection()
    this.#selection.startLine = range.startLine
    this.#selection.startColumn = range.startColumn
    this.#selection.endLine = range.endLine
    this.#selection.endColumn = range.endColumn
    this.setSelection(this.#selection)
    //this.#changed.selection = true
    //this.#scheduleRefresh()
  }

  /** Select a region contained between the nearest whitespace to the caret. */
  #selectWord() {
    const row = this.#caretLine
    const line = this.#lines[row]
    let from, to
    for(from = this.#caretColumn; from > 0; from--)
      if(WORD_BREAK_CHARS.includes(line.chars[from])) break
    for(to = this.#caretColumn; to < line.chars.length; to++)
      if(WORD_BREAK_CHARS.includes(line.chars[to])) break
    this.selectRange({startLine: row, startColumn: from + 1, endLine: row, endColumn: to})
  }

  #selectAll() {
    if(this.#selection) this.clearSelection()
    this.#startSelection()
    this.#selection = {
      startLine:   0,
      startColumn: 0,
      endLine:     this.#lines.length-1,
      endColumn:   this.#lines[this.#lines.length-1].chars.length,
      //element:     this.#selection.element,
      //effectLayer: this.#selection.effectLayer,
    }
    this.setSelection(this.#selection)
    //this.#changed.selection = true
    //this.#scheduleRefresh()
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
    if(refreshSelection)
      this.setSelection(this.#selection) 
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
        style.setProperty('--line-width',     `${tBox.cols + 0.5}ch`)
        style.setProperty('--line-min-width', `${tBox.cols + 0.5}ch`)
      } else {
        style.setProperty('--line-width',     `${cols + 0.5}ch`)
        style.setProperty('--line-min-width', `${cols + 0.5}ch`)
      }
      style.setProperty('--dead-width',     0) // `${tBox.maxWidth-tBox.width}px`)
    } else {
      style.setProperty('--line-width',      `fit-content`)
      style.setProperty('--line-min-width',  `${tBox.maxCols}ch`)
      style.setProperty('--dead-width',      `100%`)
    }
  }

  /** Updates line numbers, overflow area, and line effect elements. */
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
    // Repeat process for line effect elements
    nHave = this.#elements.lineEffectLayer.children.length
    nExtra = nHave - nNeed
    let row = nHave
    while(nExtra > 0) {
      this.#elements.lineEffectLayer.lastElementChild.remove()
      nExtra--
    }
    while(nExtra < 0) {
      const e = createElement('div', {className: 'line-effect', part: 'line-effect'})
      e.style.gridRowStart = row + 1
      row++
      this.#elements.lineEffectLayer.appendChild(e)
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
      line.element.innerText = this.#prepareText(line.chars)
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
    let cur = 0   // current char
    let col = 0   // current column
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
 
      const chars = line.chars.slice(cur, cur+n)
      const fragment = this.#prepareText(chars, col)
      col += fragment.length
      
      if(classes.length > 0) {
        const span = createElement('span', {className: classes, part: classes})
        span.innerText = fragment
        line.element.appendChild(span)
      } else {
        const textNode = new Text(fragment)
        line.element.appendChild(textNode)
      }
      cur += n
    }
    if(cur < line.chars.length) {
      const classes = Array.from(active).map(r => r.cls).join(' ')
      const chars = line.chars.slice(cur, line.chars.length)
      const fragment = this.#prepareText(chars, col)
      if(classes.length > 0) {
        const span = createElement('span', {className: classes, part: classes})
        span.innerText = fragment
        line.element.appendChild(span)
      } else {
        const text = document.createTextNode(fragment)
        line.element.appendChild(text)
      }
    }
    line.dirty = false
  }

  #updateCaret() {
    const cL = this.#caretLine
    const cC = this.#caretColumn
    const ln = this.#lines[cL]
    const e  = this.#elements.caret

    const col   = this.#charToColumn(cL, cC)
    const [r,c] = this.#subLineOffset(col)
    
    e.style.left = `${c}ch`
    e.style.top  = `calc(${r} * var(--line-height))`
    ln.element.append(e)

    //const cL        = min(this.#lines.length-1, this.#caretLine)
    //const cC        = this.#caretColumn
    //const ln        = this.#lines[cL]
    //const h         = this.#charHeight
    //const margin    = this.#marginWidth
    //const tBox      = this.#textBox
    //const top       = this.#lineDocOffset(cL) // ln.element.offsetTop // this.#lineOffset(cL)
    //const cols      = this.#config.cols
    //const wrapPoint = cols == null ? tBox.cols : cols

    //if(cC >= wrapPoint && this.#config.lineWrap) {
    //  const n   = floor(cC / wrapPoint)
    //  const rem = cC % wrapPoint
    //  if(rem == 0 && cC != 0 && cC == ln.chars.length) {
    //    this.#elements.caret.style.left = `calc(${margin}px + ${cC}ch)`
    //    this.#elements.caret.style.top  = `${top}px` //`calc(${cL} * (1em + 1ex))`
    //  } else {
    //    this.#elements.caret.style.left = `calc(${margin}px + ${rem}ch)`
    //    this.#elements.caret.style.top  = `${top + n*h}px` //`calc(${cL} * (1em + 1ex))`
    //  }
    //} else if(ln) {
    //  this.#elements.caret.style.left = `calc(${margin}px + ${cC}ch)`
    //  this.#elements.caret.style.top  = `${top}px` //`calc(${cL} * (1em + 1ex))`
    //}

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
        this.#elements.curLine = this.#elements.lineEffectLayer.childNodes[cL]
        this.#elements.curLine?.classList.add('active')
        this.#elements.curLine?.part.add('active-line')
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
    //this.clearSelection()
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
      case 'Tab':        ev.preventDefault(); this.#keyTab(ev); break
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

  #keyTab() {
    if(this.#config.readOnly) return
    const tw = this.#config.tabWidth
    const col = this.#charToColumn(this.#caretLine, this.#caretColumn)
    let w = tw - (col % tw)
    if(w == 0) w = tw
    let x = this.#config.expandTab ? Array(w).fill(' ').join('') : '\t'
    if(this.#selection) {
      this.replaceRange(this.#selection, x, true, 'insertText')
      this.clearSelection()
    } else {
      this.insert(x, 'insertText')
    }
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


