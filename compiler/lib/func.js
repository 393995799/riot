
const RESERVED = 'arguments console document false function instanceof location null self this top true typeof undefined window'.split(' '),
  VAR_NAME = /(^|[\-\+\!\s\(])+([a-z]\w*)\b\s?/g,
  EXPR = /\{([^}]+)\}\}?/g


module.exports = function(opts) {

  var self = {}

  function trimArgs(arr) {
    return arr.filter(function(el) { return !!el }).join(', ')
  }

  function setThis(expr, args) {
     args = args ? args.split(/\s*,\s*/) : []

    return expr.replace(VAR_NAME, function(match, beg, key) {
      if (RESERVED.includes(key) || args.concat(opts.globals).includes(key)) return match
      return beg + 'this.' + key.trimLeft()
    })
  }

  function objectify(str, args) {
    return '{' + str.split(',').map(function(pair) {
      var els = pair.split(':')
      return els[0] + ':' + setThis(els[1], args)

    }).join(',') + '}'
  }

  // Foo { bar } baz --> ["foo ", this.bar, " baz"]
  function toArray(text, args) {
    return text.split(EXPR).map(function(el, i) {
      if (i % 2) {
        return el[0] == '{' ? `{ _html: ${ setThis(el.slice(1), args) } }` :
          /\w+:/.test(el.trim()) ? objectify(el, args) :
          setThis(el, args)
      }
      return '"' + el.replace(/"/g, '\\"') + '"'

    }).filter(function(el) {
      return el != '""'
    })
    return ret
  }

  self.make = function(expr, loop_args) {
    const args = trimArgs(loop_args),
      arr = toArray(expr, args),
      body = arr.length > 1 ? '[' + arr + ']' : arr[0].trim()

    return `function(${args}){return ${body}}`
  }


  // toggle('active') --> this.toggle('active', e, thread, i)
  self.eventHandler = function(expr, loop_args) {
    const args = trimArgs(loop_args.concat(['e']))
    var body = setThis(expr.slice(1, -1).trim(), args).replace(')', ', ' + args + ')')
    return `function(e) { return function(${args}) { return ${ body } } }`
  }

  return self

}

