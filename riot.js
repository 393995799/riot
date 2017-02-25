!function() {

/* Container for loops, custom tags and conditionals */

function Block(block_root, tag, args) {

  var _tag = tag.__,
    yields = [],
    loops = [],
    tags = [],
    expr = [],
    ifs = []


  // used on blocks.remove()
  this.root = block_root

  // extract dynamic parts for later execution
  walk(block_root, function(node) {

    var tag_name = getTagName(node),
      attr = attributes(node)


    // if
    var test = getFunction(attr['if'])

    if (test) {
      ifs.push(new IF(node, tag, args, function() {
        return test.apply(tag, args)
      }))
      return false
    }

    // yield
    if (tag_name == 'yield') { yields.push(node); return false }

    // each
    var query = getFunction(attr.each)
    if (query) { loops.push([query, node]); return false }

    // refs
    var ref = attr.name || attr.id
    if (ref && ref[0] != '$') _tag.addRef(ref, node)

    // custom tag
    if (node != tag.root && isCustom(node)) {
      var instance = new Tag(tag_name, node, new UpdatingOpts(node, attr), tag)
      _tag.addChild(ref || tag_name, instance)
      tags.push(instance)
      return false
    }

    // body expression
    var fn = getFunction(node.nodeValue)
    if (fn) {
      pushBodyExpr(node, fn)
    }

    // attribute expressions
    parseAttributes(node, attr)

  })

  // loops must be constructed after walk()
  loops = loops.map(function(arr) {
    return new Loop(arr[0], arr[1], tag, args)
  })

  function addNode(node) {
    tag.parent.__.addBlock(node)
  }

  // yields
  each(yields, function(node) {
    var name = attributes(node).name,
      tmpl = tag.parent.__.tmpl, // on loops
      root = tmpl ? tmpl.cloneNode(true) : tag.parent.root

    if (name) {
      var child = findNode(root, name)
      child.removeAttribute('name')
      insertBefore(node, child)
      addNode(child)

    } else {
      insertNodes(tmpl ? root : root.firstChild.nextSibling, node, addNode)

    }

    removeNode(node)

  })


  this.update = function() {
    each(ifs.concat(tags).concat(loops), function(el) {
      el.update()
    })

    each(expr, function(fn) {
      fn.apply(tag, args)
    })

  }


  /** private **/

  // maps and expression ("$1") to a real function() {}
  function getFunction(str) {
    if (str) {
      str = str.trim()
      var i = 1 * str.slice(1)
      if (str[0] == '$' && i >= 0) return _tag.fns[i]
    }
  }

  function pushBodyExpr(node, fn) {
    expr.push(function() {
      var arr = fn.apply(tag, args),
        val = toValue(arr)

      if (hasHTML(arr)) {
        var parent = node.parent || node.parentNode
        parent.innerHTML = val
        node.parent = parent
      }
      else node.nodeValue = val
    })
  }


  function setEventHandler(node, name, getter) {
    node.removeAttribute(name)

    node.addEventListener(name.slice(2), function(e) {
      var e_args = args ? args.concat([e]) : [e],
        fn = getter.apply(tag, e_args)

      if (fn) {
        var ret = fn.apply(tag, e_args)
        tag.update()
        return ret
      }
    })
  }


  function UpdatingOpts(node, attr) {
    var self = this

    self.update = function() {
      for (var name in attr) {
        var val = attr[name]
        var fn = getFunction(val)
        self[name] = fn ? fn.apply(tag, args) : val
        fn && node.removeAttribute(name)
      }
    }
  }


  function parseAttributes(node, attr) {

    Object.keys(attr).forEach(function(name) {
      var fn = getFunction(attr[name])
      if (!fn) return

      // clear "$n"
      node.setAttribute(name, '')

      if (name.slice(0, 2) == 'on') {
        setEventHandler(node, name, fn)

      // expression
      } else {
        expr.push(function() {
          var val = fn.apply(tag, args),
            el = node.changed || node

          val === false ? el.removeAttribute(name) : el.setAttribute(name, toValue(val))
        })
      }
    })
  }

}
/* utility functions (not related to tags and blocks) */


// allows looping DOM collections
function each(arr, fn) {
  if (arr) {
    for (var i = 0; i < arr.length; i++) {
      if (fn(arr[i], i) === false) i--
    }
  }
}

// returns node attributes as object
function attributes(root) {
  var data = {}
  each(root.attributes, function(attr) {
    data[attr.name] = attr.value
  })
  return data
}

function emptyNode() {
  return document.createTextNode('')
}

function insertBefore(node, new_node) {
  node.parentNode.insertBefore(new_node, node)
  return new_node
}

function removeNode(node) {
  var parent = node.parentNode
  parent && parent.removeChild(node)
}

function findNode(root, name) {
  var ret
  walk(root, function(node) {
    if (node.tagName && node.getAttribute('name') == name) ret = node
    if (ret) return false
  })
  return ret
}

function cleanNode(node) {
  while (node.firstChild) removeNode(node.firstChild)
}

function moveChildren(from, to) {
  while (from.firstChild) to.appendChild(from.firstChild)
  return to
}

function insertNodes(from, to, fn) {
  while (from.firstChild) {
    var child = from.firstChild
    insertBefore(to, child)
    fn(child)
  }
}

function getTagName(node) {
  var name = node.tagName
  return name && name.toLowerCase()
}

function isCustom(node) {
  var name = getTagName(node)
  return name && !!defs[name.toLowerCase()]
}

function extend(obj, from) {
  from && each(Object.keys(from), function(key) {
    obj[key] = from[key]
  })
  return obj
}

function mkdom(html) {
  var el = document.createElement('template')
  el.innerHTML = html.trim()
  return (el.content || el).firstChild
}

// walk trough a DOM tree
function walk(dom, fn) {

  try {
    if (fn(dom) === false) return
  } catch (e) {
    console.error(e, fn, dom)
    return false
  }

  dom = dom.firstChild

  while (dom) {
    if (walk(dom, fn) === false) return
    dom = dom.nextSibling
  }
}


// { foo: true, bar: true } --> "foo bar"
function objToString(obj) {
  var ret = []
  for (var key in obj) {
    var val = obj[key]
    if (val) ret.push(key == '_html' ? val : key)
  }
  return ret.join(' ')
}

function hasHTML(arr) {
  for (var i = 0, el; (el = (arr || [])[i]); i++) {
    if (el._html) return true
  }
}

// ['When', this.country, { fails: fail }] --> 'When Finland fails'
function toValue(val) {
  return Array.isArray(val) ? val.map(toValue).join('') :
    val == null ? '' :
    typeof val == 'object' ? objToString(val) :
    val
}







// makes a root node mountable
function IF(node, tag, args, test) {

  node.removeAttribute('if')
  var mounted

  // invisible marker node
  var stub = insertBefore(node, emptyNode()),
    t = tag.__

  this.update = function() {
    var flag = !!test()
    if (flag !== mounted) flag ? mount() : unmount()
    mounted = flag
  }

  function unmount() {
    t.removeBlock(node)
    removeNode(node)
  }

  function mount() {
    insertBefore(stub, node)
    t.addBlock(node, args)
  }

}
// A mapping of array items and corresponding dom nodes

function Loop(query, node, tag, args) {

  node.removeAttribute('each')
  args = args || []

  var last = node.previousSibling,
    nodes = [],
    items

  if (!last) {
    last = emptyNode()
    node.parentNode.appendChild(last)
  }

  var start = insertBefore(last, emptyNode())

  removeNode(node)

  this.update = function() {
    var arr = query.apply(tag, args)

    // no change
    if (items == arr) return

    if (Array.isArray(arr)) {
      if (items) items.splice(0, items.length)
      each(arr, append)
      items = arrayLoop(arr)

    } else if (arr && !items) {
      objectLoop(arr)
      items = arr
    }

  }

  // for yielding
  if (node.innerHTML && isCustom(node)) {
    tag.__.tmpl = moveChildren(node, document.createElement('div'))
  }

  function addBlock(node, obj, i) {
    tag.__.addBlock(node, args.concat([obj, i]))
  }

  function add(obj, sibling) {
    var el = node.cloneNode(true)
    insertBefore(sibling, el)
    return el
  }

  function append(obj, i) {
    var node = add(obj, last)
    nodes.push(node)
    addBlock(node, obj, i)
  }

  function prepend(obj, i) {
    var node = add(obj, start.nextSibling)
    nodes.unshift(node)
    addBlock(node, obj, i)
  }


  function objectLoop(obj) {
    Object.keys(obj).forEach(function(key) {
      var val = obj[key]
      append(key, val)
    })
  }

  function arrayLoop(items) {

    // push
    var _push = items.push

    items.push = function(obj) {
      _push.call(items, obj)
      append(obj)
      tag.update()
    }

    // unshift
    var _unshift = items.unshift

    items.unshift = function(obj) {
      _unshift.call(items, obj)
      prepend(obj)
      tag.update()
    }

    // splice
    var _splice = items.splice

    items.splice = function(i, len) {
      each(nodes.slice(i, i + len), function(node) {
        tag.__.removeBlock(node)
        removeNode(node)
      })
      nodes.splice(i, len)
      _splice.call(items, i, len)
    }

    // remove() shortcut. commonly used
    items.remove = function(obj) {
      var i = items.indexOf(obj)
      if (i >= 0) return items.splice(i, 1)
      return obj
    }

    items.pop = function() {
      var obj = items.slice(-1)[0]
      return items.remove(obj)
    }

    // sort
    var _sort = items.sort

    items.sort = function(fn) {

      // remove nodes
      each(nodes, removeNode)
      nodes = []

      // insert new ones
      _sort.call(items, fn)
      each(items, append)

      tag.update()
    }

    return items

  }

}


// window.riot
var riot = {},
  all_tags = [],
  defs = {}

function injectCSS(css) {
  var el = document.createElement('style')
  el.innerText = css
  document.documentElement.appendChild(el)
}

// register
riot.tag = function(name, html, fns, impl, css) {
  defs[name] = [html, fns, impl]
  if (css) injectCSS(css)
}

// mount
riot.mount = function(name, to, opts) {
  opts = extend(attributes(to), opts)
  cleanNode(to)

  // TODO; legacy arguments if (name.tagName) throw 'depceciated' + name + to
  var tag = new Tag(name, to, opts)
  all_tags.push(tag)
  return tag.update()
}

// update all
riot.update = function() {
  each(all_tags, function(tag) {
    tag.update()
  })
}

if (typeof window == 'object') {
  window.riot = riot
} else {
  module.exports = riot
}


// Custom tag

function Tag(tag_name, to, opts, parent) {

  // tag found?
  var def = defs[tag_name]
  if (!def) throw 'No such tag ' + tag_name

  var root = this.root = mkdom(def[0]),
    tags = this.tags = {},
    refs = this.refs = {},
    self = this,
    blocks = [],
    impl


  function define(name, value) {
    Object.defineProperty(self, name, {
      get: function() { return value },

      set: function(value) {
        throw 'Cannot set ' + name
      }
    })
    return value
  }

  define('opts', opts)

  define('parent', parent)


  this.blocks = blocks

  // for private use only
  var private = define('__', {

    fns: def[1],

    addBlock: function(node, args) {
      var block = new Block(node, self, args)
      blocks.push(block)
      return block
    },

    removeBlock: function(root) {
      walk(root, function(root) {
        each(blocks, function(block, i) {
          if (block.root == root) blocks.splice(i, 1)
        })
      })
    },

    addChild: function(name, tag, obj) {
      obj = obj || tags

      var els = obj[name]
      if (Array.isArray(els)) els.push(tag)
      else obj[name] = els ? [els, tag] : tag
    },

    addRef: function(name, el) {
      private.addChild(name, el, refs)
    }

  })

  private.addBlock(root, [])


  // unmount
  define('unmount', function() {
    private.removeBlock(root)
    removeNode(root)
  })

  // update
  define('update', function(data) {

    var fn = self.onupdate
    fn && fn()

    if (opts && opts.update) opts.update()

    // run initial script once
    if (!impl) {
      impl = def[2]
      impl && impl.call(self, self, opts)
    }

    if (data) extend(self, data)

    each(blocks, function(block) {
      block.update()
    })

    return self
  })

  // mount
  if (to) {
    moveChildren(root, to)

    // copy attributes
    Object.keys(attributes(root)).forEach(function(name) {
      to.setAttribute(name, root.getAttribute(name))
    })

    root = self.root = root.changed = to

    // onmount
    var fn = self.onmount
    fn && fn()
  }


}
}()
