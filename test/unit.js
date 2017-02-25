
module.exports = function(test, assert) {

  var $, tag, el

  // conditionals
  tag = test(`
    <test>
      <div>{ instant ? 'bar' : kama + ' zap bar ' + kama }</div>
      <script>
      this.kama = 'joo'
      </script>
    </test>

  `)

  console.info(tag.root.innerHTML)


}