export const processFile = async (files: File[], tool: string, options: any) => {
  const form = new FormData()

  files.forEach(f => form.append('files', f))
  form.append('tool', tool)
  form.append('options', JSON.stringify(options))

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${apiUrl}/api/process`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    let errMessage = 'Failed to process file'

    try {
      const err = await res.json()
      errMessage = err.detail || err.error || errMessage
    } catch (e) {}

    throw new Error(errMessage)
  }

  return res.json()
}