
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

