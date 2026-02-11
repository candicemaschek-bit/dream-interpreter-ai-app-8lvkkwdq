/**
 * Journal Export Utilities
 * Export reflection sessions and dream journals to PDF/HTML
 * 
 * Phase 3 Implementation
 */

import { blink } from '../blink/client'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportOptions {
  userId: string
  sessionIds?: string[] // If provided, export only these sessions
  includeEmotionalTags?: boolean
  includeDreamLinks?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  format: 'pdf' | 'html' | 'markdown'
}

export interface ExportedSession {
  id: string
  sessionType: string
  createdAt: string
  dreamTitle?: string
  messages: {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    emotionalTags?: string[]
  }[]
}

/**
 * Fetch sessions with messages for export
 */
export async function fetchSessionsForExport(options: ExportOptions): Promise<ExportedSession[]> {
  try {
    let sessions: any[] = []

    if (options.sessionIds && options.sessionIds.length > 0) {
      // Fetch specific sessions
      for (const sessionId of options.sessionIds) {
        const results = await blink.db.reflectionSessions.list({
          where: { id: sessionId, userId: options.userId },
          limit: 1
        })
        if (results.length > 0) {
          sessions.push(results[0])
        }
      }
    } else {
      // Fetch all sessions within date range
      const where: any = { userId: options.userId }
      
      sessions = await blink.db.reflectionSessions.list({
        where,
        orderBy: { createdAt: 'desc' },
        limit: 100
      })

      // Filter by date range if provided
      if (options.dateRange) {
        sessions = sessions.filter((s: any) => {
          const date = new Date(s.createdAt)
          return date >= options.dateRange!.start && date <= options.dateRange!.end
        })
      }
    }

    // Fetch messages for each session
    const exportedSessions: ExportedSession[] = []

    for (const session of sessions) {
      const messages = await blink.db.reflectionMessages.list({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        limit: 200
      })

      // Get dream title if linked
      let dreamTitle: string | undefined
      if (options.includeDreamLinks && session.dreamId) {
        const dreams = await blink.db.dreams.list({
          where: { id: session.dreamId },
          limit: 1
        })
        if (dreams.length > 0) {
          dreamTitle = dreams[0].title
        }
      }

      exportedSessions.push({
        id: session.id,
        sessionType: session.sessionType,
        createdAt: session.createdAt,
        dreamTitle,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
          emotionalTags: options.includeEmotionalTags && m.emotionalTags
            ? (typeof m.emotionalTags === 'string' ? JSON.parse(m.emotionalTags) : m.emotionalTags)
            : undefined
        }))
      })
    }

    return exportedSessions
  } catch (error) {
    console.error('Error fetching sessions for export:', error)
    return []
  }
}

/**
 * Generate PDF content for export using jsPDF
 */
export function generatePDFExport(sessions: ExportedSession[], userName?: string): Blob {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(22)
  doc.setTextColor(139, 92, 246) // Purple
  doc.text('Reflection Journal', 14, 20)
  
  // Subtitle
  doc.setFontSize(12)
  doc.setTextColor(100, 116, 139) // Slate
  const subtitle = userName ? `${userName}'s Personal Dream Reflections` : 'Personal Dream Reflections'
  doc.text(subtitle, 14, 30)
  doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 36)

  // Stats
  doc.setFontSize(10)
  doc.text(`Total Sessions: ${sessions.length}`, 14, 46)
  
  let yPos = 55

  sessions.forEach((session, index) => {
    // Add new page if close to bottom
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Session Header
    doc.setDrawColor(226, 232, 240) // Light gray border
    doc.line(14, yPos, 196, yPos)
    yPos += 10

    doc.setFontSize(14)
    doc.setTextColor(51, 65, 85) // Dark slate
    doc.text(session.sessionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 14, yPos)
    
    doc.setFontSize(10)
    doc.setTextColor(148, 163, 184) // Lighter slate
    doc.text(new Date(session.createdAt).toLocaleString(), 140, yPos, { align: 'right' })
    
    yPos += 8

    if (session.dreamTitle) {
      doc.setFontSize(10)
      doc.setTextColor(139, 92, 246) // Purple
      doc.text(`Dream: ${session.dreamTitle}`, 14, yPos)
      yPos += 10
    } else {
      yPos += 5
    }

    // Messages table
    const tableData = session.messages.map(msg => [
      msg.role === 'user' ? 'You' : 'AI',
      msg.content,
      new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Role', 'Message', 'Time']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25, halign: 'right' }
      },
      headStyles: { fillColor: [139, 92, 246] },
      margin: { top: 20 },
      didDrawPage: (data) => {
        // Update yPos for next iteration
        yPos = data.cursor.y + 15
      }
    })
    
    // Update yPos after table
    yPos = (doc as any).lastAutoTable.finalY + 15
  })

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(`Page ${i} of ${pageCount} - Generated by Dreamcatcher AI`, 105, 290, { align: 'center' })
  }

  return doc.output('blob')
}

/**
 * Generate HTML content for export
 */
export function generateHTMLExport(sessions: ExportedSession[], userName?: string): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reflection Journal Export</title>
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
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 2px solid #8b5cf6;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2rem;
      color: #8b5cf6;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #718096;
      font-style: italic;
    }
    .session {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      padding: 1.5rem;
      page-break-inside: avoid;
    }
    .session-header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }
    .session-title {
      font-size: 1.25rem;
      color: #4a5568;
      font-weight: 600;
    }
    .session-meta {
      font-size: 0.875rem;
      color: #718096;
      margin-top: 0.25rem;
    }
    .dream-link {
      display: inline-block;
      background: linear-gradient(to right, #8b5cf6, #a855f7);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    .message {
      margin-bottom: 1rem;
      padding: 1rem;
      border-radius: 8px;
    }
    .message.user {
      background: #edf2f7;
      margin-left: 2rem;
    }
    .message.assistant {
      background: linear-gradient(135deg, #f3f0ff 0%, #fdf2f8 100%);
      border-left: 3px solid #8b5cf6;
    }
    .message-role {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .message.user .message-role {
      color: #4a5568;
    }
    .message.assistant .message-role {
      color: #8b5cf6;
    }
    .message-content {
      white-space: pre-wrap;
    }
    .message-time {
      font-size: 0.75rem;
      color: #a0aec0;
      margin-top: 0.5rem;
    }
    .emotional-tags {
      margin-top: 0.5rem;
    }
    .tag {
      display: inline-block;
      background: #e9d5ff;
      color: #7c3aed;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-right: 0.25rem;
    }
    footer {
      text-align: center;
      padding: 2rem 0;
      border-top: 1px solid #e2e8f0;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #718096;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #8b5cf6;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #718096;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .session {
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>🌙 Reflection Journal</h1>
    <p class="subtitle">${userName ? `${userName}'s ` : ''}Personal Dream Reflections</p>
    <p class="subtitle">Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${sessions.length}</div>
        <div class="stat-label">Sessions</div>
      </div>
      <div class="stat">
        <div class="stat-value">${sessions.reduce((sum, s) => sum + s.messages.length, 0)}</div>
        <div class="stat-label">Messages</div>
      </div>
    </div>
  </header>

  ${sessions.map(session => `
  <div class="session">
    <div class="session-header">
      <div class="session-title">${session.sessionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
      <div class="session-meta">${formatDate(session.createdAt)}</div>
      ${session.dreamTitle ? `<span class="dream-link">📖 ${session.dreamTitle}</span>` : ''}
    </div>
    <div class="messages">
      ${session.messages.map(msg => `
      <div class="message ${msg.role}">
        <div class="message-role">${msg.role === 'user' ? 'You' : 'Reflect AI'}</div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
        <div class="message-time">${formatTime(msg.timestamp)}</div>
        ${msg.emotionalTags && msg.emotionalTags.length > 0 ? `
        <div class="emotional-tags">
          ${msg.emotionalTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
      </div>
      `).join('')}
    </div>
  </div>
  `).join('')}

  <footer>
    <p>Generated by Dreamcatcher AI</p>
    <p>Your dreams, your insights, your journey.</p>
  </footer>
</body>
</html>
`

  return html
}

/**
 * Generate Markdown content for export
 */
export function generateMarkdownExport(sessions: ExportedSession[], userName?: string): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  let md = `# 🌙 Reflection Journal\n\n`
  md += `${userName ? `**${userName}'s** ` : ''}Personal Dream Reflections\n\n`
  md += `*Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n`
  md += `---\n\n`
  md += `**Total Sessions:** ${sessions.length} | **Total Messages:** ${sessions.reduce((sum, s) => sum + s.messages.length, 0)}\n\n`
  md += `---\n\n`

  for (const session of sessions) {
    md += `## ${session.sessionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n`
    md += `*${formatDate(session.createdAt)}*\n\n`
    
    if (session.dreamTitle) {
      md += `> 📖 Related Dream: **${session.dreamTitle}**\n\n`
    }

    for (const msg of session.messages) {
      if (msg.role === 'user') {
        md += `### You\n\n${msg.content}\n\n`
      } else {
        md += `### Reflect AI\n\n${msg.content}\n\n`
      }
      
      if (msg.emotionalTags && msg.emotionalTags.length > 0) {
        md += `*Emotions: ${msg.emotionalTags.join(', ')}*\n\n`
      }
    }

    md += `---\n\n`
  }

  md += `\n*Generated by Dreamcatcher AI - Your dreams, your insights, your journey.*\n`

  return md
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, '<br>')
}

/**
 * Download content as file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType })
    : content

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
 * Export sessions and trigger download
 */
export async function exportJournal(options: ExportOptions, userName?: string): Promise<boolean> {
  try {
    const sessions = await fetchSessionsForExport(options)
    
    if (sessions.length === 0) {
      throw new Error('No sessions found to export')
    }

    const dateStr = new Date().toISOString().split('T')[0]

    if (options.format === 'html') {
      const html = generateHTMLExport(sessions, userName)
      downloadFile(html, `reflection-journal-${dateStr}.html`, 'text/html')
      return true
    }

    if (options.format === 'markdown') {
      const md = generateMarkdownExport(sessions, userName)
      downloadFile(md, `reflection-journal-${dateStr}.md`, 'text/markdown')
      return true
    }

    if (options.format === 'pdf') {
      // Use jsPDF for reliable PDF generation
      const pdfBlob = generatePDFExport(sessions, userName)
      downloadFile(pdfBlob, `reflection-journal-${dateStr}.pdf`, 'application/pdf')
      return true
    }

    return false
  } catch (error) {
    console.error('Error exporting journal:', error)
    throw error
  }
}
