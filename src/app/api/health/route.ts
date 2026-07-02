export async function GET() {
  return Response.json({
    ok: true,
    service: "loop-offchain",
    timestamp: new Date().toISOString()
  });
}
