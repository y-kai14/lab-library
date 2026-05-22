import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (isbn: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stoppedRef = useRef(false)
  const containerId = 'barcode-scanner-container'
  const [mirrored, setMirrored] = useState(false)

  const startScanner = useCallback(() => {
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
  }, [onScan])

  useEffect(() => {
    startScanner()
    return () => {
      if (!stoppedRef.current && scannerRef.current) {
        stoppedRef.current = true
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [startScanner])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold">ISBNバーコードをスキャン</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMirrored((prev) => !prev)}
              className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
              title="左右反転"
            >
              ⇄ 反転
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>
        </div>
        <div style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}>
          <div id={containerId} className="w-full" />
        </div>
        <p className="text-xs text-center text-gray-400 py-3">
          バーコードをカメラに向けてください
        </p>
      </div>
    </div>
  )
}
