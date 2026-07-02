type NotificationRequest = {
  title?: string;
  body?: string;
  channel?: "email" | "sms" | "push" | "webhook";
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as NotificationRequest | null;

  if (!payload?.title || !payload?.body) {
    return Response.json(
      { ok: false, error: "title and body are required" },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    queued: true,
    channel: payload.channel ?? "webhook",
    title: payload.title
  });
}
