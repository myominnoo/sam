import { useRegisterSW } from "virtual:pwa-register/react"

export function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r)
    },
    onRegisterError(error) {
      console.error("SW Registration error:", error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg max-w-sm flex flex-col gap-2">
      <div className="text-sm font-medium">
        {offlineReady ? (
          <span>App ready to work offline</span>
        ) : (
          <span>New content available, click on reload button to update.</span>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        {needRefresh && (
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        )}
        <button
          type="button"
          className="px-3 py-1 text-xs font-medium border border-input rounded-md"
          onClick={close}
        >
          Close
        </button>
      </div>
    </div>
  )
}