
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