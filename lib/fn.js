
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






