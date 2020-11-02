describe('annotations spec', () => {
  const { round } = Math
  const mod = navigator.platform.indexOf('Mac') > -1 ? '{meta}' : '{ctrl}'

  beforeEach(() => {
    cy.visit('/test.html')
  })

  const moveTo = (row, col) => $e => { $e[0].caretPosition = [row, col]; beAt(row, col)($e) }
  const beAt = (row, col) => $e => expect($e[0].caretPosition).to.be.deep.eq([row, col])

  const getAnnotationsCalculated = $e => $e[0].annotations.map(x => 
    [x.startLine, x.startColumn, x.endLine, x.endColumn, x.cls, x.hidden])
  const getAnnotationsApplied = $e => {
    const cW = $e[0].debug.charWidth
    return Array.from($e[0].debug.elements.text.querySelectorAll('.line'))
    .flatMap((ln, i) => Array.from(ln.querySelectorAll('span'))
      .map(span => {
        const line = i
        const startColumn = round(span.offsetLeft / cW)
        const endColumn = round(startColumn + (span.offsetWidth / cW))
        const cls = span.part.toString()
        return [line, startColumn, endColumn, cls]
      }))
  }
  const expectAnnotations = xs => $e => expect(getAnnotationsApplied($e)).to.deep.eq(xs)
  
  const waitFrames = n => $e =>
    n == 0 ? Promise.resolve($e)
           : new Promise((resolve, reject) => 
               requestAnimationFrame(() => resolve(waitFrames(n-1)($e)))
             )

  function init(text='', opts={}) {
    return cy.get('much-text').click().then($e => {
      for(let [k,v] of Object.entries(opts))
        $e[0].setAttribute(k,v)
      $e[0].setText(text)
    }).type('{leftArrow}')
  }

  it('annotate part of a line', () => {
    init('ABCDE')
      .then($e => $e[0].annotate(0, 1, 0, 4, 'red'))
      .then(waitFrames(5))
      .should(expectAnnotations([[0, 1, 4, 'red']]))
  })
  it('annotate over 2 lines', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 1, 1, 4, 'red'))
      .then(waitFrames(5))
      .should(expectAnnotations([[0, 1, 5, 'red'], [1, 0, 4,'red']]))
  })
  it('annotate over 3 lines', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(0, 1, 2, 4, 'red'))
      .then(waitFrames(5))
      .should(expectAnnotations([[0, 1, 5, 'red'], [1, 0, 5, 'red'], [2, 0, 4,'red']]))
  })
  it('annotate 2 overlapping regions on a single line', () => {
    init('ABCDE')
      .then($e => $e[0].annotate(0, 0, 0, 3, 'red'))
      .then($e => $e[0].annotate(0, 2, 0, 5, 'bold'))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 0, 2, 'red'],
        [0, 2, 3, 'red bold'],
        [0, 3, 5, 'bold'],
      ]))
  })
  it('annotate 3 overlapping regions across three lines', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(0, 0, 1, 3, 'red'))
      .then($e => $e[0].annotate(1, 0, 1, 4, 'italic'))
      .then($e => $e[0].annotate(1, 2, 2, 5, 'bold'))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 0, 5, 'red'],
        [1, 0, 2, 'red italic'],
        [1, 2, 3, 'red italic bold'],
        [1, 3, 4, 'italic bold'],
        [1, 4, 5, 'bold'],
        [2, 0, 5, 'bold'],
      ]))
  })

  it('insert a character before an annotation contained within the same line', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .type('B')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 3, 5, 'red'],
      ]))
  })
  it('insert a character inside an annotation contained within the same line', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .should(moveTo(0, 3))
      .type('B')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
      ]))
  })
  it('insert a character inside an annotation starting on a previous line', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(1, 1))
      .type('B')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 5, 'red'],
      ]))
  })
  it('insert a character before an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .type('B')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 3, 6, 'red'],
        [1, 0, 4, 'red'],
      ]))
  })
  it('insert a character inside an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(0, 3))
      .type('B')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 6, 'red'],
        [1, 0, 4, 'red'],
      ]))
  })
  it('insert a line break before an annotation contained within the same line', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [1, 2, 4, 'red'],
      ]))
  })
  it('insert a line break inside an annotation contained within the same line', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .should(moveTo(0, 3))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 3, 'red'],
        [1, 0, 1, 'red'],
      ]))
  })
  it('insert a line break before an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [1, 2, 5, 'red'],
        [2, 0, 4, 'red'],
      ]))
  })
  it('insert a line break inside an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(0, 3))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 3, 'red'],
        [1, 0, 2, 'red'],
        [2, 0, 4, 'red'],
      ]))
  })
  it('insert a line break inside an annotation starting on a previous line', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(1, 2))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 2, 'red'],
        [2, 0, 2, 'red'],
      ]))
  })
  it('insert a line break before an annotation starting on the next line', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(1, 2, 2, 4, 'red'))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [2, 2, 5, 'red'],
        [3, 0, 4, 'red'],
      ]))
  })
  it('insert a line break before an annotation starting after the next line', () => {
    init('AAAAA\nBBBBB\nCCCCC\nDDDDD')
      .then($e => $e[0].annotate(2, 2, 3, 4, 'red'))
      .type('\n')
      .then(waitFrames(5))
      .should(expectAnnotations([
        [3, 2, 5, 'red'],
        [4, 0, 4, 'red'],
      ]))
  })
  it('insert 2 lines of text before an annotation contained within the same line', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .should(moveTo(0, 1))
      .then($e => { $e[0].insert('B\nCC') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [1, 3, 5, 'red'],
      ]))
  })
  it('insert 2 lines of text inside an annotation contained within the same line', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('BB\nC') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 2, 'red'],
      ]))
  })
  it('insert 2 lines of text before an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(0, 1))
      .then($e => { $e[0].insert('BB\nCC') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [1, 3, 6, 'red'],
        [2, 0, 4, 'red'],
      ]))
  })
  it('insert 2 lines of text inside an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('BB\nCC') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 4, 'red'],
        [2, 0, 4, 'red'],
      ]))
  })
  it('insert 2 lines of text inside an annotation starting on a previous line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(1, 3))
      .then($e => { $e[0].insert('BB\nCC') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 5, 'red'],
        [2, 0, 3, 'red'],
      ]))
  })
  it('insert 2 lines of text before an annotation starting on the next line', () => {
    init('AAAAA\nBBBBB\nCCCCC', {wrap: 'off'})
      .then($e => $e[0].annotate(1, 2, 2, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('P\nQQ') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [2, 2, 5, 'red'],
        [3, 0, 4, 'red'],
      ]))
  })
  it('insert 2 lines of text before an annotation starting after the next line', () => {
    init('AAAAA\nBBBBB\nCCCCC\nDDDD', {wrap: 'off'})
      .then($e => $e[0].annotate(2, 2, 3, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('P\nQQ') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [3, 2, 5, 'red'],
        [4, 0, 4, 'red'],
      ]))
  })
  it('insert 3 lines of text before an annotation contained within the same line', () => {
    init('AAAAA', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .should(moveTo(0, 1))
      .then($e => { $e[0].insert('P\nQQQ\nRR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [2, 3, 5, 'red'],
      ]))
  })
  it('insert 3 lines of text inside an annotation contained within the same line', () => {
    init('AAAAA', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('PP\nQQQ\nR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 3, 'red'],
        [2, 0, 2, 'red'],
      ]))
  })
  it('insert 3 lines of text before an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(0, 1))
      .then($e => { $e[0].insert('PP\nQQQ\nRR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [2, 3, 6, 'red'],
        [3, 0, 4, 'red'],
      ]))
  })
  it('insert 3 lines of text inside an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('PP\nQQQ\nRR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 3, 'red'],
        [2, 0, 4, 'red'],
        [3, 0, 4, 'red'],
      ]))
  })
  it('insert 3 lines of text inside an annotation starting on a previous line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .should(moveTo(1, 3))
      .then($e => { $e[0].insert('PP\nQQQ\nRR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 5, 'red'],
        [2, 0, 3, 'red'],
        [3, 0, 3, 'red'],
      ]))
  })
  it('insert 3 lines of text before an annotation starting on the next line', () => {
    init('AAAAA\nBBBBB\nCCCCC', {wrap: 'off'})
      .then($e => $e[0].annotate(1, 2, 2, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('P\nQQ\nRR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [3, 2, 5, 'red'],
        [4, 0, 4, 'red'],
      ]))
  })
  it('insert 3 lines of text before an annotation starting after the next line', () => {
    init('AAAAA\nBBBBB\nCCCCC\nDDDD', {wrap: 'off'})
      .then($e => { $e[0].style.height = '100px' })
      .then(waitFrames(5))
      .then($e => $e[0].annotate(2, 2, 3, 4, 'red'))
      .should(moveTo(0, 3))
      .then($e => { $e[0].insert('P\nQQ\nRR') })
      .then(waitFrames(5))
      .should(expectAnnotations([
        [4, 2, 5, 'red'],
        [5, 0, 4, 'red'],
      ]))
  })

})
