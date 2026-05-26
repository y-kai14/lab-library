import type { Book, BookLoan } from '../types'

type LoanFields = Pick<
  Book,
  'copyCount' | 'loans' | 'borrowedBy' | 'borrowedByName' | 'borrowedAt'
>

export function getCopyCount(book: Pick<Book, 'copyCount'>) {
  return normalizeCopyCount(book.copyCount || 1)
}

export function getLoans(book: Partial<LoanFields>) {
  if (Array.isArray(book.loans) && book.loans.length > 0) {
    return book.loans.filter((loan): loan is BookLoan => Boolean(loan?.uid))
  }

  if (book.borrowedBy) {
    return [
      {
        uid: book.borrowedBy,
        displayName: book.borrowedByName || 'Unknown',
        borrowedAt: book.borrowedAt || '',
      },
    ]
  }

  return []
}

export function getAvailableCount(book: Partial<LoanFields>) {
  return Math.max(getCopyCount(book) - getLoans(book).length, 0)
}

export function getLegacyBorrowFields(loans: BookLoan[]) {
  const firstLoan = loans[0]
  return {
    borrowedBy: firstLoan?.uid || '',
    borrowedByName: firstLoan?.displayName || '',
    borrowedAt: firstLoan?.borrowedAt || '',
  }
}

function normalizeCopyCount(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.floor(value), 1), 99)
}
