import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (isbn: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'barcode-scanner-container'

  const stoppedRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner
    stoppedRef.current = false

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (stoppedRef.current) return
          const isbn = decodedText.replace(/-/g, '')
          if (/^97[89]\d{10}$/.test(isbn) || /^\d{10}$/.test(isbn)) {
            stoppedRef.current = true
            scanner
              .stop()
              .catch(() => {})
              .finally(() => onScan(isbn))
          }
        },
        () => {}
      )
      .catch((err) => console.error('Camera start error:', err))

    return () => {
      if (!stoppedRef.current) {
        stoppedRef.current = true
        scanner.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold">ISBNバーコードをスキャン</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>
        <div id={containerId} className="w-full" />
        <p className="text-xs text-center text-gray-400 py-3">
          バーコードをカメラに向けてください
        </p>
      </div>
    </div>
  )
}
