// Lightweight client-side file handoff between Home Quick-Drop and Studio Workbench
let pendingFiles: File[] | null = null

export function setHandoffFiles(files: File[]) {
  pendingFiles = files
}

export function consumeHandoffFiles(): File[] | null {
  const f = pendingFiles
  pendingFiles = null
  return f
}
