import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import BarcodeScanner from '../components/BarcodeScanner'
import { useBooks } from '../hooks/useBooks'
import { useAuth } from '../hooks/useAuth'
import { fetchBookByISBN } from '../lib/openbd'

type FormState = {
  title: string
  author: string
  publisher: string
  isbn: string
  coverUrl: string
  description: string
  copyCount: number
}

type TextField = Exclude<keyof FormState, 'copyCount'>

const EMPTY: FormState = {
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  coverUrl: '',
  description: '',
  copyCount: 1,
}

export default function AddBook() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [metadataMessage, setMetadataMessage] = useState('')
  const [error, setError] = useState('')
  const { addBook } = useBooks()
  const { user } = useAuth()
  const navigate = useNavigate()

  const set = (key: TextField, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const fillBookInfoByISBN = useCallback(async (isbn: string) => {
    const cleanIsbn = isbn.replace(/-/g, '').trim()
    if (!cleanIsbn) {
      setError('ISBNを入力してください')
      return
    }

    setScanning(true)
    setMetadataMessage('')
    setError('')
    setForm((prev) => ({ ...prev, isbn: cleanIsbn }))
    try {
      const info = await fetchBookByISBN(cleanIsbn)
      if (info) {
        setForm((prev) => ({ ...prev, ...info, isbn: cleanIsbn }))
        setMetadataMessage(
          info.description
            ? '書誌情報と概要を取得しました'
            : '書誌情報を取得しました。概要は手動で入力できます'
        )
      } else {
        setMetadataMessage('書誌情報が見つかりませんでした。手動で入力してください')
      }
    } finally {
      setScanning(false)
    }
  }, [])

  const handleScan = useCallback(async (isbn: string) => {
    setShowScanner(false)
    await fillBookInfoByISBN(isbn)
  }, [fillBookInfoByISBN])

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
      const addPromise = addBook({
        ...form,
        copyCount: normalizeCopyCount(form.copyCount),
        createdBy: user.uid,
      })
      navigate('/', { replace: true })
      await addPromise
    } catch (e) {
      setError(`登録に失敗しました: ${e instanceof Error ? e.message : String(e)}`)
      navigate('/add', { replace: true })
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

        {metadataMessage && (
          <p className="text-center text-sm text-green-600 mb-4">
            {metadataMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'title', label: 'タイトル *', placeholder: '書籍タイトル' },
            { key: 'author', label: '著者 *', placeholder: '著者名' },
            { key: 'publisher', label: '出版社 *', placeholder: '出版社名' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm text-gray-600 block mb-1">{label}</label>
              <input
                type="text"
                value={form[key as TextField]}
                onChange={(e) => set(key as TextField, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          ))}

          <div>
            <label className="text-sm text-gray-600 block mb-1">ISBN</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.isbn}
                onChange={(e) => set('isbn', e.target.value)}
                placeholder="9784000000000"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={() => fillBookInfoByISBN(form.isbn)}
                disabled={scanning || !form.isbn.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                取得
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">概要</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="本の概要"
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">所蔵冊数</label>
            <input
              type="number"
              value={form.copyCount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, copyCount: Number(e.target.value) }))
              }
              min="1"
              max="99"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

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

function normalizeCopyCount(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.floor(value), 1), 99)
}
