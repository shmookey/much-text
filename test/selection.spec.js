describe('selection spec', () => {

  const { round } = Math

  beforeEach(() => {
    cy.visit('/test.html')
  })

  function lineSummary($e) {
    const layer = $e[0].debug.elements.selectionBackgroundLayer
    const cW    = $e[0].debug.charWidth
    const mW    = $e[0].debug.marginWidth
    const cH    = $e[0].debug.charHeight
    return Array.from(layer.childNodes)
      .flatMap(($ln, idx) => Array.from($ln.childNodes)
        .map($sel => {
          const oL    = $sel.offsetLeft
          const oW    = $sel.offsetWidth
          const oT    = $sel.offsetTop
          const start = (oL - mW) / round(cW)
          const len   = round(oW / cW)
          const row   = oT / cH
          return [idx, row, start, len]
        })
    )
  }

  function init(text='', opts={}) {
    return cy.get('much-text').click().then($e => {
      for(let [k,v] of Object.entries(opts))
        $e[0].setAttribute(k,v)
      $e[0].setText(text)
      $e[0].scrollTo(0,0)
    }).then(waitForFrame)
  }
  function waitForFrame($e) {
    return new Promise((resolve,reject) => {
      requestAnimationFrame(() => 
        requestAnimationFrame(() => resolve()))
    })
  }

  function haveRows(rows) {
    return $e => {
      expect(lineSummary($e)).to.deep.eq(rows)
    }
  }

  function range(startLine, startColumn, endLine, endColumn) {
    return {startLine, startColumn, endLine, endColumn}
  }

  it('select within non-wrapped line', () => {
    init('ABCDE')
      .should($e => $e[0].selectRange(range(0,1,0,4)))
      .then(waitForFrame)
      .should(haveRows([
        [0, 0, 1, 3],
      ]))
  })
  it('select in second row of wrapped line', () => {
    init('AAAAABBBBB', {cols: 5, wrap: 'soft'})
      .should($e => $e[0].selectRange(range(0,6,0,9)))
      .then(waitForFrame)
      .should(haveRows([
        [0, 1, 1, 3],
      ]))
  })
  it('select across 2 rows of wrapped line', () => {
    init('AAAAABBBBB', {cols: 5, wrap: 'soft'})
      .should($e => $e[0].selectRange(range(0,1,0,9)))
      .then(waitForFrame)
      .should(haveRows([
        [0, 0, 1, 4],
        [0, 1, 0, 4],
      ]))
  })
  it('select across 2 non-wrapped lines', () => {
    init('AAAAA\nBBBBB', {cols: 5, wrap: 'soft'})
      .should($e => $e[0].selectRange(range(0,1,1,4)))
      .then(waitForFrame)
      .should(haveRows([
        [0, 0, 1, 4],
        [1, 0, 0, 4],
      ]))
  })
  it('select across wrapped line onto next line', () => {
    init('AAAAABBBBB\nCCCCC', {cols: 5, wrap: 'soft'})
      .should($e => $e[0].selectRange(range(0,1,1,4)))
      .then(waitForFrame)
      .should(haveRows([
        [0, 0, 1, 4],
        [0, 1, 0, 5],
        [1, 0, 0, 4],
      ]))
  })

  it('select backwards', () => {
    init('ABCDE')
      .should($e => $e[0].selectRange(range(0,4,0,1)))
      .then(waitForFrame)
      .should(haveRows([
        [0, 0, 1, 3],
      ]))
  })


  
})
