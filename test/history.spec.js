describe('history spec', () => {
  const { round } = Math
  const mod = navigator.platform.indexOf('Mac') > -1 ? '{meta}' : '{ctrl}'

  beforeEach(() => {
    cy.visit('/test.html')
  })

  const moveTo = (row, col) => $e => { $e[0].caretPosition = [row, col]; beAt(row, col)($e) }
  const beAt = (row, col) => $e => expect($e[0].caretPosition).to.be.deep.eq([row, col])

  function init(text='', opts={}) {
    return cy.get('much-text').click().then($e => {
      for(let [k,v] of Object.entries(opts))
        $e[0].setAttribute(k,v)
      $e[0].setText(text)
    })
  }

  it('undo at earliest state does nothing', () => {
    init('ABC')
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('ABC'))
  })
  it('undo typing a character', () => {
    init('ABC')
      .type('D')
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('ABC'))
  })
  it('undo typing 3 characters', () => {
    init('ABC')
      .type('D\nE')
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('ABC'))
  })
  it('redo typing a character', () => {
    init('ABC')
      .should(moveTo(0,3))
      .type('D')
      .type(`${mod}z`)
      .type(`${mod}y`)
      .should($e => expect($e[0].value).to.eq('ABCD'))
  })
  it('redo typing 3 characters', () => {
    init('ABC')
      .should(moveTo(0,3))
      .type('D\nE')
      .type(`${mod}z`)
      .type(`${mod}y`)
      .should($e => expect($e[0].value).to.eq('ABCD\nE'))
  })
  it('undo backspacing a character', () => {
    init('ABC')
      .should(moveTo(0,3))
      .type('{backspace}')
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('ABC'))
  })
  it('undo backspacing 3 characters', () => {
    init('ABCD')
      .should(moveTo(0,3))
      .type('{backspace}{backspace}{backspace}')
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('ABCD'))
  })
  it('undo some backspaces following some insertions', () => {
    init('AB')
      .should(moveTo(0,2))
      .type('CDE')
      .type('{backspace}{backspace}')
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('ABCDE'))
  })
  it('undo twice', () => {
    init('AB')
      .should(moveTo(0,2))
      .type('CDE')
      .type('{backspace}{backspace}')
      .type(`${mod}z`)
      .type(`${mod}z`)
      .should($e => expect($e[0].value).to.eq('AB'))
  })
  it('undo twice then redo', () => {
    init('AB')
      .should(moveTo(0,2))
      .type('CDE')
      .type('{backspace}{backspace}')
      .type(`${mod}z`)
      .type(`${mod}z`)
      .type(`${mod}y`)
      .should($e => expect($e[0].value).to.eq('ABCDE'))
  })
})
