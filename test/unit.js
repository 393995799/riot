
module.exports = function(test, assert) {

  var $, tag, el

  // conditionals
  tag = test(`
    <test>
      <b>$</b>
      <script>
        this.ok = '</p><p>'
      </script>
    </test>

  `)

  console.info(tag.root.innerHTML)


}