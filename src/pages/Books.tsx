import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import BookCard from '../components/BookCard'
import SearchBar from '../components/SearchBar'
import AiRecommender from '../components/AiRecommender'
import { useBooks } from '../hooks/useBooks'
import { getAvailableCount, getCopyCount } from '../lib/bookLoans'

export default function Books() {
  const { books, loading } = useBooks()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'search' | 'ai'>('search')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return books
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
    )
  }, [books, query])

  const totalCopies = books.reduce((sum, book) => sum + getCopyCount(book), 0)
  const availableCount = books.reduce(
    (sum, book) => sum + getAvailableCount(book),
    0
  )

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">蔵書一覧</h2>
            <p className="text-sm text-gray-400">
              全{totalCopies}冊 / 在庫{availableCount}冊
            </p>
          </div>
          <Link
            to="/add"
            className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1"
          >
            ＋ 登録
          </Link>
        </div>

        {/* 検索・AI本探し切り替えタブ */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/30 backdrop-blur-sm shadow-inner">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'search'
                ? 'bg-white text-indigo-600 shadow-sm hover:text-indigo-700'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🔍 通常検索
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-white text-indigo-600 shadow-sm hover:text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="text-xs">✨</span> AI本探し
          </button>
        </div>

        <div className={activeTab === 'search' ? "space-y-4" : "hidden"}>
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

        <div className={activeTab === 'ai' ? "" : "hidden"}>
          <AiRecommender books={books} />
        </div>
      </div>
    </Layout>
  )
}

