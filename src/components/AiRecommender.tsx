import { useState } from 'react'
import type { Book } from '../types'
import { recommendBooks, isGeminiEnabled } from '../lib/gemini'
import { useAuth } from '../hooks/useAuth'
import { useBooks } from '../hooks/useBooks'
import {
  getAvailableCount,
  getCopyCount,
  getLegacyBorrowFields,
  getLoans,
} from '../lib/bookLoans'

interface Props {
  books: Book[]
}

interface RecommendedBookItem {
  book: Book
  reason: string
}

type LoanUser = {
  uid: string
  email: string | null
  displayName: string | null
}

export default function AiRecommender({ books }: Props) {
  const { user } = useAuth()
  const { borrowBook, returnBook } = useBooks()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RecommendedBookItem[]>([])
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // APIキーが利用可能かどうか
  const geminiAvailable = isGeminiEnabled()

  // クイック入力用のタグ
  const quickTags = [
    '💻 プログラミングの基礎を学びたい',
    '📊 データ分析・機械学習の入門書',
    '📝 論文の書き方や研究の進め方',
    '💡 アイデア発想や創造力を高める本',
    '☕ 息抜きに読める面白い読み物',
    '📈 モチベーションを高めたい',
  ]

  const handleQuickTagClick = (tagText: string) => {
    // 絵文字と先頭のスペースを取り除く
    const cleanTag = tagText.replace(/^[\p{Emoji}\s]+/u, '')
    setQuery(cleanTag)
    handleSearch(cleanTag)
  }

  const handleSearch = async (searchQuery: string = query) => {
    const q = searchQuery.trim()
    if (!q) return

    setLoading(true)
    setError('')
    setResults([])
    setHasSearched(true)

    try {
      const recommendations = await recommendBooks(books, q)

      // 推薦されたIDに一致する実書籍データをマッピング
      const mappedResults: RecommendedBookItem[] = recommendations
        .map((rec) => {
          const matchedBook = books.find((b) => b.id === rec.bookId)
          if (!matchedBook) return null
          return {
            book: matchedBook,
            reason: rec.reason,
          }
        })
        .filter((item): item is RecommendedBookItem => item !== null)

      setResults(mappedResults)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'AI推薦の取得中にエラーが発生しました。'
      )
    } finally {
      setLoading(false)
    }
  }

  // 推薦された本カード用の個別「借りる」「返却する」ハンドラー
  const handleBorrow = async (bookId: string) => {
    if (!user) return
    try {
      await borrowBook(
        bookId,
        user.uid,
        user.displayName || user.email || 'Unknown'
      )
      // ローカルのresultsステート内にある対象本オブジェクトの borrowedBy を更新してリアクティブにする
      setResults((prev) =>
        prev.map((item) =>
          item.book.id === bookId ? addLocalLoan(item, user) : item
        )
      )
    } catch (e) {
      alert('貸出処理に失敗しました。')
    }
  }

  const handleReturn = async (bookId: string) => {
    if (!user) return
    try {
      await returnBook(bookId, user.uid)
      // ローカルのresultsステート内にある対象本オブジェクトの borrowedBy を更新してリアクティブにする
      setResults((prev) =>
        prev.map((item) =>
          item.book.id === bookId ? removeLocalLoan(item, user.uid) : item
        )
      )
    } catch (e) {
      alert('返却処理に失敗しました。')
    }
  }

  // APIキーが無い場合のプレースホルダーUI
  if (!geminiAvailable) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-3xl">
          🔑
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="font-bold text-gray-800 text-lg">AI機能が有効になっていません</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            AI推薦機能を利用するには、Gemini APIキーの設定が必要です。
            プロジェクトのルートディレクトリにある <code className="bg-red-100/80 px-1.5 py-0.5 rounded text-red-700 font-mono text-xs">.env.local</code> ファイルに以下を追加し、アプリを再起動してください。
          </p>
          <pre className="bg-gray-800 text-gray-200 rounded-lg p-3 text-xs text-left overflow-x-auto font-mono mt-3">
            VITE_GEMINI_API_KEY=your_gemini_api_key_here
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* イントロダクション＆入力エリア */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        {/* 背景の装飾的な光輪 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">✨</span>
            <h2 className="text-xl font-bold tracking-tight">AI本探しアシスタント</h2>
          </div>
          <p className="text-sm text-indigo-100 leading-relaxed max-w-xl">
            研究室の全蔵書から、あなたが「今やりたいこと」や「学びたい分野」にぴったりの本をAIが探し出し、推薦理由とともに提案します。
          </p>

          {/* 入力フォーム */}
          <div className="flex gap-2 mt-4 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="例: Pythonでデータ分析を始めたい、読み物として面白いSF小説..."
              disabled={loading}
              className="flex-1 bg-transparent text-white placeholder-indigo-200/70 border-none outline-none px-3 py-2 text-sm focus:ring-0"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="bg-white text-indigo-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  探索中
                </>
              ) : (
                '提案してもらう'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* クイックタグ */}
      {!hasSearched && !loading && (
        <div className="space-y-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            例えばこんな要望から探せます
          </h4>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickTagClick(tag)}
                className="text-xs bg-indigo-50 text-indigo-600 px-3.5 py-2 rounded-full font-medium border border-indigo-100/50 hover:bg-indigo-100/80 transition-all hover:scale-105 active:scale-95 duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm flex gap-2">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* ローディング・スケルトン UI */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm animate-pulse"
            >
              {/* AIコメントスケルトン */}
              <div className="bg-indigo-50/50 rounded-xl p-4 space-y-2">
                <div className="h-3.5 w-1/4 bg-indigo-200 rounded"></div>
                <div className="h-3 w-5/6 bg-indigo-100 rounded"></div>
                <div className="h-3 w-4/6 bg-indigo-100 rounded"></div>
              </div>
              {/* 書籍カードスケルトン */}
              <div className="flex gap-4">
                <div className="w-16 h-20 bg-gray-200 rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 検索結果 */}
      {hasSearched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-700 flex items-center gap-1.5">
              <span>🪄</span> AIのおすすめ書籍 ({results.length}件)
            </h3>
            <button
              onClick={() => {
                setHasSearched(false)
                setResults([])
                setQuery('')
              }}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              リセット
            </button>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm space-y-3">
              <span className="text-4xl block">🧐</span>
              <p className="text-sm font-medium">ご要望に合う本が見つかりませんでした。</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                蔵書データに類似する本がないか、本の概要のキーワードが不足している可能性があります。表現を変えて検索してみてください。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(({ book, reason }) => {
                const loans = getLoans(book)
                const borrowedCount = loans.length
                const availableCount = getAvailableCount(book)
                const isAvailable = availableCount > 0
                const isMyBook = loans.some((loan) => loan.uid === user?.uid)
                const borrowerNames = loans.map((loan) => loan.displayName).join(', ')
                const copyCount = getCopyCount(book)

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-indigo-100/80 p-5 shadow-lg shadow-indigo-50/40 space-y-4 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative group overflow-hidden"
                  >
                    {/* 装飾用：AIおすすめを示す上部の輝きライン */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    {/* AIの推薦理由（ふきだし風） */}
                    <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/40 border border-indigo-100/40 rounded-xl p-4 relative">
                      <div className="text-xs font-bold text-indigo-700 flex items-center gap-1 mb-1">
                        <span>✨</span> AIの推薦理由
                      </div>
                      <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                        {reason}
                      </p>
                    </div>

                    {/* 書籍の基本情報 */}
                    <div className="flex gap-4 items-start">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded-lg shadow-sm border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-100/50">
                          <span className="text-2xl">📖</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {book.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{book.publisher}</p>
                        <p className="text-[10px] text-gray-400 mt-1">所蔵 {copyCount}冊</p>
                        {book.description && (
                          <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed bg-gray-50/60 p-2 rounded-lg">
                            {book.description}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {borrowedCount > 0 && (
                            <>
                              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                貸出中 {borrowedCount}冊{borrowerNames ? `: ${borrowerNames}` : ''}
                              </span>
                              {isMyBook && (
                                <button
                                  onClick={() => handleReturn(book.id)}
                                  className="text-xs bg-green-500 text-white px-3.5 py-1 rounded-full hover:bg-green-600 transition-colors font-medium shadow-sm hover:shadow active:scale-95 duration-100"
                                >
                                  返却する
                                </button>
                              )}
                            </>
                          )}
                          {isAvailable ? (
                            <>
                              <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                                在庫 {availableCount}冊
                              </span>
                              {!isMyBook && (
                                <button
                                  onClick={() => handleBorrow(book.id)}
                                  className="text-xs bg-indigo-600 text-white px-3.5 py-1 rounded-full hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow active:scale-95 duration-100"
                                >
                                  借りる
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              在庫なし
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function addLocalLoan(item: RecommendedBookItem, user: LoanUser) {
  const loans = getLoans(item.book)
  if (loans.some((loan) => loan.uid === user.uid) || getAvailableCount(item.book) <= 0) {
    return item
  }

  const nextLoans = [
    ...loans,
    {
      uid: user.uid,
      displayName: user.displayName || user.email || 'Unknown',
      borrowedAt: new Date().toISOString(),
    },
  ]

  return {
    ...item,
    book: {
      ...item.book,
      loans: nextLoans,
      ...getLegacyBorrowFields(nextLoans),
    },
  }
}

function removeLocalLoan(item: RecommendedBookItem, uid: string) {
  const nextLoans = getLoans(item.book).filter((loan) => loan.uid !== uid)

  return {
    ...item,
    book: {
      ...item.book,
      loans: nextLoans,
      ...getLegacyBorrowFields(nextLoans),
    },
  }
}
