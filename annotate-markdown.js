'use strict'

function formatRange(range) {
  return `${range.startLine},${range.startColumn}:${range.endLine},${range.endColumn}`
}
function annotation(startLine, startColumn, endLine, endColumn, cls, hidden=false) {
  return { startLine, startColumn, endLine, endColumn, cls, hidden }
}
function annotate(text, region) {
  let curChar = 0
  let curLine = 0
  let curCol  = 0
  if(region) {
    curChar = region.startOffset - region.startColumn // Always start at beginning of line
    curLine = region.startLine
    curCol  = 0
    //region.endLine += 1 // Always check out the next line in case there's a heading
  } else {
    region = {
      startLine:   0,
      startColumn: 0,
      endLine:     0,
      endColumn:   0,
      endOffset:   text.length,
    }
  }
  let startBold      = null
  let startItalic    = null
  let startH1        = null
  let startTag       = null
  let startCode      = null
  let onlySeenEquals = false
  let lastLineLength = 0
  const ranges       = []
  while(curChar < text.length) {
    switch(text[curChar]) {
    case '*':
      if(curChar+1 < text.length && text[curChar+1] == '*') {
        if(startBold == null) {
          startBold = [curLine, curCol]
          curChar++
          curCol++
        } else {
          curCol++
          ranges.push(annotation(startBold[0], startBold[1], curLine, curCol, 'bold'))
          curChar++
          startBold = null
        }
      } else {
        if(startItalic == null) {
          startItalic = [curLine, curCol]
          curChar++
          curCol++
        } else {
          curCol++
          ranges.push(annotation(startItalic[0], startItalic[1], curLine, curCol, 'italic'))
          curChar++
          startItalic = null
        }
      }
      curCol++
      curChar++
      break
    case '`':
      if(startCode == null) {
        startCode = [curLine, curCol]
        curChar++
        curCol++
      } else {
        curCol++
        ranges.push(annotation(startCode[0], startCode[1], curLine, curCol, 'code'))
        curChar++
        startCode = null
      }
      //curCol++
      //curChar++
      break
    case '<':
      if(startTag != null) 
        ranges.push(annotation(startTag[0], startTag[1], curLine, curCol, 'html-tag', true))
      startTag = [curLine, curCol]
      curCol++
      curChar++
      break
    case '>':
      curCol++
      if(startTag != null) {
        ranges.push(annotation(startTag[0], startTag[1], curLine, curCol, 'html-tag'))
        startTag = null
      }
      curChar++
      break
    case '#':
      if(curCol == 0) {
        startH1 = [curLine, 0]
      }
      curCol++
      curChar++
      break    
    case '\n':
      if(startH1 != null) {
        ranges.push(annotation(startH1[0], startH1[1], curLine, curCol, 'heading-1'))
        startH1 = null
      }
      if(onlySeenEquals) {
        ranges.push(annotation(Math.max(0,curLine-1), 0, curLine, curCol, 'heading-1'))
      }
      curCol = 0
      onlySeenEquals = false
      curLine++
      curChar++
      break
    case '=':
      if(curCol == 0) 
        onlySeenEquals = true
      curCol++
      curChar++
      break
    default:
      if(onlySeenEquals) {
        onlySeenEquals = false
        ranges.push(annotation(curLine, 0, curLine, curCol, 'heading-1', true))
      }
      curCol++
      curChar++
    }
    if(curChar > region.endOffset &&
       curLine > region.endLine && // Always scan an extra line, in case of headings
       startBold      == null &&
       startItalic    == null &&
       startH1        == null &&
       startTag       == null &&
       startCode      == null &&
       onlySeenEquals == false
      ) {
      const actualRange = {
        startLine:   region.startLine,
        startColumn: region.startColumn,
        endLine:     curLine,
        endColumn:   curCol,
      }
      const expandedRange = eInput.findExtendedRange(actualRange)
      if(DEBUG) console.log(`[annotator] nominal range has overflowed to ${formatRange(actualRange)}`)
      if(expandedRange.endOffset > curChar) {
        if(DEBUG) console.log(`[annotator] expanding range to ${formatRange(expandedRange)}`)
        region.endLine   = expandedRange.endLine
        region.endColumn = expandedRange.endColumn
        region.endOffset = expandedRange.endOffset
      } else { 
        if(DEBUG) console.log(`[annotator] overflow requires no further expansion`)
        break
      }
    }
  }
  if(startBold != null) 
    ranges.push(annotation(startBold[0], startBold[1], curLine, curCol, 'bold', true))
  if(startTag != null) 
    ranges.push(annotation(startTag[0], startTag[1], curLine, curCol, 'html-tag', true))
  if(startItalic != null) 
    ranges.push(annotation(startItalic[0], startItalic[1], curLine, curCol, 'italic', true))
  if(startCode != null) 
    ranges.push(annotation(startCode[0], startCode[1], curLine, curCol, 'code', true))
  if(onlySeenEquals) 
    ranges.push(annotation(curLine, 0, curLine, curCol, 'heading-1', true))
  region.endLine = curLine
  region.endColumn = curCol
  return { region, ranges }
}

