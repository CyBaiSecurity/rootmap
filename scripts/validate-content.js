#!/usr/bin/env node

/**
 * RootMap Static Content CLI Validator
 * Validates all static JSON data against schema and integrity rules.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  validateManifest,
  validateAndMergeContent,
} from '../js/content.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function main() {
  const manifestPath = path.join(rootDir, 'data', 'manifest.json')
  console.log(`[RootMap Validator] Reading manifest from: ${path.relative(rootDir, manifestPath)}`)

  if (!fs.existsSync(manifestPath)) {
    console.error(`[Error] Manifest file not found at ${manifestPath}`)
    process.exit(1)
  }

  let manifestRaw
  try {
    manifestRaw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    console.error(`[Error] Failed to parse manifest JSON: ${err.message}`)
    process.exit(1)
  }

  let manifest
  try {
    manifest = validateManifest(manifestRaw)
  } catch (err) {
    console.error(`[Error] Manifest validation failed: ${err.message}`)
    process.exit(1)
  }

  function readJsonFile(relPath) {
    const absPath = path.join(path.dirname(manifestPath), relPath)
    if (!fs.existsSync(absPath)) {
      throw new Error(`Referenced file not found: "${relPath}" (resolved to ${absPath})`)
    }
    try {
      return JSON.parse(fs.readFileSync(absPath, 'utf8'))
    } catch (err) {
      throw new Error(`Failed to parse JSON file "${relPath}": ${err.message}`)
    }
  }

  let methodologies, tools, resources
  try {
    methodologies = manifest.methodologies.map(readJsonFile)
    tools = manifest.tools.map(readJsonFile)
    resources = manifest.resources.map(readJsonFile)
  } catch (err) {
    console.error(`[Error] File loading error: ${err.message}`)
    process.exit(1)
  }

  let content
  try {
    content = validateAndMergeContent({
      methodologies,
      tools,
      resources,
    })
  } catch (err) {
    console.error(`[Error] Content validation failed:\n  ${err.message}`)
    process.exit(1)
  }

  const webCategories = content.categories.filter((c) => c.domain === 'web')
  const dfirCategories = content.categories.filter((c) => c.domain === 'dfir')
  const webNodes = content.nodes.filter((n) => n.domain === 'web')
  const dfirNodes = content.nodes.filter((n) => n.domain === 'dfir')
  const totalFindings = content.nodes.reduce((sum, n) => sum + n.findings.length, 0)

  console.log('[RootMap Validator] Validation SUCCESSFUL!')
  console.log('--------------------------------------------------')
  console.log(`Schema Version:       ${content.schemaVersion}`)
  console.log(`Methodology Files:    ${manifest.methodologies.length}`)
  console.log(`Web Categories:       ${webCategories.length}`)
  console.log(`Web Nodes:            ${webNodes.length}`)
  console.log(`DFIR Categories:      ${dfirCategories.length}`)
  console.log(`DFIR Nodes:           ${dfirNodes.length}`)
  console.log(`Total Categories:     ${content.categories.length}`)
  console.log(`Total Nodes:          ${content.nodes.length}`)
  console.log(`Total Findings:       ${totalFindings}`)
  console.log(`Total Tools:          ${content.tools.length}`)
  console.log(`Total Resources:      ${content.resources.length}`)
  console.log('--------------------------------------------------')
  console.log('All IDs, references, parent hierarchies, and HTTPS URLs are valid.')
  process.exit(0)
}

main()
