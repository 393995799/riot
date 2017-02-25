
// libs
const RE_SCRIPT = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gm,
  scopedCSS = require('./lib/scoped-css'),
  parsers = require('./lib/parsers'),
  Tag = require('./lib/tag'),
  dom = require('./lib/dom')


function escape(html) {
  return html.replace(RE_SCRIPT, function(_, a, str, b) {
    return a + str.replace(/</g, '&lt;') + b
  })
}

function unescape(js) {
  return js.replace(/&lt;|&gt;|&amp;/g, function(match) {
    return { '&lt;': '<', '&gt;': '>', '&amp;': '&' }[match]
  })
}

function unindent(src) {
  const indent = src.replace('\n', '').match(/^\s+/)
  return (indent ? src.replace(RegExp('^' + indent[0], 'gm'), '') : src).trim()
}

function getBlocks(tag_name, root, global_parsers, opts) {

  var removables = [],
    script = '',
    style = ''

  function setType(type, value) {
    if (value) {
      opts[type] = value;
    }
  }

  dom.walk(root, function(el, level) {
    if (el.nodeType == 8) removables.push(el)

    if (el.tagName == 'STYLE') {
      setType('css', el.getAttribute('type'))
      style += unindent(dom.html(el))
      removables.push(el)
      return false

    } else if (el.tagName == 'SCRIPT') {
      setType('js', el.getAttribute('type'))
      script += dom.html(el)
      removables.push(el)
      return false
    }
  })

  removables.forEach(function(el) {
    el.parentNode.removeChild(el)
  })

  opts = parsers(global_parsers, opts)
  var css = opts.css ? opts.css(style) : style

  return {
    script: opts.js(unescape(script.trim())),
    style: scopedCSS(tag_name, css)
  }

}


module.exports = function(global_opts) {

  global_opts = global_opts || {}

  var self = {}

  self.compile = function(src, local_opts) {

    const opts = parsers(global_opts.parsers, local_opts),
      html = escape(opts.html(unindent(src)))

    const doc = dom.parse(html.trim())

    var ret = '', index = 0, node

    while (node = doc.childNodes.item(index++)) {
      var tag_name = (node.tagName || '').toLowerCase()

      // script outside tag definitions
      if (tag_name == 'script') {
        ret += unescape(dom.html(node))


      } else if (tag_name) {
        var root = dom.create('div')
        root.appendChild(node)
        const tag = new Tag(tag_name, root, getBlocks(tag_name, root, global_opts.parsers, opts), global_opts)
        if (global_opts.debug) return tag.generate(true)
        ret += tag.generate()
      }
    }

    return ret
  }

  return self

}

