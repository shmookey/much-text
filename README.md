much-text - text area for code
==============================

![Build Status](https://github.com/shmookey/much-text/workflows/Build/badge.svg)
This README is intended to be read from the much-text demo page: 

  https://shmookey.github.io/much-text/



#    SUMMARY

<much-text> is a web component for monospaced, multi-line text entry, with
features useful for building text editors for programming languages and markup.
It works as a drop-in replacement for the <textarea> HTML element and is
ethically programmed to be conscientious about performance and memory use.

This page provides an easy way to experiment with much-text's features, which
are configured by HTML attributes. Neither the "dark mode" theme in use here,
nor the markdown-like syntax highlighting are part of much-text itself, see the
STYLING and SYNTAX HIGHLIGHTING sections below for details.

much-text is written in JavaScript using native web platform interfaces, not all
of which are yet widely available even in "evergreen" browsers. It has no
runtime or build dependencies and does not make use of polyfills or any other
bridging tools to provide compatibility with older browsers, therefore it isn't.
It is also a work in progress and some of the details described herein may be
regarded as "aspirational". 

Features:
  - Line numbers
  - Annotations

Limitations:
  - No mobile support
  - No native spellcheck

Use it by saving much-text.js somewhere convenient and include it in your page
using a <script> tag. You can also import it as an ES6 module, or any
other loading mechanism you may already be using. The custom element registers
itself automatically, and the script doesn't export any values.

In many ways <much-text> looks and behaves like <textarea>. It implements
the same attributes and the same DOM interface, emits the same events and takes
on the same styles. *Consult the documentation for <textarea> for basic usage
information.* The ways that much-text extends and occasionally deviates from
this basic functionality is set out in the sections to follow.


#    ATTRIBUTES

much-text generally supports all of the global attributes that it inherits from
the HTMLElement interface. Implementing all standard attributes for <textarea>
is a work in progress. At time of writing, the following standard attributes
are available:

  cols disabled form name readonly required wrap

The following standard attributes are planned but not yet implemented:

  placeholder rows

Support for these standard attributes is not currently planned:

  autocomplete maxlength minlength spellcheck

All attributes are also available in JavaScript as properties of the `MuchText`
DOM interface. Attribute names written in kebab-case are accessed as properties
using camelCase. Properties take the same string values as attributes, with
the exception of numbers and boolean values, which are represented with their
proper types in JavaScript.

The following new attributes are defined:

  line-nums      Show line numbers in the margin.
                 Values: on, off

  line-contrast  Use an alternating dimming effect to make lines clearer. Lines
                 can mean logical lines of text (may be taller if wrapped), or
                 visual 'rows' that are always 1 character tall.
                 Values: lines, rows, off

  show-boundary  Show a line at the boundary specified by the `cols` or `rows`
                 attribute.
                 Values: column, off

  row-navigation Control whether the up and down arrow keys move by one visual
                 "row" or one logical "line". Default: row.
                 Values: row, line
  
  eol-navigation Control whether the left and right arrow keys will wrap the
                 caret onto the previous/next line. Default: wrap.
                 Values: wrap, off

  undo-depth     Maximum number of entries in history buffer.
                 Values: <integer>


#    STYLING

You can style much-text with CSS the same way as a regular <textarea>. All
internal UI elements are made available for styling as CSS Shadow Parts, using
the ::part(name) pseudo-element. The following parts are defined:

  doc            An internal container for the whole element.
  caret          The blinking cursor.
  line           Every (logical) line of text, taller if the line is wrapped.
  margin         Area to the left of the text content, containing line numbers.
  text           Area to the right of the margin, containing user text.
  line-number    Self-described.
  line-selection One line of a text selection.
  active-line    Line where caret is currently located.
  boundary       Column boundary line specified by `cols`.
  mark-{x}       Highlighted span of text with user-supplied class x.


#    WRITING ANNOTATORS

much-text does not implement syntax highlighting directly. Functions to "mark"
ranges of text with a CSS class (technically, a CSS *part*) are available on
the MuchText DOM interface in JavaScript. You can listen for the 'input' event
to trigger updates, and style the resulting output from your existing CSS. If
you mark a range of text with the class 'foo', you can style it using the
pseudo-selector `::part(mark-foo)` on the much-text element.

Markings are based on line and column numbers and are "sticky", meaning that
inserting or deleting characters into marked text will expand or contract the
associated range. *Markings are **allowed* to overlap**, and much-text will
work out the optimal way of representing the overlap with HTML span elements.

The following functions are available:

  annotate(startLine, startColumn, endLine, endColumn, cls)
    Marks a range of text with the class `cls`.

  clearAnnotations(startLine, endLine)
    Clears all markings that *start* in the range spanning from `startLine` to
    `endLine`, inclusive. If either parameter is not given or `null`, the start
    and end of the document are used.

  replaceAnnotations(region, newAnnotations)
    Replace the annotations that start in a given range. The replacements must
    be pre-sorted in annotation order (explained below).


#    DIFFERENCES FROM <textarea>

These are ways in which much-text is deliberately different to the classic
textarea. Any other deviant behaviour is an offence to decency and must be
stamped out - it is, in other words, a bug.

- much-text uses a monospaced font by default and does not support variable-
  width fonts. However, it does not actively prevent you from using one. Do so
  at your own peril. At this stage, much-text is exclusively targeting code
  editors.
 
- The default wrapping mode will break lines at the column they overflow, not
  at the nearest word boundary or hyphen. You can restore the word-boundary
  wrapping behaviour using the `white-space` and `word-break` CSS properties on
  the `::part(line)` pseudo-element.

- A <much-text> element has no intrinsic size, its dimensions are determined
  solely by the styles applied to it. The only effect of the `cols` attribute
  is on wrapping and the placement of the boundary line, if enabled. Setting
  `cols='auto'` in conjunction with line wrapping will cause wrapping to occur
  at the edge of the element, for whatever width it happens to be.


# LICENSE

much-text is free software under the MIT license. See the LICENSE file for
details.

