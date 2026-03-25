import { requireAuth } from "@/lib/auth"
import { subscribeUserNotifications } from "@/lib/notification-realtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth()
    const userId = Number(currentUser.id)

    const encoder = new TextEncoder()
    let unsubscribe: (() => void) | null = null
    let heartbeat: ReturnType<typeof setInterval> | null = null
    let isClosed = false

    const sendEvent = (
      controller: ReadableStreamDefaultController<Uint8Array>,
      eventName: string,
      data: Record<string, any>
    ) => {
      if (isClosed) return
      const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
      controller.enqueue(encoder.encode(payload))
    }

    const cleanup = () => {
      if (isClosed) return
      isClosed = true

      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeat = null
      }

      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        sendEvent(controller, "connected", {
          ok: true,
          userId,
          createdAt: new Date().toISOString(),
        })

        unsubscribe = subscribeUserNotifications(userId, (payload) => {
          try {
            sendEvent(controller, "notification", payload)
          } catch {
            cleanup()
            try {
              controller.close()
            } catch {}
          }
        })

        heartbeat = setInterval(() => {
          try {
            sendEvent(controller, "ping", { timestamp: Date.now() })
          } catch {
            cleanup()
            try {
              controller.close()
            } catch {}
          }
        }, 25000)

        request.signal.addEventListener(
          "abort",
          () => {
            cleanup()
            try {
              controller.close()
            } catch {}
          },
          { once: true }
        )
      },
      cancel() {
        cleanup()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error: any) {
    console.error("Notification stream error:", error)
    return new Response(JSON.stringify({ success: false, message: error?.message || "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
}
