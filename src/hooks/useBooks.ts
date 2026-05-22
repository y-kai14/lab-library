import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Book } from '../types'

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
    await updateDoc(doc(db, 'books', id), {
      borrowedBy: uid,
      borrowedByName: displayName,
      borrowedAt: new Date().toISOString(),
    })
  }

  const returnBook = async (id: string) => {
    await updateDoc(doc(db, 'books', id), {
      borrowedBy: '',
      borrowedByName: '',
      borrowedAt: '',
    })
  }

  return { books, loading, addBook, updateBook, deleteBook, borrowBook, returnBook }
}
