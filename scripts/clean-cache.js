#!/usr/bin/env node
import { rm } from 'fs/promises'
import { spawn } from 'child_process'
import { join } from 'path'

const projectRoot = process.cwd()
const args = process.argv.slice(2)
const verbose = args.includes('--verbose')
const restart = args.includes('--restart')

const cleanupTargets = [
  '.vite',
  join('node_modules', '.vite'),
  'dist',
  'build',
  'temp_index.ts'
]

async function removePath(pathName) {
  try {
    await rm(join(projectRoot, pathName), { recursive: true, force: true })
    if (verbose) {
      console.log(`✅ Removed ${pathName}`)
    }
  } catch (error) {
    if (verbose) {
      console.warn(`⚠️ Unable to remove ${pathName}:`, error?.message || error)
    }
  }
}

async function cleanCaches() {
  if (verbose) {
    console.log('🧹 Purging cached build artifacts and temp files...')
  }
  for (const target of cleanupTargets) {
    await removePath(target)
  }
}

function launchDevServer() {
  if (verbose) {
    console.log('🚀 Restarting Vite dev server with a clean slate...')
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const child = spawn(npmCommand, ['run', 'dev'], {
    stdio: 'inherit',
    env: process.env,
    shell: false
  })

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  process.once('SIGINT', () => forwardSignal('SIGINT'))
  process.once('SIGTERM', () => forwardSignal('SIGTERM'))

  child.on('close', (code) => {
    if (code !== null && code !== undefined) {
      process.exit(code)
    }
  })
}

async function main() {
  await cleanCaches()
  if (restart) {
    launchDevServer()
  }
}

main().catch((error) => {
  console.error('❌ cache clean failed:', error)
  process.exit(1)
})
