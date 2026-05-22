interface OpenBDItem {
  summary: {
    isbn: string
    title: string
    author: string
    publisher: string
    cover: string
  }
}

export async function fetchBookByISBN(isbn: string): Promise<{
  title: string
  author: string
  publisher: string
  coverUrl: string
} | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`)
    const data: (OpenBDItem | null)[] = await res.json()
    const item = data[0]
    if (!item) return null
    return {
      title: item.summary.title || '',
      author: item.summary.author || '',
      publisher: item.summary.publisher || '',
      coverUrl: item.summary.cover || '',
    }
  } catch {
    return null
  }
}
