import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('entry point uses only deployable local static assets', () => {
  const html = read('index.html')
  assert.match(html, /href="assets\/styles\.css"/)
  assert.match(html, /type="module" src="js\/app\.js"/)
  assert.doesNotMatch(html, /\.tsx?|node_modules|\/src\//)
  for (const file of ['assets/styles.css', 'assets/icons.svg', 'assets/favicon.svg', 'js/app.js', 'data/manifest.json', '.nojekyll']) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`)
  }
})

test('manifest entries resolve relative to the manifest directory', () => {
  const manifest = JSON.parse(read('data/manifest.json'))
  for (const file of [...manifest.methodologies, ...manifest.tools, ...manifest.resources]) {
    assert.ok(!file.startsWith('data/'), `${file} incorrectly repeats the data directory`)
    assert.ok(fs.existsSync(path.join(root, 'data', file)), `Missing manifest target data/${file}`)
  }
})

test('GitHub Pages workflow validates and deploys without a build', () => {
  const workflow = read('.github/workflows/pages.yml')
  assert.match(workflow, /actions\/deploy-pages/)
  assert.match(workflow, /node --test tests\/\*\.test\.js/)
  assert.match(workflow, /node scripts\/validate-content\.js/)
  assert.doesNotMatch(workflow, /npm (run )?build|vite|dist/)
})

test('Vercel configuration serves the repository as a static site', () => {
  const config = JSON.parse(read('vercel.json'))
  assert.equal(config.cleanUrls, true)
  assert.equal(config.trailingSlash, false)
})
