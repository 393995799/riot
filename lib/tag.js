
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
