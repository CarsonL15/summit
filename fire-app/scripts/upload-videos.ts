/**
 * Upload Exercise Videos to Supabase Storage
 *
 * Usage:
 *   npx tsx scripts/upload-videos.ts <folder-path>
 *
 * Example:
 *   npx tsx scripts/upload-videos.ts ~/Desktop/exercise-videos
 *
 * File naming convention:
 *   The script matches video filenames to exercise names in the database.
 *   It uses fuzzy matching, so filenames don't need to be exact.
 *
 *   Examples:
 *     "dead-bug.mp4"          → matches "Dead Bug"
 *     "Dead Bug.mp4"          → matches "Dead Bug"
 *     "banded_pull_aparts.mp4"→ matches "Banded Pull-Aparts"
 *     "cat cow stretch.mov"   → matches "Cat-Cow Stretch"
 *
 *   Supported formats: .mp4, .mov, .webm
 *
 * What it does:
 *   1. Reads all video files from the folder
 *   2. Matches each filename to an exercise in the database
 *   3. Uploads to Supabase Storage (exercise-videos bucket)
 *   4. Updates the exercise's video_url in the database
 *   5. Prints a summary of matched/unmatched files
 *
 * Options:
 *   --dry-run    Show what would be uploaded without actually uploading
 *   --overwrite  Re-upload even if exercise already has a video_url
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aejbzpyayfrdsvzetmjh.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const BUCKET = 'exercise-videos'
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']
const CACHE_CONTROL = '31536000' // 1 year — videos rarely change

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.9

  // Word overlap score
  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const intersection = Array.from(wordsA).filter(w => wordsB.has(w))
  const union = new Set(Array.from(wordsA).concat(Array.from(wordsB)))
  return intersection.length / union.size
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const overwrite = args.includes('--overwrite')
  const folderPath = args.find(a => !a.startsWith('--'))

  if (!folderPath) {
    console.error('Usage: npx tsx scripts/upload-videos.ts <folder-path> [--dry-run] [--overwrite]')
    process.exit(1)
  }

  const resolvedPath = path.resolve(folderPath)
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Folder not found: ${resolvedPath}`)
    process.exit(1)
  }

  // Use service role key if available (bypasses RLS), otherwise anon key
  const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
  if (!key) {
    console.error('Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.log('⚠️  No SUPABASE_SERVICE_ROLE_KEY found — using anon key.')
    console.log('   If uploads fail due to permissions, set SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
  }

  const supabase = createClient(SUPABASE_URL, key)

  // Get all exercises from DB
  const { data: exercises, error: exerciseError } = await supabase
    .from('exercises')
    .select('id, name, video_url')
    .order('name') as { data: any[] | null; error: any }

  if (exerciseError || !exercises) {
    console.error('Failed to fetch exercises:', exerciseError)
    process.exit(1)
  }

  console.log(`📋 Found ${exercises.length} exercises in database`)

  // Get video files from folder
  const files = fs.readdirSync(resolvedPath).filter(f => {
    const ext = path.extname(f).toLowerCase()
    return VIDEO_EXTENSIONS.includes(ext)
  })

  console.log(`📁 Found ${files.length} video files in ${resolvedPath}\n`)

  if (files.length === 0) {
    console.log('No video files found. Supported formats: .mp4, .mov, .webm')
    process.exit(0)
  }

  const matched: { file: string; exercise: { id: string; name: string; video_url?: string | null }; score: number }[] = []
  const unmatched: string[] = []
  const skipped: string[] = []

  for (const file of files) {
    const baseName = path.basename(file, path.extname(file))

    // Find best matching exercise
    let bestMatch: { id: string; name: string; video_url?: string | null } | null = null
    let bestScore = 0

    for (const exercise of exercises) {
      const score = similarity(baseName, exercise.name)
      if (score > bestScore) {
        bestScore = score
        bestMatch = exercise
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      // Skip if exercise already has a non-YouTube video and not overwriting
      if (!overwrite && bestMatch.video_url && !bestMatch.video_url.includes('youtu')) {
        skipped.push(`${file} → ${bestMatch.name} (already has video)`)
        continue
      }
      matched.push({ file, exercise: bestMatch, score: bestScore })
    } else {
      unmatched.push(file)
    }
  }

  // Print summary
  console.log('=== MATCH RESULTS ===\n')

  if (matched.length > 0) {
    console.log(`✅ Matched (${matched.length}):`)
    for (const m of matched) {
      const confidence = m.score >= 0.9 ? '🟢' : m.score >= 0.7 ? '🟡' : '🟠'
      console.log(`  ${confidence} ${m.file} → ${m.exercise.name} (${Math.round(m.score * 100)}%)`)
    }
    console.log()
  }

  if (skipped.length > 0) {
    console.log(`⏭️  Skipped (${skipped.length}):`)
    for (const s of skipped) {
      console.log(`  ${s}`)
    }
    console.log()
  }

  if (unmatched.length > 0) {
    console.log(`❌ Unmatched (${unmatched.length}):`)
    for (const u of unmatched) {
      console.log(`  ${u}`)
    }
    console.log('  Tip: Rename files to match exercise names more closely')
    console.log()
  }

  if (dryRun) {
    console.log('🔍 Dry run — no files uploaded. Remove --dry-run to upload.')
    return
  }

  if (matched.length === 0) {
    console.log('No files to upload.')
    return
  }

  // Upload matched files
  console.log(`\n🚀 Uploading ${matched.length} videos...\n`)

  let uploaded = 0
  let failed = 0

  for (const m of matched) {
    const filePath = path.join(resolvedPath, m.file)
    const ext = path.extname(m.file).toLowerCase()
    const storagePath = `${m.exercise.id}${ext}`
    const fileBuffer = fs.readFileSync(filePath)
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(1)

    const mimeType = ext === '.mov' ? 'video/quicktime'
      : ext === '.webm' ? 'video/webm'
      : 'video/mp4'

    process.stdout.write(`  Uploading ${m.file} (${fileSizeMB} MB)...`)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: CACHE_CONTROL,
        upsert: true
      })

    if (uploadError) {
      console.log(` ❌ ${uploadError.message}`)
      failed++
      continue
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    // Update exercise in database
    const { error: updateError } = await supabase
      .from('exercises')
      .update({ video_url: urlData.publicUrl })
      .eq('id', m.exercise.id)

    if (updateError) {
      console.log(` ❌ Uploaded but DB update failed: ${updateError.message}`)
      failed++
      continue
    }

    console.log(` ✅`)
    uploaded++
  }

  console.log(`\n📊 Done! ${uploaded} uploaded, ${failed} failed, ${skipped.length} skipped`)
}

main().catch(console.error)
