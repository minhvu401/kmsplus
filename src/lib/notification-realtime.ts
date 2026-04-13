type NotificationRealtimePayload = {
  type: "notification_created"
  userId: number
  notificationType: string
  articleId: number | null
  commentId: string | null
  createdAt: string
}

type NotificationListener = (payload: NotificationRealtimePayload) => void

type NotificationHubStore = {
  listenersByUser: Map<number, Set<NotificationListener>>
}

declare global {
  var __notificationHubStore__: NotificationHubStore | undefined
}

function getNotificationHubStore(): NotificationHubStore {
  if (!globalThis.__notificationHubStore__) {
    globalThis.__notificationHubStore__ = {
      listenersByUser: new Map<number, Set<NotificationListener>>(),
    }
  }

  return globalThis.__notificationHubStore__
}

export function subscribeUserNotifications(
  userId: number,
  listener: NotificationListener
): () => void {
  const store = getNotificationHubStore()
  const listeners = store.listenersByUser.get(userId) ?? new Set<NotificationListener>()

  listeners.add(listener)
  store.listenersByUser.set(userId, listeners)

  return () => {
    const current = store.listenersByUser.get(userId)
    if (!current) return

    current.delete(listener)
    if (current.size === 0) {
      store.listenersByUser.delete(userId)
    }
  }
}

export function emitUserNotification(payload: NotificationRealtimePayload) {
  const store = getNotificationHubStore()
  const listeners = store.listenersByUser.get(payload.userId)

  if (!listeners || listeners.size === 0) {
    return
  }

  for (const listener of Array.from(listeners)) {
    try {
      listener(payload)
    } catch (error) {
      console.error("Notification realtime listener error:", error)
    }
  }
}
