export interface Book {
  id: string
  title: string
  author: string
  publisher: string
  isbn?: string
  coverUrl?: string
  borrowedBy?: string
  borrowedByName?: string
  borrowedAt?: string
  createdAt: string
  createdBy: string
}

export interface User {
  uid: string
  email: string
  displayName?: string
}
