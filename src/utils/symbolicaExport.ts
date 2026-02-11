/**
 * Symbolica Export Utilities
 * Export Symbol Orchard data to PDF/HTML
 */

import { blink } from '../blink/client'
import type { DreamSymbol, GardenStats } from '../types/symbolica'

export interface SymbolicaExportOptions {
  userId: string
  symbolIds?: string[] // If provided, export only these symbols
  includeStats?: boolean
  includeCareHistory?: boolean
  format: 'pdf' | 'html' | 'markdown'
}

/**
 * Fetch symbols for export
 */
export async function fetchSymbolsForExport(
  userId: string,
  symbolIds?: string[]
): Promise<DreamSymbol[]> {
  try {
    if (symbolIds && symbolIds.length > 0) {
      const symbols: DreamSymbol[] = []
      for (const id of symbolIds) {
        const result = await blink.db.dreamSymbolsV2.list({
          where: { id, userId },
          limit: 1
        })
        if (result.length > 0) {
          symbols.push(castSymbol(result[0]))
        }
      }
      return symbols
    }

    const result = await blink.db.dreamSymbolsV2.list({
      where: { userId },
      orderBy: { occurrenceCount: 'desc' },
      limit: 200
    })

    return result.map(castSymbol)
  } catch (error) {
    console.error('Error fetching symbols for export:', error)
    return []
  }
}

function castSymbol(row: any): DreamSymbol {
  const contexts = row.contexts ? JSON.parse(row.contexts) : []
  return {
    id: row.id,
    userId: row.userId,
    symbol: row.symbol,
    archetypeCategory: row.archetypeCategory || 'unknown',
    jungianMeaning: row.jungianMeaning || '',
    personalMeaning: row.personalMeaning || '',
    occurrenceCount: row.occurrenceCount || 1,
    contexts,
    emotionalValence: row.emotionalValence || 0,
    firstSeen: row.firstSeen,
    lastSeen: row.lastSeen,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    growthPhase: 'seed',
    growthProgress: 0,
    waterLevel: 100,
    needsWatering: false
  }
}

/**
 * Generate HTML content for export
 */
export function generateSymbolicaHTMLExport(
  symbols: DreamSymbol[],
  stats?: GardenStats,
  userName?: string
): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getGrowthEmoji = (phase: string) => {
    switch (phase) {
      case 'seed': return '🌱'
      case 'sprout': return '🌿'
      case 'bloom': return '🌸'
      case 'flourish': return '✨'
      case 'harvest': return '🍎'
      default: return '🌱'
    }
  }

  const getArchetypeEmoji = (archetype: string) => {
    switch (archetype) {
      case 'the_self': return '🪞'
      case 'the_shadow': return '🌑'
      case 'anima_animus': return '💫'
      case 'wise_elder': return '🦉'
      case 'the_trickster': return '🃏'
      case 'the_hero': return '⚔️'
      case 'mother_father': return '🏛️'
      case 'the_child': return '✨'
      default: return '❓'
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Symbol Orchard Export</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Georgia', serif;
      line-height: 1.8;
      color: #2d3748;
      background: #f7fafc;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 2px solid #22c55e;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 12px;
    }
    h1 {
      font-size: 2rem;
      color: #166534;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #4ade80;
      font-style: italic;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #166534;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #718096;
      text-transform: uppercase;
    }
    .symbol-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      page-break-inside: avoid;
      border-left: 4px solid #22c55e;
    }
    .symbol-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .symbol-name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #166534;
      text-transform: capitalize;
    }
    .symbol-badges {
      display: flex;
      gap: 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-growth {
      background: #dcfce7;
      color: #166534;
    }
    .badge-archetype {
      background: #f3f0ff;
      color: #7c3aed;
    }
    .badge-count {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .meaning-section {
      margin: 1rem 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
    }
    .meaning-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    .meaning-text {
      color: #64748b;
      font-size: 0.95rem;
    }
    .personal-meaning {
      background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%);
      border: 1px solid #e9d5ff;
    }
    .contexts-section {
      margin-top: 1rem;
    }
    .context-tag {
      display: inline-block;
      background: #f1f5f9;
      color: #475569;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin: 0.25rem;
    }
    .meta-info {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.75rem;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    footer {
      text-align: center;
      padding: 2rem 0;
      border-top: 1px solid #e2e8f0;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #718096;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      header {
        background: #f0fdf4;
      }
      .symbol-card {
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>🌳 Symbol Orchard</h1>
    <p class="subtitle">${userName ? `${userName}'s ` : ''}Personal Dream Symbol Garden</p>
    <p class="subtitle">Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </header>

  ${stats ? `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.totalSymbols}</div>
      <div class="stat-label">Total Symbols</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.seedCount + stats.sproutCount}</div>
      <div class="stat-label">Growing</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.bloomCount + stats.flourishCount}</div>
      <div class="stat-label">Blooming</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.harvestCount}</div>
      <div class="stat-label">Harvested</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.gardenHealth}%</div>
      <div class="stat-label">Health</div>
    </div>
  </div>
  ` : ''}

  <h2 style="margin: 2rem 0 1rem; color: #166534;">Your Symbols (${symbols.length})</h2>

  ${symbols.map(symbol => `
  <div class="symbol-card">
    <div class="symbol-header">
      <span class="symbol-name">${getGrowthEmoji(symbol.growthPhase)} ${symbol.symbol}</span>
      <div class="symbol-badges">
        <span class="badge badge-growth">${symbol.growthPhase}</span>
        <span class="badge badge-archetype">${getArchetypeEmoji(symbol.archetypeCategory)} ${symbol.archetypeCategory.replace(/_/g, ' ')}</span>
        <span class="badge badge-count">${symbol.occurrenceCount}× seen</span>
      </div>
    </div>
    
    ${symbol.jungianMeaning ? `
    <div class="meaning-section">
      <div class="meaning-title">🦉 Universal Meaning</div>
      <div class="meaning-text">${escapeHtml(symbol.jungianMeaning)}</div>
    </div>
    ` : ''}
    
    ${symbol.personalMeaning ? `
    <div class="meaning-section personal-meaning">
      <div class="meaning-title">💜 Personal Meaning</div>
      <div class="meaning-text">${escapeHtml(symbol.personalMeaning)}</div>
    </div>
    ` : ''}
    
    ${symbol.contexts.length > 0 ? `
    <div class="contexts-section">
      <div class="meaning-title">Dream Contexts</div>
      ${symbol.contexts.slice(0, 5).map(ctx => `<span class="context-tag">${escapeHtml(ctx.slice(0, 100))}</span>`).join('')}
    </div>
    ` : ''}
    
    <div class="meta-info">
      <span>First seen: ${formatDate(symbol.firstSeen)}</span>
      <span>Last seen: ${formatDate(symbol.lastSeen)}</span>
    </div>
  </div>
  `).join('')}

  <footer>
    <p>🌙 Generated by Dreamcatcher AI - Symbol Orchard</p>
    <p>Your symbols, your growth, your journey of self-discovery.</p>
  </footer>
</body>
</html>
`

  return html
}

/**
 * Generate Markdown content for export
 */
export function generateSymbolicaMarkdownExport(
  symbols: DreamSymbol[],
  stats?: GardenStats,
  userName?: string
): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  let md = `# 🌳 Symbol Orchard\n\n`
  md += `${userName ? `**${userName}'s** ` : ''}Personal Dream Symbol Garden\n\n`
  md += `*Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n`
  md += `---\n\n`

  if (stats) {
    md += `## Garden Statistics\n\n`
    md += `| Metric | Value |\n`
    md += `|--------|-------|\n`
    md += `| Total Symbols | ${stats.totalSymbols} |\n`
    md += `| Growing | ${stats.seedCount + stats.sproutCount} |\n`
    md += `| Blooming | ${stats.bloomCount + stats.flourishCount} |\n`
    md += `| Harvested | ${stats.harvestCount} |\n`
    md += `| Garden Health | ${stats.gardenHealth}% |\n\n`
    md += `---\n\n`
  }

  md += `## Your Symbols (${symbols.length})\n\n`

  for (const symbol of symbols) {
    md += `### ${symbol.symbol}\n\n`
    md += `- **Growth Phase:** ${symbol.growthPhase}\n`
    md += `- **Archetype:** ${symbol.archetypeCategory.replace(/_/g, ' ')}\n`
    md += `- **Times Seen:** ${symbol.occurrenceCount}\n`
    md += `- **First Seen:** ${formatDate(symbol.firstSeen)}\n`
    md += `- **Last Seen:** ${formatDate(symbol.lastSeen)}\n\n`
    
    if (symbol.jungianMeaning) {
      md += `**Universal Meaning:**\n${symbol.jungianMeaning}\n\n`
    }
    
    if (symbol.personalMeaning) {
      md += `**Personal Meaning:**\n${symbol.personalMeaning}\n\n`
    }
    
    if (symbol.contexts.length > 0) {
      md += `**Dream Contexts:**\n`
      symbol.contexts.slice(0, 5).forEach(ctx => {
        md += `- ${ctx.slice(0, 100)}\n`
      })
      md += `\n`
    }
    
    md += `---\n\n`
  }

  md += `\n*🌙 Generated by Dreamcatcher AI - Symbol Orchard*\n`
  md += `*Your symbols, your growth, your journey of self-discovery.*\n`

  return md
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export symbols and trigger download
 */
export async function exportSymbolOrchard(
  options: SymbolicaExportOptions,
  stats?: GardenStats,
  userName?: string
): Promise<boolean> {
  try {
    const symbols = await fetchSymbolsForExport(options.userId, options.symbolIds)
    
    if (symbols.length === 0) {
      throw new Error('No symbols found to export')
    }

    const dateStr = new Date().toISOString().split('T')[0]

    if (options.format === 'html') {
      const html = generateSymbolicaHTMLExport(symbols, options.includeStats ? stats : undefined, userName)
      downloadFile(html, `symbol-orchard-${dateStr}.html`, 'text/html')
      return true
    }

    if (options.format === 'markdown') {
      const md = generateSymbolicaMarkdownExport(symbols, options.includeStats ? stats : undefined, userName)
      downloadFile(md, `symbol-orchard-${dateStr}.md`, 'text/markdown')
      return true
    }

    if (options.format === 'pdf') {
      // For PDF, we generate HTML and use browser print
      const html = generateSymbolicaHTMLExport(symbols, options.includeStats ? stats : undefined, userName)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        // Small delay to ensure content loads
        setTimeout(() => {
          printWindow.print()
        }, 500)
        return true
      }
      throw new Error('Could not open print window')
    }

    return false
  } catch (error) {
    console.error('Error exporting Symbol Orchard:', error)
    throw error
  }
}
