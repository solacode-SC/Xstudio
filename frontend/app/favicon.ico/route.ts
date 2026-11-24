const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#0A0A0B"/>
  <path d="M18 18L46 46M46 18L18 46" stroke="#FFFFFF" stroke-width="7" stroke-linecap="square"/>
  <circle cx="48" cy="16" r="6" fill="#FF4D00"/>
</svg>`

const headers = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, max-age=86400",
}

export function GET() {
  return new Response(svgIcon, { status: 200, headers })
}

export function HEAD() {
  return new Response(null, { status: 200, headers })
}
