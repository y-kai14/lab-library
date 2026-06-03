export interface Book {
  id: string
  title: string
  author: string
  publisher: string
  isbn?: string
  coverUrl?: string
  description?: string
  copyCount?: number
  loans?: BookLoan[]
  borrowedBy?: string
  borrowedByName?: string
  borrowedAt?: string
  createdAt: string
  createdBy: string
}

export interface BookLoan {
  uid: string
  displayName: string
  borrowedAt: string
}

export interface User {
  uid: string
  email: string
  displayName?: string
}
