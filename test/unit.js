
module.exports = function(test, assert) {

  var $, tag, el

  // conditionals
  tag = test(`
    <test>
      <div>{ !opts.kamaa }</div>
      <script>
        this.kama = 'joo'
        this.foo = null
      </script>
    </test>

  `)

  console.info(tag.root.innerHTML)


}