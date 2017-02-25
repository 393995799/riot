
module.exports = function(test, assert) {

  var $, tag, el

  // conditionals
  tag = test(`
    <test>
      <div>{{ foo }} b</div>
      <script>
      this.foo = '<b>bar</b>'
      </script>
    </test>

  `)

  console.info(tag.root.innerHTML)


}