import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already in standalone / installed mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(iosDevice)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only show if user hasn't dismissed in this session
      const dismissed = sessionStorage.getItem('agrismart-install-dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Show iOS guidance if on iOS and not dismissed
    if (iosDevice && !sessionStorage.getItem('agrismart-install-dismissed')) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('agrismart-install-dismissed', 'true')
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-agri-900 to-orange-900 text-white p-4 rounded-2xl shadow-2xl border border-orange-500/30 flex items-start gap-3.5 backdrop-blur-md">
        <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
          <Smartphone className="text-orange-300" size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
              Install AgriSmart App
            </h4>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white p-1 -mr-1 rounded-lg"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-orange-100/80 mt-1 leading-relaxed">
            {isIOS ? (
              <span className="flex items-center gap-1">
                Tap <Share size={12} className="inline text-orange-300" /> then select <strong>Add to Home Screen</strong> for full mobile app mode.
              </span>
            ) : (
              'Install for full-screen CCTV plant protection and fast mobile access.'
            )}
          </p>
          {!isIOS && deferredPrompt && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-agri-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
              >
                <Download size={14} /> Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-orange-200/70 hover:text-white px-2 py-1.5"
              >
                Maybe Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
