#!/usr/bin/env node
/**
 * Create placeholder subfolders under images/examples/<category>/
 * by uploading a zero-byte ".keep" file to each target prefix.
 *
 * Requirements:
 * - env SUPABASE_URL, SUPABASE_SERVICE_KEY
 * - bucket defaults to 'images'
 *
 * Usage examples:
 *   node scripts/create-examples-folders.mjs
 *   node scripts/create-examples-folders.mjs --count 20 --categories clothing,expression,background,pose,convenient
 *   node scripts/create-examples-folders.mjs --prefix set- --count 30 --bucket images
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment')
  process.exit(1)
}

// Simple arg parsing
const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const idx = args.findIndex(a => a === `--${name}`)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  const pref = args.find(a => a.startsWith(`--${name}=`))
  if (pref) return pref.split('=')[1]
  return fallback
}

const bucket = getArg('bucket', 'images')
const count = parseInt(getArg('count', '20'), 10)
const prefix = getArg('prefix', 'set-')
const categoriesCsv = getArg('categories', 'clothing,expression,background,pose,convenient')
const categories = categoriesCsv.split(',').map(s => s.trim()).filter(Boolean)
const dryRun = args.includes('--dry-run')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function pad2(n) { return String(n).padStart(2, '0') }

async function ensureFolder(category, index) {
  const slug = `${prefix}${pad2(index)}`
  const path = `examples/${category}/${slug}/.keep`
  if (dryRun) {
    console.log(`[dry-run] would create: ${path}`)
    return
  }
  const body = new Blob(['']) // zero-byte placeholder
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    upsert: false,
    cacheControl: '3600',
    contentType: 'text/plain'
  })
  if (error) {
    // Ignore conflict-like errors (object exists)
    const msg = String(error.message || error.error || '')
    if (/already exists|duplicate|conflict/i.test(msg)) {
      console.log(`exists: ${path}`)
      return
    }
    console.warn(`warn: ${path} -> ${msg}`)
    return
  }
  console.log(`created: ${path}`)
}

async function main() {
  console.log(`Bucket: ${bucket}`)
  console.log(`Categories: ${categories.join(', ')}`)
  console.log(`Count per category: ${count}`)
  console.log(dryRun ? '(dry-run mode)' : '')

  for (const category of categories) {
    for (let i = 1; i <= count; i++) {
      await ensureFolder(category, i)
    }
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

