import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

const dfirContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/methodologies/dfir.json'), 'utf8'))

test('DFIR categories cover full NIST SP 800-86 scope', () => {
  const processCats = dfirContent.categories.filter(c => c.group === 'Process').map(c => c.title)
  assert.ok(processCats.includes('Forensic Readiness'), 'Missing Forensic Readiness category')
  assert.ok(processCats.includes('Collection'), 'Missing Collection category')
  assert.ok(processCats.includes('Examination'), 'Missing Examination category')
  assert.ok(processCats.includes('Analysis'), 'Missing Analysis category')
  assert.ok(processCats.includes('Reporting'), 'Missing Reporting category')

  const evidenceCats = dfirContent.categories.filter(c => c.group === 'Evidence Sources').map(c => c.title)
  assert.ok(evidenceCats.includes('Files and filesystems'), 'Missing Files and filesystems')
  assert.ok(evidenceCats.includes('Operating systems and volatile data'), 'Missing Operating systems')
  assert.ok(evidenceCats.includes('Network traffic'), 'Missing Network traffic')
  assert.ok(evidenceCats.includes('Applications and logs'), 'Missing Applications and logs')
  assert.ok(evidenceCats.includes('Malware triage'), 'Missing Malware triage')
})

test('DFIR nodes contain required NIST concepts and safety constraints', () => {
  const allText = JSON.stringify(dfirContent).toLowerCase()
  
  // Specific nodes/concepts
  assert.ok(allText.includes('acquisition plan'), 'Missing acquisition plan')
  assert.ok(allText.includes('likely value') && allText.includes('volatility') && allText.includes('amount of effort'), 'Missing NIST acquisition-priority factors')
  assert.ok(allText.includes('master copy') || allText.includes('working copy'), 'Missing master/working copy separation')
  assert.ok(allText.includes('alternative hypothesis') || allText.includes('alternative hypotheses') || allText.includes('competing hypotheses'), 'Missing alternative hypotheses')
  assert.ok(allText.includes('inconclusive'), 'Missing inconclusive analysis permission')
  assert.ok(allText.includes('audience') && allText.includes('limitation'), 'Missing audience/limitations reporting')
  assert.ok(allText.includes('application architecture') && allText.includes('application components'), 'Missing application evidence-source workflow')
  
  // Safety constraints check
  assert.ok(!allText.includes('automatic admissibility'), 'Must not claim automatic admissibility')
  assert.ok(!allText.includes('primary md5'), 'MD5 must not be primary digest')
  assert.ok(!allText.includes('render findings legally inadmissible'), 'Must not promise a legal admissibility outcome')
  assert.ok(!allText.includes('proves adversary intent'), 'Artifacts must not be represented as proof of intent')
  assert.ok(!allText.includes('indisputable forensic proof'), 'Single artifacts must not be represented as indisputable proof')
  assert.ok(!allText.includes('establish physical and logical isolation (disconnect'), 'Containment must be a conditional risk decision')
  assert.ok(!allText.includes('section overview'), 'Source references must use concrete section identifiers')
  
  // Every node should have record, cautions, sourceRefs
  for (const node of dfirContent.nodes) {
    assert.ok(node.record, `Node ${node.id} missing 'record'`)
    assert.ok(node.cautions && node.cautions.length > 0, `Node ${node.id} missing 'cautions'`)
    assert.ok(node.sourceRefs && node.sourceRefs.length > 0, `Node ${node.id} missing 'sourceRefs'`)
    for (const ref of node.sourceRefs.filter(ref => ref.resourceId === 'nist-800-86')) {
      assert.ok(ref.sections.every(section => /^Section [2-8](\.|$)|^Appendix A/.test(section)), `Node ${node.id} has a vague NIST section reference`)
    }
  }
  assert.ok(new Set(dfirContent.nodes.map(node => node.record)).size > 10, 'Record guidance is too generic')
})
