
module.exports = function(test, assert) {

  var $, tag, el

  // conditionals
  tag = test(`
    <test>
      <div>{ 'some boo': ok }</div>
      <script>
        this.ok = 'joo'
      </script>
    </test>

  `)

  console.info(tag.root.innerHTML)


}