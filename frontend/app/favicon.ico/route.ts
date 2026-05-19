const headers = {
  // We don't ship a real .ico yet; this prevents noisy 404s in production.
  "Content-Type": "image/x-icon",
  "Cache-Control": "public, max-age=86400",
}

export function GET() {
  return new Response("", { status: 200, headers })
}

export function HEAD() {
  return new Response(null, { status: 200, headers })
}
