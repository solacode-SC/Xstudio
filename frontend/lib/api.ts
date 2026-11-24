export const processFile = (
  files: File[],
  tool: string,
  options: Record<string, any>,
  onProgress?: (percent: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    form.append('tool', tool)
    form.append('options', JSON.stringify(options || {}))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/process', true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.round((event.loaded / event.total) * 75)
        onProgress(pct)
      }
    }

    xhr.onload = () => {
      if (onProgress) onProgress(100)
      let parsed: any = null
      try {
        parsed = JSON.parse(xhr.responseText)
      } catch {
        // non-JSON error body (e.g. reverse proxy 413)
      }

      if (xhr.status >= 200 && xhr.status < 300 && parsed) {
        resolve(parsed)
      } else {
        const msg =
          parsed?.detail ||
          parsed?.error ||
          (xhr.status === 413
            ? 'File exceeds maximum upload size (100MB).'
            : `Engine request failed (HTTP ${xhr.status}).`)
        reject(new Error(msg))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error while communicating with Xstudio Engine.'))
    }

    xhr.send(form)
  })
}

export async function fetchResultAsFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Could not load processed file into Studio.')
  }
  const blob = await res.blob()
  const mime = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : blob.type
  return new File([blob], filename, { type: mime })
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}
