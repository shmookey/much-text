describe('annotations spec', () => {
  const { round } = Math
  const mod = navigator.platform.indexOf('Mac') > -1 ? '{meta}' : '{ctrl}'

  beforeEach(() => {
    cy.visit('/test.html')
  })

  const moveTo = (row, col) => $e => { $e[0].caretPosition = [row, col]; beAt(row, col)($e) }
  const beAt = (row, col) => $e => expect($e[0].caretPosition).to.be.deep.eq([row, col])

  const getAnnotationsCalculated = $e => $e[0].ranges.map(x => 
    [x.startLine, x.startColumn, x.endLine, x.endColumn, x.cls, x.hidden == true])
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
  const expectInternalAnnotations = xs => $e =>
    expect(getAnnotationsCalculated($e)).to.deep.eq(xs)
  const expandAnnotArray = ([startLine, startColumn, endLine, endColumn, cls, hidden]) =>
    ({startLine, startColumn, endLine, endColumn, cls, hidden})
  
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
  it('clear all annotations', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 1, 0, 4, 'red'))
      .then(waitFrames(5))
      .then($e => $e[0].clearAnnotations())
      .then(waitFrames(5))
      .should(expectAnnotations([]))
  })
  it('annotate 2 lines', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 1, 0, 4, 'bold'))
      .then($e => $e[0].annotate(1, 1, 1, 4, 'red'))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 1, 4, 'bold'],
        [1, 1, 4, 'red']
      ]))
      .should(expectInternalAnnotations([
        [0, 1, 0, 4, 'bold', false],
        [1, 1, 1, 4, 'red', false],
      ]))
  })
  it('annotate a range preceding an existing annotated range', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(1, 1, 1, 4, 'red'))
      .then($e => $e[0].annotate(0, 1, 0, 4, 'bold'))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 1, 4, 'bold'],
        [1, 1, 4, 'red']
      ]))
      .should(expectInternalAnnotations([
        [0, 1, 0, 4, 'bold', false],
        [1, 1, 1, 4, 'red', false],
      ]))
  })
  it('annotate part of a line followed by two overlapping ranges on the next two lines', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .then($e => $e[0].annotate(1, 2, 2, 4, 'bold'))
      .then($e => $e[0].annotate(2, 2, 2, 5, 'italic'))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 2, 'red'],
        [1, 2, 4, 'red bold'],
        [1, 4, 5, 'bold'],
        [2, 0, 2, 'bold'],
        [2, 2, 4, 'bold italic'],
        [2, 4, 5, 'italic'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 1, 4, 'red', false],
        [1, 2, 2, 4, 'bold', false],
        [2, 2, 2, 5, 'italic', false],
      ]))
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


  it('replace an annotation contained within a region with nothing', () => {
    init('AAAAA')
      .then($e => $e[0].annotate(0, 1, 0, 4, 'red'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:0,startColumn:0,endLine:0,endColumn:5}, []))
      .then(waitFrames(5))
      .should(expectAnnotations([]))
      .should(expectInternalAnnotations([]))
  })
  it('replace an annotation starting within a region with nothing', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 1, 1, 4, 'red'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:0,startColumn:0,endLine:1,endColumn:5}, []))
      .then(waitFrames(5))
      .should(expectAnnotations([]))
      .should(expectInternalAnnotations([]))
  })
  it('replace a region containing only the tail of an annotation with nothing', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 1, 1, 4, 'red'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:1,startColumn:0,endLine:1,endColumn:5}, []))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 1, 5, 'red'],
        [1, 0, 4, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 1, 1, 4, 'red', false],
      ]))
  })
  it('replace 2 single-line annotations on 2 lines with a 2-line annotation', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 1, 0, 4, 'red'))
      .then($e => $e[0].annotate(1, 1, 1, 4, 'red'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:0,startColumn:0,endLine:1,endColumn:5}, [
         {startLine: 0, startColumn: 2, endLine: 1, endColumn: 1, cls: 'bold', hidden: false},
       ]))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'bold'],
        [1, 0, 1, 'bold'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 1, 1, 'bold', false],
      ]))
  })
  it('replace a 2-line annotations with 2 single-line annotations', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 1, 1, 4, 'red'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:0,startColumn:0,endLine:1,endColumn:5}, [
         {startLine: 0, startColumn: 2, endLine: 0, endColumn: 3, cls: 'bold', hidden: false},
         {startLine: 1, startColumn: 3, endLine: 1, endColumn: 4, cls: 'bold', hidden: false},
       ]))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 3, 'bold'],
        [1, 3, 4, 'bold'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 0, 3, 'bold', false],
        [1, 3, 1, 4, 'bold', false],
      ]))
  })
  it('replace 3 overlapping annotations with 3 different overlapping annotations', () => {
    init('AAAAA\nBBBBB')
      .then($e => $e[0].annotate(0, 2, 0, 5, 'red'))
      .then($e => $e[0].annotate(0, 3, 1, 3, 'bold'))
      .then($e => $e[0].annotate(0, 4, 1, 4, 'italic'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:0,startColumn:0,endLine:1,endColumn:5}, [
         {startLine: 0, startColumn: 1, endLine: 1, endColumn: 4, cls: 'italic', hidden: false},
         {startLine: 0, startColumn: 2, endLine: 1, endColumn: 1, cls: 'red', hidden: false},
         {startLine: 0, startColumn: 3, endLine: 0, endColumn: 4, cls: 'bold', hidden: false},
       ]))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 1, 2, 'italic'],
        [0, 2, 3, 'italic red'],
        [0, 3, 4, 'italic red bold'],
        [0, 4, 5, 'italic red'],
        [1, 0, 1, 'italic red'],
        [1, 1, 4, 'italic'],
      ]))
      .should(expectInternalAnnotations([
        [0, 1, 1, 4, 'italic', false],
        [0, 2, 1, 1, 'red', false],
        [0, 3, 0, 4, 'bold', false],
      ]))
  })
  it('replace annotations in a region wth an annotation tail and overlapping annotation starts', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(0, 2, 1, 4, 'red'))
      .then($e => $e[0].annotate(1, 2, 2, 4, 'bold'))
      .then($e => $e[0].annotate(2, 2, 2, 5, 'italic'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations({startLine:1,startColumn:0,endLine:1,endColumn:5}, [
         {startLine: 1, startColumn: 3, endLine: 1, endColumn: 5, cls: 'bold', hidden: false},
       ]))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 3, 'red'],
        [1, 3, 4, 'red bold'],
        [1, 4, 5, 'bold'],
        [2, 2, 5, 'italic'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 1, 4, 'red', false],
        [1, 3, 1, 5, 'bold', false],
        [2, 2, 2, 5, 'italic', false],
      ]))
  })
  it('replace annotations on first of two lines containing annotations', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .then($e => $e[0].annotate(1, 2, 1, 4, 'bold'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations(
         {startLine: 0, startColumn: 0, endLine: 0, endColumn: 5}, 
         [
           {startLine: 0, startColumn: 3, endLine: 0, endColumn: 5, cls: 'red', hidden: false},
         ]
      ))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 3, 5, 'red'],
        [1, 2, 4, 'bold'],
      ]))
      .should(expectInternalAnnotations([
        [0, 3, 0, 5, 'red', false],
        [1, 2, 1, 4, 'bold', false],
      ]))
  })
  it('replace annotations on second of two lines containing annotations', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then($e => $e[0].annotate(0, 2, 0, 4, 'red'))
      .then($e => $e[0].annotate(1, 2, 1, 4, 'bold'))
      .then(waitFrames(5))
      .then($e => $e[0].replaceAnnotations(
         {startLine: 1, startColumn: 0, endLine: 1, endColumn: 5}, 
         [
           {startLine: 1, startColumn: 3, endLine: 1, endColumn: 5, cls: 'bold', hidden: false},
         ]
      ))
      .then(waitFrames(5))
      .should(expectAnnotations([
        [0, 2, 4, 'red'],
        [1, 3, 5, 'bold'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 0, 4, 'red', false],
        [1, 3, 1, 5, 'bold', false],
      ]))
  })

  it('delete a character before an annotation starting and ending on the same line', () => { 
    init('AAAAA')
      .then(async ([e]) => {
        e.annotate(0, 2, 0, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 0, endLine: 0, endColumn: 1})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 1, 3, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 1, 0, 3, 'red', false],
      ]))
  })
  it('delete a character before an annotation starting on the same line', () => {
    init('AAAAA\nBBBBB')
      .then(async ([e]) => {
        e.annotate(0, 2, 1, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 0, endLine: 0, endColumn: 1})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 1, 4, 'red'],
        [1, 0, 4, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 1, 1, 4, 'red', false],
      ]))
  })
  it('delete a character inside an annotation ending on the same line', () => {
    init('AAAAA\nBBBBB')
      .then(async ([e]) => {
        e.annotate(0, 2, 1, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 1, startColumn: 0, endLine: 1, endColumn: 1})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 3, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 1, 3, 'red', false],
      ]))
  })
  it('delete a character inside an annotation not starting or ending on the same line', () => {
    init('AAAAA\nBBBBB\nCCCCC')
      .then(async ([e]) => {
        e.annotate(0, 2, 2, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 1, startColumn: 0, endLine: 1, endColumn: 1})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 2, 5, 'red'],
        [1, 0, 4, 'red'],
        [2, 0, 4, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 2, 4, 'red', false],
      ]))
  })
  it('delete a line break with an annotation contained within the second line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then(async ([e]) => {
        e.annotate(1, 2, 1, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 5, endLine: 1, endColumn: 0})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 7, 9, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 7, 0, 9, 'red', false],
      ]))
  })
  it('delete a line break with an annotation starting on the second line', () => {
    init('AAAAA\nBBBBB\nCCCCC', {wrap: 'off'})
      .then(async ([e]) => {
        e.annotate(1, 2, 2, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 5, endLine: 1, endColumn: 0})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 7, 10, 'red'],
        [1, 0, 4, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 7, 1, 4, 'red', false],
      ]))
  })
  it('delete a line break with an annotation ending on the second line', () => {
    init('AAAAA\nBBBBB', {wrap: 'off'})
      .then(async ([e]) => {
        e.annotate(0, 2, 1, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 5, endLine: 1, endColumn: 0})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 2, 9, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 2, 0, 9, 'red', false],
      ]))
  })
  it('delete a line break with an annotation starting after the following line break', () => {
    init('AAAAA\nBBBBB\nCCCCC', {wrap: 'off'})
      .then(async ([e]) => {
        e.annotate(2, 2, 2, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 5, endLine: 1, endColumn: 0})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [1, 2, 4, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [1, 2, 1, 4, 'red', false],
      ]))
  })
  it('delete text containing an annotation', () => {
    init('AAAAA\nBBBBB\nCCCCC', {wrap: 'off'})
      .then(async ([e]) => {
        e.annotate(0, 2, 1, 3, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 1, endLine: 1, endColumn: 4})
        await waitFrames(5)()
      })
      .should(expectAnnotations([]))
      .should(expectInternalAnnotations([]))
  })
  it('delete text which contains line breaks and is followed by an annotation on the final line', () => {
    init('AAAAA\nBBBBB\nCCCCC', {wrap: 'off'})
      .then(async ([e]) => {
        e.annotate(2, 2, 2, 4, 'red')
        await waitFrames(5)()
        e.deleteRange({startLine: 0, startColumn: 4, endLine: 2, endColumn: 1})
        await waitFrames(5)()
      })
      .should(expectAnnotations([
        [0, 5, 7, 'red'],
      ]))
      .should(expectInternalAnnotations([
        [0, 5, 0, 7, 'red', false],
      ]))
  })
  
  //it('replace an annotation while only changing class', () => { })
})
