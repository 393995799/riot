
module.exports = function(test, assert) {

  var $, tag, el

  // conditionals
  tag = test(`
    <test>
      <div>{ 'some boo': ok }</div>
      <b>This goe's hay</b>
      <script>
        this.ok = 'joo'
      </script>
    </test>

  `)

  console.info(tag.root.innerHTML)


}