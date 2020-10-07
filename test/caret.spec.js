describe('caret spec', () => {

  const { round } = Math
  const isMac = navigator.platform.indexOf('Mac') > -1
  const modKey = isMac ? '{meta}' : '{ctrl}'

  beforeEach(() => {
    cy.visit('/test.html')
  })

  function reset(text='') {
    return $e => {
      $e[0].setText(text)
      $e[0].scrollTo(0,0)
    }
  }
  function beAt(row, col) {
    return $e => expect($e[0].caretPosition).to.deep.eq([row, col])
  }
  function init(text='', opts={}) {
    return cy.get('much-text').click().then($e => {
      for(let [k,v] of Object.entries(opts))
        $e[0].setAttribute(k,v)
      reset(text)($e)
    }).then(waitForFrame)
  }
  function moveTo(row, col) {
    return $e => { $e[0].caretPosition = [row, col] }
  }
  function rectVals(x) {
    return [x.left, x.top, x.width, x.height].map(round)
  }
  function waitForFrame($e) {
    return new Promise((resolve,reject) => {
      requestAnimationFrame(() => 
        requestAnimationFrame(() => resolve()))
    })
  }
  function bePositionedAt(row, col) {
    return $e => {
      const cW   = $e[0].host.debug.charWidth
      const cH   = $e[0].host.debug.charHeight
      const tBox = $e[0].host.debug.textBox
      const vis  = $e[0].host.debug.visibleRegion
      const cBox = $e[0].querySelector('#caret').getBoundingClientRect()
      const eBox = {
        left:   tBox.left + cW * col - vis.firstColOverflow,
        top:    tBox.top + cH * row - vis.firstLineOverflow,
        width:  cW,
        height: cH,
      }
      expect(rectVals(cBox)).to.deep.eq(rectVals(eBox))
    }
  }
  function beScrolledTo(row, col) {
    return $e => {
      const cW = $e[0].debug.charWidth
      const cH = $e[0].debug.charHeight
      const left = Math.ceil(col * cW)
      const top  = Math.ceil(row * cH)
      const vis  = $e[0].debug.visibleRegion
      expect([vis.scrollX, vis.scrollY]).to.deep.eq([left, top])
    }
  }
  /** Scroll to a (possibly non-integer) row,col position. */
  function scrollToPosition(row, col) {
    return $e => {
      const cW = $e[0].debug.charWidth
      const cH = $e[0].debug.charHeight
      const scrollOptions = {
        left:      Math.ceil(col * cW),
        top:       Math.ceil(row * cH),
        behaviour: 'auto', 
      }
      $e[0].scrollTop  = scrollOptions.top
      $e[0].scrollLeft = scrollOptions.left
      $e[0].scroll()
      //cy.wrap($e).scrollTo(scrollOptions)
    }
  }
  /** Click the element at a (possibly non-integer) row,col position. */
  function clickPoint(row, col) {
    return $e => {
      const cW = $e[0].debug.charWidth
      const cH = $e[0].debug.charHeight
      cy.wrap($e).click(col * cW, row * cH)
    }
  }

  it('start at 0,0', () => {
    cy.visit('/test.html')
    init().should(beAt(0,0))
    init('A').should(beAt(0,0))
  })
  it('move to set position within bounds', () => {
    cy.visit('/test.html')
    init('AAA\nBBB\nCCC').should(moveTo(2,2)).should(beAt(2,2))
  })
  it('move to set position beyond line length', () => {
    cy.visit('/test.html')
    init('AAA\nBBB\nCCC').should(moveTo(2,5)).should(beAt(2,3))
  })
  it('move to set position beyond line count', () => {
    cy.visit('/test.html')
    init('AAA\nBBB\nCCC').should(moveTo(5,2)).should(beAt(2,2))
  })
  it('move to set position out of line and column bounds', () => {
    cy.visit('/test.html')
    init('AAA\nBBB\nCCC').should(moveTo(5,5)).should(beAt(2,3))
  })
  it('advance caret column by normal typing', () => {
    cy.visit('/test.html')
    init().type('A').should(beAt(0,1))
  })
  it('advance caret line by typing a line break', () => {
    cy.visit('/test.html')
    init().type('A\n').should(beAt(1,0))
  })
  it('retreat caret column by normal backspace', () => {
    cy.visit('/test.html')
    init('A').type('{backspace}').should(beAt(0,0))
  })
  it('backspace at start of document does nothing', () => {
    cy.visit('/test.html')
    init('').type('{backspace}').should(beAt(0,0))
  })
  it('typed character overflows cols with wrap="hard"', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5, wrap: 'hard'})
      .should(moveTo(0,5))
      .type('A')
      .should(beAt(1,1))
  })
  it('typed character overflows cols with wrap="soft"', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5, wrap: 'soft'})
      .should(moveTo(0,5))
      .type('A')
      .should(beAt(0,6))
  })
  it('typed character overflows cols with wrap="off"', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,5))
      .type('A')
      .should(beAt(0,6))
  })
  it('advance caret column with right arrow', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,3))
      .type('{rightArrow}')
      .should(beAt(0,4))
  })
  it('retreat caret column with left arrow', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,3))
      .type('{leftArrow}')
      .should(beAt(0,2))
  })
  it('maintain column and increment line with down arrow', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,1))
      .type('{downArrow}')
      .should(beAt(1,1))
  })
  it('maintain column and decrement line with up arrow', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(1,1))
      .type('{upArrow}')
      .should(beAt(0,1))
  })
  it('up arrow on first line does nothing', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,1))
      .type('{upArrow}')
      .should(beAt(0,1))
  })
  it('down arrow on last line does nothing', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,1))
      .type('{upArrow}')
      .should(beAt(0,1))
  })
  it('left arrow from first column wraps to end of prev line', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(1,0))
      .type('{leftArrow}')
      .should(beAt(0,3))
  })
  it('right arrow from last column wraps to end of next line', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,3))
      .type('{rightArrow}')
      .should(beAt(1,0))
  })
  it('left arrow from first column does nothing with eol-navigation off', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off', 'eol-navigation': 'off'})
      .should(moveTo(1,0))
      .type('{leftArrow}')
      .should(beAt(1,0))
  })
  it('right arrow from last column does nothing with eol-navigation off', () => {
    cy.visit('/test.html')
    init('AAA\nAAA', {cols: 5, wrap: 'off', 'eol-navigation': 'off'})
      .should(moveTo(0,3))
      .type('{rightArrow}')
      .should(beAt(0,3))
  })
  it('row-navigate down within soft-wrapped line', () => {
    cy.visit('/test.html')
    init('AAAAAAAA', {cols: 5, wrap: 'soft', 'row-navigation': 'row'})
      .should(moveTo(0,2))
      .type('{downArrow}')
      .should(beAt(0,7))
  })
  it('row-navigate up within soft-wrapped line', () => {
    cy.visit('/test.html')
    init('AAAAAAAA', {cols: 5, wrap: 'soft', 'row-navigation': 'row'})
      .should(moveTo(0,7))
      .type('{upArrow}')
      .should(beAt(0,2))
  })
  it('row-navigate up into soft-wrapped line', () => {
    cy.visit('/test.html')
    init('AAAAAAAA\nAAA', {cols: 5, wrap: 'soft', 'row-navigation': 'row'})
      .should(moveTo(1,2))
      .type('{upArrow}')
      .should(beAt(0,7))
  })
  it('row-navigate down out of soft-wrapped line', () => {
    cy.visit('/test.html')
    init('AAAAAAAA\nAAA', {cols: 5, wrap: 'soft', 'row-navigation': 'row'})
      .should(moveTo(0,7))
      .type('{downArrow}')
      .should(beAt(1,2))
  })
  it('preserve sticky column moving down', () => {
    cy.visit('/test.html')
    init('AAAAA\nAA\nAAAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(0,4))
      .type('{downArrow}{downArrow}')
      .should(beAt(2,4))
  })
  it('preserve sticky column moving up', () => {
    cy.visit('/test.html')
    init('AAAAA\nAA\nAAAAA', {cols: 5, wrap: 'off'})
      .should(moveTo(2,4))
      .type('{upArrow}{upArrow}')
      .should(beAt(0,4))
  })
  it('backspace wraps on line break', () => {
    cy.visit('/test.html')
    init('AAA\nAA', {cols: 5, wrap: 'off'})
      .should(moveTo(1,0))
      .type('{backspace}')
      .should(beAt(0,3))
  })
  it('home key moves to start of logical line with row-navigation="line"', () => {
    cy.visit('/test.html')
    init('AAAAAAA', {cols: 5, wrap: 'off', 'row-navigation': 'line'})
      .should(moveTo(0,7))
      .type('{home}')
      .should(beAt(0,0))
  })
  it('end key moves to end of logical line with row-navigation="line"', () => {
    cy.visit('/test.html')
    init('AAAAAAA', {cols: 5, wrap: 'off', 'row-navigation': 'line'})
      .should(moveTo(0,1))
      .type('{end}')
      .should(beAt(0,7))
  })
  it('home key moves to start of visual soft-wrapped line with row-navigation="row"', () => {
    cy.visit('/test.html')
    init('AAAAAAAA', {cols: 5, wrap: 'soft', 'row-navigation': 'row'})
      .should(moveTo(0,8))
      .type('{home}')
      .should(beAt(0,5))
  })
  it('end key moves to end of visual soft-wrapped line with row-navigation="row"', () => {
    cy.visit('/test.html')
    init('AAAAAAA', {cols: 5, wrap: 'soft', 'row-navigation': 'row'})
      .should(moveTo(0,2))
      .type('{end}')
      .should(beAt(0,5))
  })
  it('home key moves to start of logical non-softwrapped line with row-navigation="line"', () => {
    cy.visit('/test.html')
    init('AAAAAAA', {cols: 5, wrap: 'off', 'row-navigation': 'line'})
      .should(moveTo(0,7))
      .type('{home}')
      .should(beAt(0,0))
  })
  it('end key moves to end of non-softwrapped logical line with row-navigation="line"', () => {
    cy.visit('/test.html')
    init('AAAAAAA', {cols: 5, wrap: 'off', 'row-navigation': 'line'})
      .should(moveTo(0,1))
      .type('{end}')
      .should(beAt(0,7))
  })
  it('left key moves to start of selection', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5})
      .should(moveTo(0,1))
      .type('{shift}{rightarrow}{rightarrow}{rightarrow}')
      .type('{leftarrow}')
      .should(beAt(0,1))
  })
  it('right key moves to end of selection', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5})
      .should(moveTo(0,1))
      .type('{shift}{rightarrow}{rightarrow}{rightarrow}')
      .type('{rightarrow}')
      .should(beAt(0,4))
  })
  it('typing over selection moves to end of insertion', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5})
      .should(moveTo(0,1))
      .type('{shift}{rightarrow}{rightarrow}{rightarrow}')
      .type('B')
      .should(beAt(0,2))
  })
  it('backspacing selection moves to start of selection', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5})
      .should(moveTo(0,1))
      .type('{shift}{rightarrow}{rightarrow}{rightarrow}')
      .type('{backspace}')
      .should(beAt(0,1))
  })
  it('delete selection moves to start of selection', () => {
    cy.visit('/test.html')
    init('AAAAA', {cols: 5})
      .should(moveTo(0,1))
      .type('{shift}{rightarrow}{rightarrow}{rightarrow}')
      .type('{del}')
      .should(beAt(0,1))
  })
  it('click in row when softwrapping beyond visible region', () => {
    cy.visit('/test.html')
    init('AAAAABBBB\nCCCCCDDDDD\nEEEEEFFFFF', {cols: 10, wrap: 'soft'})
      .then(clickPoint(2.5, 2.5))
      .should(beAt(2,2))
  })

  it('positioned correctly when soft wrapping but not on softwrapped row', () => {
    init('AA')
      .should(moveTo(0,2))
      .shadow()
      .should(bePositionedAt(0,2))
  })
  it('positioned correctly when soft wrapped', () => {
    init('AAAAAAA', {cols: 5, wrap: 'soft'})
      .should(moveTo(0,7))
      .shadow()
      .should(bePositionedAt(1,2))
  })
  it('positioned on current line when line ends at last col with soft wrap on', () => {
    init('AAAAA', {cols: 5, wrap: 'soft'})
      .should(moveTo(0,5))
      .shadow()
      .should(bePositionedAt(0,5))
  })
  it('positioned on next line when at last col in the middle of a soft wrapped line', () => {
    init('AAAAAA', {cols: 5, wrap: 'soft'})
      .should(moveTo(0,5))
      .shadow()
      .should(bePositionedAt(1,0))
  })
  it('positioned correctly when wrapping is off', () => {
    init('AA', {wrap: 'off'})
      .should(moveTo(0,2))
      .shadow()
      .should(bePositionedAt(0,2))
  })

  it('soft-wrap length exceeds available space while vertical scrollbar hidden', () => {
    init('AAAAABBBBB', {cols: 10, wrap: 'soft'})
      .should(moveTo(0,9))
      .shadow()
      .should(bePositionedAt(0,9))
  })
  it('soft-wrap length exceeds available space while vertical scrollbar visible', () => {
    init('A\nB\nAAAAABBBBBCCCCC\nC\nD\nE\nF', {cols: 10, wrap: 'soft'})
      .should(moveTo(2,9))
      .shadow()
      .should(bePositionedAt(2,9))
  })
  it('click in line in text with no wrapping', () => {
    init('AAAAA\nBBBBB\nCCCCC\nDDDDD\nEEEEE', {wrap: 'off'})
      .then(clickPoint(2.1, 2.1))
      .should(beAt(2,2))
  })
  it('click in line on soft-wrapped row', () => {
    init('AAAAA\nBBBBBCCCCC\nDDDDD\nEEEEE', {cols: 5, wrap: 'soft'})
      .then(clickPoint(2.1, 2.1))
      .should(beAt(1,7))
  })
  it('scrolled down by a whole line height', () => {
    init('A\nB\nC\nD\nE\nF')
      .type('G')
      .should(moveTo(3,0))
      .should(scrollToPosition(1, 0))
      .should(beScrolledTo(1, 0))
      .shadow()
      .should(bePositionedAt(2,0))
  })
  it('scrolled down by a partial line height', () => {
    init('A\nB\nC\nD\nE\nF\nG')
      .type('G')
      .should(moveTo(3,0))
      .should(scrollToPosition(1.3, 0))
      .should(beScrolledTo(1.3, 0))
      .shadow()
      .should(bePositionedAt(2,0))
  })
  it('scrolled down by a whole line height while on a soft-wrapped row', () => {
    init('A\nB\nC\nDDDDDDD\nE\nF\nG', {cols: 5, wrap: 'soft'})
      .type('G')
      .should(moveTo(3,6))
      .should(scrollToPosition(1, 0))
      .should(beScrolledTo(1, 0))
      .shadow()
      .should(bePositionedAt(3,1))
  })
  it('scrolled down by a partial line height while on a soft-wrapped row', () => {
    init('A\nB\nC\nDDDDDDD\nE\nF\nG', {cols: 5, wrap: 'soft'})
      .type('G')
      .should(moveTo(3,6))
      .should(scrollToPosition(1.4, 0))
      .should(beScrolledTo(1.4, 0))
      .shadow()
      .should(bePositionedAt(3,1))
  })
  it('horizontally scrolled by a whole column amount', () => {
    init('AAAAABBBBBCCCCC', {wrap: 'off'})
      .type('G')
      .should(moveTo(0,8))
      .should(scrollToPosition(0, 4))
      .should(beScrolledTo(0, 4))
      .shadow()
      .should(bePositionedAt(0,4))
  })
  it('horizontally scrolled by a whole column increment with vertical scrollbar visible', () => {
    init('A\nAAAAABBBBBCCCCC\nB\nC\nD\nE', {wrap: 'off'})
      .type('G')
      .should(moveTo(1,8))
      .should(scrollToPosition(0, 4))
      .should(beScrolledTo(0, 4))
      .shadow()
      .should(bePositionedAt(1,4))
  })
  it('scrolled by a partial increment on both axes', () => {
    init('A\nB\nC\nAAAAABBBBBCCCCC\nB\nC\nD\nE', {wrap: 'off'})
      .type('G')
      .should(moveTo(3,8))
      .should(scrollToPosition(1.3, 4.3))
      .should(beScrolledTo(1.3, 4.3))
      .shadow()
      .should(bePositionedAt(2,4))
  })
  it('scrolled by a partial increment on both axes on a soft-wrapped row', () => {
    init('A\nB\nC\nAAAAABBBBBCCCCCDDDDD\nB\nC\nD\nE', {cols: 15, wrap: 'soft'})
      .type('G')
      .should(moveTo(3,19))
      .should(scrollToPosition(1.9, 2.7))
      .should(beScrolledTo(1.9, 2.7))
      .shadow()
      .should(bePositionedAt(3,2))
  })
  it('click in line while horizontally scrolled with no wrapping', () => {
    init('AAAAA\nAAAAABBBBBCCCCCDDDDD\nCCCCC', {wrap: 'off'})
      .type('G')
      .should(scrollToPosition(0, 2))
      .should(beScrolledTo(0, 2))
      .then(clickPoint(1.1, 2.1))
      .should(beAt(1,4))
  })
  it('click in softwrapped row with horizontal scrollbar visible', () => {
    init('AAAAA\nBBBBBBBBBBBBBBB\nCCCCC', {cols: 10, wrap: 'soft'})
      .then(clickPoint(2.1, 3.1))
      .should(beAt(1,13))
  })
  it('click in softwrapped row while horizontally scrolled', () => {
    init('AAAAA\nBBBBBBBBBBBBBBB\nCCCCC', {cols: 10, wrap: 'soft'})
      .type('G')
      .should(scrollToPosition(0, 2))
      .should(beScrolledTo(0, 2))
      .then(clickPoint(2.1, 2.1))
      .should(beAt(1,14))
  })
  it('click in line while vertically scrolled with no wrapping', () => {
    init('AAAAA\n\nBBBBB\n\nCCCCC\n\nDDDDD\n\nEEEEE\n\nFFFFF', {wrap: 'off'})
      .type('G')
      .should(scrollToPosition(2, 0))
      .should(beScrolledTo(2, 0))
      .then(clickPoint(2.1, 2.1))
      .should(beAt(4,2))
  })
  it('click on softwrapped row while vertically scrolled', () => {
    init('AAA\n\nBBBBB\n\nCCCCCQQQQQ\n\nDDDDD\n\nEEEEE\n\nFFFFF', {cols: 5, wrap: 'soft'})
      .type('G')
      .should(scrollToPosition(2, 0))
      .should(beScrolledTo(2, 0))
      .then(clickPoint(3.1, 2.1))
      .should(beAt(4,7))
  })

  it('click on softwrapped row while fractionally vertically scrolled', () => {
    init('AAA\n\nBBBBB\n\nCCCCCQQQQQ\n\nDDDDD\n\nEEEEE\n\nFFFFF', {cols: 5, wrap: 'soft'})
      .type('G')
      .should(scrollToPosition(2.3, 0))
      .should(beScrolledTo(2.3, 0))
      .then(clickPoint(3.1, 2.1))
      .should(beAt(4,7))
  })
  it('click beyond end of line', () => {
    init('AAAAA\nBB\nCCCCC', {cols: 5, wrap: 'off'})
      .then(clickPoint(1.5, 5))
      .should(beAt(1,2))
  })
  it('click beyond end of softwrapped line', () => {
    init('AAAAA\nBBBBBCC\nDDDDD', {cols: 5, wrap: 'soft'})
      .then(clickPoint(2.5, 5))
      .should(beAt(1,7))
  })
  it('click beyond end of data', () => {
    init('AAAAA\nBBB', {cols: 5, wrap: 'off'})
      .then(clickPoint(3.5, 3.5))
      .should(beAt(1,3))
  })
  it('click beyond end of data onto softwrapped row', () => {
    init('AAAAA\nBBBBBCCC', {cols: 5, wrap: 'soft'})
      .then(clickPoint(4.1, 4.1))
      .should(beAt(1,8))
  })
  it('click in middle of 3 line softwrapped row', () => {
    init('AAAAA\nBBBBBCCCCCDDDDD', {cols: 5, wrap: 'soft'})
      .then(clickPoint(2.1, 2.1))
      .should(beAt(1,7))
  })

  it('undo returns to previous position', () => {
    init('AA', {cols: 5})
      .should(moveTo(0,2))
      .type('A{backspace}A{enter}AA')
      .type(`${modKey}z`)
      .should(beAt(0,2))
  })
  it('redo returns to original position', () => {
    init('AA', {cols: 5})
      .should(moveTo(0,2))
      .type('A{backspace}A{enter}AA')
      .type(`${modKey}z`)
      .type(`${modKey}y`)
      .should(beAt(1,2))
  })

  
})
