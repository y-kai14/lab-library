import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import BookCard from '../components/BookCard'
import SearchBar from '../components/SearchBar'
import { useBooks } from '../hooks/useBooks'

export default function Books() {
  const { books, loading } = useBooks()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return books
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
    )
  }, [books, query])

  const availableCount = books.filter((b) => !b.borrowedBy).length

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">蔵書一覧</h2>
            <p className="text-sm text-gray-400">
              全{books.length}冊 / 在庫{availableCount}冊
            </p>
          </div>
          <Link
            to="/add"
            className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1"
          >
            ＋ 登録
          </Link>
        </div>

        <SearchBar value={query} onChange={setQuery} />

        {loading ? (
          <div className="text-center py-16 text-gray-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {query ? '検索結果がありません' : '蔵書がまだ登録されていません'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
