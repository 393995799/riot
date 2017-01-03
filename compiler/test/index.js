
const compiler = require('..')({ globals: ['$', 'app'], debug: true }),
  compile = compiler.compile,
  assert = require('assert')


// HTML comments
var tag = compile(`
  <!-- foo -->
  <test>
    <!--
      <b>
    -->
    <h3>Baari</h3>
  </test>

`)

assert.equal(tag.html, '<test> <h3>Baari</h3></test>')


// special characters
tag = compile(`
  <test>
    { app.foo }
    <script>
      $(".wrap < *"); $("<a>").click(); 1 < 2 && true
    </script>
  </test>
`)


assert(!tag.fns[0].includes('this'))
assert.equal(tag.script, '$(".wrap < *"); $("<a>").click(); 1 < 2 && true')


// no parser
var tag = compile('<yo>{ title }</yo>')
assert.equal(tag.name, 'yo')
assert.equal(tag.html, '<yo>$0</yo>')
assert.equal(tag.fns[0], 'function(){return this.title}')

// custom parser
function myparser(src) { return src + 'bar' }
tag = compile('<yo><script>foo</script></yo>', { js: myparser })
assert.equal(tag.script, 'foobar')


// sass
tag = compile(`
  <test>
    <style>
      a
        color: red
    </style>
  </test>
`, { css: 'sass' })

assert.equal(tag.style, 'test a{ color: red; }\n')

// style type
tag = compile(`
  <test>
    <style type="sass">
      a
        color: red
    </style>
  </test>
`)

assert.equal(tag.style, 'test a{ color: red; }\n')

// buble
tag = compile(`
  <yo>
    <script>
    add = (a) => a
    </script>
  </yo>`, { js: 'buble' })

assert.equal(tag.script, 'add = function (a) { return a; }')

// script type
tag = compile('<yo><script type="buble">add = (a) => a</script></yo>')
assert.equal(tag.script, 'add = function (a) { return a; }')


// babel
tag = compile(`
  <yo>
    <script>
    var add = (a) => a
    </script>
  </yo>`, { js: '_es6' })
// assert.equal(tag.script, 'add = function (a) { return a; }')



// pug
tag = compile('yo { title }', { html: 'pug' })
assert.equal(tag.html, '<yo>$0</yo>')


// combined
tag = compile(`
  test
    style(scoped).
      a
        color: red

    p { title }

    script.
      add = (a) => a

`, { html: 'pug', js: 'buble', css: 'sass' })


assert.equal(tag.name, 'test')
assert.equal(tag.style, 'test a{ color: red; }\n')
assert.equal(tag.html, '<test><p>$0</p></test>')
assert.equal(tag.script, 'add = function (a) { return a; }')
