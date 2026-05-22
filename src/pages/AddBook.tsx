import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import BarcodeScanner from '../components/BarcodeScanner'
import { useBooks } from '../hooks/useBooks'
import { useAuth } from '../hooks/useAuth'
import { fetchBookByISBN } from '../lib/openbd'

const EMPTY = { title: '', author: '', publisher: '', isbn: '', coverUrl: '' }

export default function AddBook() {
  const [form, setForm] = useState(EMPTY)
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { addBook } = useBooks()
  const { user } = useAuth()
  const navigate = useNavigate()

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleScan = useCallback(async (isbn: string) => {
    setShowScanner(false)
    setScanning(true)
    setForm((prev) => ({ ...prev, isbn }))
    try {
      const info = await fetchBookByISBN(isbn)
      if (info) {
        setForm((prev) => ({ ...prev, ...info, isbn }))
      }
    } finally {
      setScanning(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.title.trim() || !form.author.trim() || !form.publisher.trim()) {
      setError('タイトル・著者・出版社は必須です')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addBook({
        ...form,
        createdBy: user.uid,
      })
      navigate('/')
    } catch (e) {
      setError(`登録に失敗しました: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">蔵書を登録</h2>

        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl py-4 mb-6 flex items-center justify-center gap-2 hover:border-indigo-400 transition-colors text-sm font-medium"
        >
          📷 ISBNバーコードをスキャン
        </button>

        {scanning && (
          <p className="text-center text-sm text-indigo-500 mb-4 animate-pulse">
            書誌情報を取得中...
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'title', label: 'タイトル *', placeholder: '書籍タイトル' },
            { key: 'author', label: '著者 *', placeholder: '著者名' },
            { key: 'publisher', label: '出版社 *', placeholder: '出版社名' },
            { key: 'isbn', label: 'ISBN', placeholder: '9784000000000' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm text-gray-600 block mb-1">{label}</label>
              <input
                type="text"
                value={form[key as keyof typeof EMPTY]}
                onChange={(e) => set(key as keyof typeof EMPTY, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || scanning}
              className="flex-1 bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {submitting ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </Layout>
  )
}
