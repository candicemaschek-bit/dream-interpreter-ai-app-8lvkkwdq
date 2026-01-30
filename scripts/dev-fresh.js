#!/usr/bin/env node
import { rm } from 'fs/promises'
import { spawn } from 'child_process'
import { join } from 'path'

const projectRoot = process.cwd()
const candidates = [
  '.vite',
  join('node_modules', '.vite'),
  'dist',
  'build',
  'temp_index.ts'
]

const verbose = process.argv.includes('--verbose')

async function cleanDirectory(pathName) {
  try {
    await rm(join(projectRoot, pathName), { recursive: true, force: true })
    if (verbose) {
      console.log(`✅ Removed ${pathName}`)
    }
  } catch (error) {
    console.warn(`⚠️ Unable to remove ${pathName}:`, error?.message || error)
  }
}

async function cleanAll() {
  if (verbose) {
    console.log('🧹 Purging dev caches and build artifacts before restarting dev server...')
  }
  for (const pathName of candidates) {
    await cleanDirectory(pathName)
  }
}

async function startVite() {
  if (verbose) {
    console.log('🚀 Launching Vite dev server...')
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

  process.on('SIGINT', () => forwardSignal('SIGINT'))
  process.on('SIGTERM', () => forwardSignal('SIGTERM'))

  child.on('close', (code) => {
    if (code !== null && code !== undefined) {
      process.exit(code)
    }
  })
}

async function main() {
  await cleanAll()
  await startVite()
}

main().catch((error) => {
  console.error('❌ Failed to refresh dev server:', error)
  process.exit(1)
})
