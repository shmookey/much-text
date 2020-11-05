describe('plaintext editing spec', () => {

  function init(text='', opts={}) {
    return cy.get('much-text').click().then($e => {
      for(let [k,v] of Object.entries(opts))
        $e[0].setAttribute(k,v)
      $e[0].setText(text)
      $e[0].scrollTo(0,0)
    })
  }
  function moveTo(row, col) {
    return $e => { $e[0].caretPosition = [row, col] }
  }
  function beString(str) {
    return $e =>
      expect($e[0].textContent).to.eq(str)
  }
  function insertAt(row, col, text) {
    return $e =>
      { $e[0].insertAt(row, col, text) }
  }
  function deleteRange(startLine, startColumn, endLine, endColumn) {
    return $e => 
      { $e[0].deleteRange({startLine, startColumn, endLine, endColumn}) }
  }
  
  it('deleteRange some characters within a line', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(1,1,1,3))
      .should(beString('ABCD\nEH\nIJKL'))
  })
  it('deleteRange some characters spanning 2 lines', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(1,3,2,1))
      .should(beString('ABCD\nEFGJKL'))
  })
  it('deleteRange a single line break', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(0,4,1,0))
      .should(beString('ABCDEFGH\nIJKL'))
  })
  it('deleteRange an empty range', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(1,2,1,2))
      .should(beString('ABCD\nEFGH\nIJKL'))
  })
  it('deleteRange a backwards range', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(2,1,1,3))
      .should(beString('ABCD\nEFGJKL'))
  })
  it('deleteRange a range extending beyond the end of a line', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(1,2,1,8))
      .should(beString('ABCD\nEF\nIJKL'))
  })
  it('deleteRange a range starting and extending beyond the end of a line', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(1,6,1,8))
      .should(beString('ABCD\nEFGH\nIJKL'))
  })
  it('deleteRange a range extending beyond the end of the document', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(2,2,3,8))
      .should(beString('ABCD\nEFGH\nIJ'))
  })
  it('deleteRange a range starting and extending beyond the end of the document', () => {
    cy.visit('/test.html')
    init('ABCD\nEFGH\nIJKL', {cols: 5})
      .then(deleteRange(3,2,4,8))
      .should(beString('ABCD\nEFGH\nIJKL'))
  })

 
  it('set contents with setText', () => {
    cy.visit('/test.html')
    init('A\nB\nCCC', {cols: 5})
      .should(beString('A\nB\nCCC'))
  })
  it('type some characters into an empty document', () => {
    cy.visit('/test.html')
    init('', {cols: 5})
      .type('AA')
      .should(beString('AA'))
  })
  it('type character into middle of line', () => {
    cy.visit('/test.html')
    init('', {cols: 5})
      .type('AAAA')
      .then(moveTo(0,2))
      .type('B')
      .should(beString('AABAA'))
  })
  it('type some characters at the end of a line', () => {
    cy.visit('/test.html')
    init('AA', {cols: 5})
      .then(moveTo(0,2))
      .type('BB')
      .should(beString('AABB'))
  })
  it('type a line break at the end of a line', () => {
    cy.visit('/test.html')
    init('AA', {cols: 5})
      .then(moveTo(0,2))
      .type('{enter}')
      .should(beString('AA\n'))
  })
  it('type a line break in the middle of a line', () => {
    cy.visit('/test.html')
    init('AABB', {cols: 5})
      .then(moveTo(0,2))
      .type('{enter}')
      .should(beString('AA\nBB'))
  })
  it('backspace a trailing character', () => {
    cy.visit('/test.html')
    init('AA', {cols: 5})
      .then(moveTo(0,2))
      .type('{backspace}')
      .should(beString('A'))
  })
  it('backspace a trailing line break', () => {
    cy.visit('/test.html')
    init('AA\n', {cols: 5})
      .then(moveTo(1,0))
      .type('{backspace}')
      .should(beString('AA'))
  })
  it('backspace a non-trailing character', () => {
    cy.visit('/test.html')
    init('AA\nBB', {cols: 5})
      .then(moveTo(1,1))
      .type('{backspace}')
      .should(beString('AA\nB'))
  })
  it('backspace a non-trailing line break', () => {
    cy.visit('/test.html')
    init('AA\nBB', {cols: 5})
      .then(moveTo(1,0))
      .type('{backspace}')
      .should(beString('AABB'))
  })
  it('insertAt some characters at the end of a line', () => {
    cy.visit('/test.html')
    init('AA\nBB\nCC', {cols: 5})
      .then(insertAt(1,2,'AA'))
      .should(beString('AA\nBBAA\nCC'))
  })
  it('insertAt some characters in the middle of a line', () => {
    cy.visit('/test.html')
    init('AA\nBB\nCC', {cols: 5})
      .then(insertAt(1,1,'AA'))
      .should(beString('AA\nBAAB\nCC'))
  })
  it('insertAt some text containing a line break to the end of a line', () => {
    cy.visit('/test.html')
    init('AA\nBB\nCC', {cols: 5})
      .then(insertAt(1,2,'Q\nQ'))
      .should(beString('AA\nBBQ\nQ\nCC'))
  })
  it('insertAt some text containing a line break in the middle of a line', () => {
    cy.visit('/test.html')
    init('AA\nBB\nCC', {cols: 5})
      .then(insertAt(1,1,'Q\nQ'))
      .should(beString('AA\nBQ\nQB\nCC'))
  })
  
  //it('tab key inserts spaces with expandtab=true', () => {
  //  cy.visit('/test.html')
  //  init('', {cols: 5, expandTab: true, tabWidth: 2})
  //    .type('\t')
  //    .should(beString('  '))
  //})
  //it('tab key inserts ascii tab with expandtab=false', () => {
  //  cy.visit('/test.html')
  //  init('', {cols: 5, expandTab: false})
  //    .type('\t')
  //    .should(beString('\t'))
  //})
  //it('tab key inserts 3 spaces with expandtab=true tabwidth=3', () => {
  //  cy.visit('/test.html')
  //  init('', {cols: 5, expandTab: true, tabWidth: 3})
  //    .type('\t')
  //    .should(beString('   '))
  //})
  //it('consecutive tabs with expandTab=false', () => {
  //  cy.visit('/test.html')
  //  init('', {cols: 5, expandTab: false})
  //    .type('\t\t')
  //    .should(beString('\t\t'))
  //})
  //it('consecutive tabs with expandTab=true', () => {
  //  cy.visit('/test.html')
  //  init('', {cols: 5, expandTab: true, tabWidth: 2})
  //    .type('\t\t')
  //    .should(beString('    '))
  //})
  //it('expandTab inserts only enough spaces to reach next tab stop', () => {
  //  cy.visit('/test.html')
  //  init('A', {cols: 5, expandTab: true, tabWidth: 4})
  //    .type('\t')
  //    .should(beString('A   '))
  //})
  
  
})
