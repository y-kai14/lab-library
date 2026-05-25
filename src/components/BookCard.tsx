import type { Book } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useBooks } from '../hooks/useBooks'

interface Props {
  book: Book
}

export default function BookCard({ book }: Props) {
  const { user } = useAuth()
  const { borrowBook, returnBook, deleteBook } = useBooks()

  const isBorrowed = !!book.borrowedBy && book.borrowedBy !== ''
  const isMyBook = user?.uid === book.borrowedBy
  const copyCount = book.copyCount || 1

  const handleBorrow = async () => {
    if (!user) return
    await borrowBook(
      book.id,
      user.uid,
      user.displayName || user.email || 'Unknown'
    )
  }

  const handleReturn = async () => {
    await returnBook(book.id)
  }

  const handleDelete = async () => {
    if (!confirm(`「${book.title}」を削除しますか？`)) return
    await deleteBook(book.id)
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
          {isBorrowed ? (
            <>
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                貸出中: {book.borrowedByName}
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
          ) : (
            <>
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                在庫あり
              </span>
              <button
                onClick={handleBorrow}
                className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full hover:bg-indigo-600 transition-colors"
              >
                借りる
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors ml-auto"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
