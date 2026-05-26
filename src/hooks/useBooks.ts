import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Book } from '../types'
import { getAvailableCount, getLegacyBorrowFields, getLoans } from '../lib/bookLoans'

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBooks(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Book))
      )
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const addBook = async (data: Omit<Book, 'id' | 'createdAt'>) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    )
    await addDoc(collection(db, 'books'), {
      ...clean,
      createdAt: serverTimestamp(),
    })
  }

  const updateBook = async (id: string, data: Partial<Book>) => {
    await updateDoc(doc(db, 'books', id), data)
  }

  const deleteBook = async (id: string) => {
    await deleteDoc(doc(db, 'books', id))
  }

  const borrowBook = async (
    id: string,
    uid: string,
    displayName: string
  ) => {
    const bookRef = doc(db, 'books', id)
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(bookRef)
      if (!snapshot.exists()) throw new Error('Book not found')

      const book = { id: snapshot.id, ...snapshot.data() } as Book
      const loans = getLoans(book)
      if (loans.some((loan) => loan.uid === uid)) return
      if (getAvailableCount(book) <= 0) {
        throw new Error('No copies available')
      }

      const nextLoans = [
        ...loans,
        {
          uid,
          displayName,
          borrowedAt: new Date().toISOString(),
        },
      ]

      transaction.update(bookRef, {
        loans: nextLoans,
        ...getLegacyBorrowFields(nextLoans),
      })
    })
  }

  const returnBook = async (id: string, uid: string) => {
    const bookRef = doc(db, 'books', id)
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(bookRef)
      if (!snapshot.exists()) throw new Error('Book not found')

      const book = { id: snapshot.id, ...snapshot.data() } as Book
      const nextLoans = getLoans(book).filter((loan) => loan.uid !== uid)

      transaction.update(bookRef, {
        loans: nextLoans,
        ...getLegacyBorrowFields(nextLoans),
      })
    })
  }

  return { books, loading, addBook, updateBook, deleteBook, borrowBook, returnBook }
}
