// Export utilities for notes
export const exportFormats = {
  MARKDOWN: 'markdown',
  TXT: 'txt',
  HTML: 'html',
  JSON: 'json'
}

export const exportNote = (note, format = exportFormats.MARKDOWN) => {
  if (!note) {
    throw new Error('No note provided for export')
  }

  const title = note.noteName || '未命名笔记'
  const content = note.noteContent || ''
  const createTime = note.createTime ? new Date(note.createTime).toLocaleString('zh-CN') : ''
  const updateTime = note.updateTime ? new Date(note.updateTime).toLocaleString('zh-CN') : ''

  let fileContent = ''
  let fileName = ''
  let mimeType = ''

  switch (format) {
    case exportFormats.MARKDOWN:
      fileContent = `# ${title}

**创建时间:** ${createTime}
**更新时间:** ${updateTime}

---

${content}
`
      fileName = `${title}.md`
      mimeType = 'text/markdown'
      break

    case exportFormats.TXT:
      fileContent = `${title}

创建时间: ${createTime}
更新时间: ${updateTime}

${content.replace(/<[^>]*>/g, '')}` // Remove HTML tags
      fileName = `${title}.txt`
      mimeType = 'text/plain'
      break

    case exportFormats.HTML:
      fileContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        .content { margin-top: 20px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="meta">
        <p><strong>创建时间:</strong> ${createTime}</p>
        <p><strong>更新时间:</strong> ${updateTime}</p>
    </div>
    <div class="content">
        ${content}
    </div>
</body>
</html>`
      fileName = `${title}.html`
      mimeType = 'text/html'
      break

    case exportFormats.JSON:
      fileContent = JSON.stringify({
        title,
        content,
        createTime,
        updateTime,
        noteId: note.noteId,
        exportTime: new Date().toISOString()
      }, null, 2)
      fileName = `${title}.json`
      mimeType = 'application/json'
      break

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  // Create and download file
  const blob = new Blob([fileContent], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return {
    fileName,
    format,
    size: blob.size
  }
}

export const exportMultipleNotes = (notes, format = exportFormats.MARKDOWN) => {
  if (!notes || notes.length === 0) {
    throw new Error('No notes provided for export')
  }

  const timestamp = new Date().toISOString().split('T')[0]
  let combinedContent = ''
  let fileName = `笔记导出_${timestamp}`
  let mimeType = ''

  switch (format) {
    case exportFormats.MARKDOWN:
      combinedContent = notes.map(note => {
        const title = note.noteName || '未命名笔记'
        const content = note.noteContent || ''
        const updateTime = note.updateTime ? new Date(note.updateTime).toLocaleString('zh-CN') : ''
        
        return `# ${title}

**更新时间:** ${updateTime}

${content}

---

`
      }).join('\n')
      fileName += '.md'
      mimeType = 'text/markdown'
      break

    case exportFormats.JSON:
      combinedContent = JSON.stringify({
        exportTime: new Date().toISOString(),
        notesCount: notes.length,
        notes: notes.map(note => ({
          title: note.noteName || '未命名笔记',
          content: note.noteContent || '',
          createTime: note.createTime,
          updateTime: note.updateTime,
          noteId: note.noteId
        }))
      }, null, 2)
      fileName += '.json'
      mimeType = 'application/json'
      break

    default:
      throw new Error(`Unsupported export format for multiple notes: ${format}`)
  }

  const blob = new Blob([combinedContent], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return {
    fileName,
    format,
    notesCount: notes.length,
    size: blob.size
  }
}