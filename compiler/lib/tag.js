
const functions = require('./func'),
  dom = require('./dom')


module.exports = function(tag_name, root, extra, opts) {

  const script = extra.script,
    func = functions(opts),
    style = extra.style,
    loop_args = [],
    fn_index = {},
    fns = []


  function pushFn(expr) {
    if (!expr || !expr.includes('{') || !expr.includes('}')) return

    var fn = func.make(expr, loop_args),
      i = fn_index[fn]

    if (i === undefined) {
      fns.push(fn);
      i = fn_index[fn] = (fns.length - 1)
    }
    return i
  }

  function hasEventHandlerArgs(expr, attr_name) {
    return isExpr(expr) && expr.includes('(') && attr_name.slice(0, 2).toLowerCase() == 'on'
  }

  function setAttributes(arr) {
    arr && arr.forEach(function(attr) {
      var expr = attr.value

      if (hasEventHandlerArgs(expr, attr.name)) {
        fns.push(func.eventHandler(expr, loop_args))
        attr.value = '$' + (fns.length - 1)

      } else {
        var i = pushFn(expr)
        if (i >= 0) attr.value = '$' + i
      }
    })
  }


  // { thread, i in threads.slice(1) } -> thread, i
  function getLoopArgs(el) {
    const str = el.tagName && el.getAttribute('each')
    if (isExpr(str)) {
      const els = str.slice(1, -1).trim().split(/\s+in\s+/)

      el.setAttribute('each', '$' + pushFn('{ ' + els[1] + ' }'))
      var vars = els[0]
      if (!vars.includes(',')) vars += ', i'
      return vars
    }
  }

  function makeHTML() {

    dom.walk(root, function(el, level) {

      // each attribute
      const each_args = getLoopArgs(el)

      if (each_args) {
        loop_args[level] = each_args
        loop_args.splice(level + 1, loop_args.length)
      } else {
        loop_args.splice(level, loop_args.length)
      }

      // other attributes
      setAttributes(el.attributes)

      var text = el.nodeValue && el.nodeValue.trim()

      const i = pushFn(text)
      if (i >= 0) el.nodeValue = '$' + i
      else if (text && text.includes("'")) {
        el.nodeValue = text.replace(/'/g, "\\'")
      }

    })

    return dom.html(root)
  }

  this.generate = function(debug) {
    const html = makeHTML().replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim()

    if (debug) return {
      name: tag_name,
      script: script,
      style: style,
      html: html,
      fns: fns,
    }

    // this looks ugly, sorry
    var js = `riot.tag('${tag_name}', '${html}', \n[${fns.join(',\n')}], ` +
      (script ? `\n\nfunction(self, opts) {\n${script}\n}\n` : "''")

    if (style) js += ",'" + style.trim() + "'"
    return js += ');'
  }

}


function isExpr(str) {
  return str && str[0] == '{' && str.endsWith('}')
}

