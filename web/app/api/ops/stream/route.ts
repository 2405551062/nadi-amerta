/** GET /api/ops/stream — Server-Sent Events feed of ops changes (design/10 §11). */
import { opsBus } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      send({ topic: "hello", at: Date.now() });

      const onOps = (payload: unknown) => send(payload);
      opsBus.on("ops", onOps);

      // heartbeat keeps the connection alive through proxies
      const hb = setInterval(() => controller.enqueue(encoder.encode(": ping\n\n")), 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(hb);
        opsBus.off("ops", onOps);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
