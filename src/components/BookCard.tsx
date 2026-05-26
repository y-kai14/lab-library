import { useState } from 'react'
import type { Book } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useBooks } from '../hooks/useBooks'
import { getAvailableCount, getCopyCount, getLoans } from '../lib/bookLoans'

interface Props {
  book: Book
}

export default function BookCard({ book }: Props) {
  const { user } = useAuth()
  const { borrowBook, returnBook, deleteBook, updateBook } = useBooks()

  const loans = getLoans(book)
  const borrowedCount = loans.length
  const availableCount = getAvailableCount(book)
  const isAvailable = availableCount > 0
  const isMyBook = loans.some((loan) => loan.uid === user?.uid)
  const copyCount = getCopyCount(book)
  const borrowerNames = loans.map((loan) => loan.displayName).join(', ')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    isbn: book.isbn || '',
    coverUrl: book.coverUrl || '',
    description: book.description || '',
    copyCount,
  })

  const set = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleBorrow = async () => {
    if (!user) return
    await borrowBook(
      book.id,
      user.uid,
      user.displayName || user.email || 'Unknown'
    )
  }

  const handleReturn = async () => {
    if (!user) return
    await returnBook(book.id, user.uid)
  }

  const handleDelete = async () => {
    if (!confirm(`「${book.title}」を削除しますか？`)) return
    await deleteBook(book.id)
  }

  const handleCancelEdit = () => {
    setForm({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn || '',
      coverUrl: book.coverUrl || '',
      description: book.description || '',
      copyCount,
    })
    setError('')
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim() || !form.publisher.trim()) {
      setError('タイトル・著者・出版社は必須です')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateBook(book.id, {
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        isbn: form.isbn.trim(),
        coverUrl: form.coverUrl.trim(),
        description: form.description.trim(),
        copyCount: normalizeCopyCount(form.copyCount),
      })
      setIsEditing(false)
    } catch (e) {
      setError(`更新に失敗しました: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditInput
            label="タイトル *"
            value={form.title}
            onChange={(value) => set('title', value)}
          />
          <EditInput
            label="著者 *"
            value={form.author}
            onChange={(value) => set('author', value)}
          />
          <EditInput
            label="出版社 *"
            value={form.publisher}
            onChange={(value) => set('publisher', value)}
          />
          <EditInput
            label="ISBN"
            value={form.isbn}
            onChange={(value) => set('isbn', value)}
          />
          <EditInput
            label="表紙画像URL"
            value={form.coverUrl}
            onChange={(value) => set('coverUrl', value)}
          />
          <div>
            <label className="text-xs text-gray-500 block mb-1">所蔵冊数</label>
            <input
              type="number"
              value={form.copyCount}
              onChange={(e) => set('copyCount', Number(e.target.value))}
              min="1"
              max="99"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">概要</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={saving}
            className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-16 h-20 object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-20 bg-indigo-50 rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📖</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{book.author}</p>
        <p className="text-xs text-gray-400">{book.publisher}</p>
        <p className="text-xs text-gray-400 mt-1">所蔵 {copyCount}冊</p>
        {book.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {book.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {borrowedCount > 0 && (
            <>
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                貸出中 {borrowedCount}冊{borrowerNames ? `: ${borrowerNames}` : ''}
              </span>
              {isMyBook && (
                <button
                  onClick={handleReturn}
                  className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                >
                  返却する
                </button>
              )}
            </>
          )}
          {isAvailable ? (
            <>
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                在庫 {availableCount}冊
              </span>
              {!isMyBook && (
                <button
                  onClick={handleBorrow}
                  className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full hover:bg-indigo-600 transition-colors"
                >
                  借りる
                </button>
              )}
            </>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              在庫なし
            </span>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors ml-auto"
          >
            削除
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-300 hover:text-indigo-500 transition-colors"
          >
            編集
          </button>
        </div>
      </div>
    </div>
  )
}

function EditInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </div>
  )
}

function normalizeCopyCount(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.floor(value), 1), 99)
}
