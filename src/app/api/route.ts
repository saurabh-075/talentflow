// src/app/api/health/route.ts
export async function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
