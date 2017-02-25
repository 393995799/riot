
const tags = [],
  arg = process.argv.slice(-1)[0],
  benchmark = require('./lib/benchmark')(1 * arg),
  test = require('./lib/tag-test')(benchmark, tags),
  assert = require('assert'),
  start = Date.now()


if (false) {
  require('./unit')(test, assert)

} else {
  require('./basics')(test, assert)
  require('./conditionals')(test, assert)
  require('./yield')(test, assert)
  require('./loops')(test, assert)

  console.info(`All tests passed in ${Date.now() - start}ms\n`)
  benchmark.run()
}

if (arg == 'gen') {
  require('fs').writeFileSync('test/browser/tags.js', tags.join('\n\n'))
}

