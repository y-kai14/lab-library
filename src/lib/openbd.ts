interface OpenBDItem {
  summary: {
    isbn: string
    title: string
    author: string
    publisher: string
    cover: string
  }
  onix?: {
    CollateralDetail?: {
      TextContent?: Array<{
        Text?: string
      }>
    }
  }
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo?: {
      title?: string
      authors?: string[]
      publisher?: string
      description?: string
      imageLinks?: {
        thumbnail?: string
        smallThumbnail?: string
      }
    }
  }>
}

export interface BookLookupResult {
  title: string
  author: string
  publisher: string
  coverUrl: string
  description: string
  source: 'openbd' | 'google-books' | 'mixed' | 'none'
}

type PartialBookLookup = Partial<Omit<BookLookupResult, 'source'>>

export async function fetchBookByISBN(isbn: string): Promise<BookLookupResult | null> {
  const cleanIsbn = isbn.replace(/-/g, '').trim()
  try {
    const openbd = await fetchOpenBD(cleanIsbn)
    const google = await fetchGoogleBooks(cleanIsbn)
    const merged = mergeBookInfo(openbd, google)
    return merged.source === 'none' ? null : merged
  } catch {
    return null
  }
}

async function fetchOpenBD(isbn: string): Promise<PartialBookLookup | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`)
    if (!res.ok) return null

    const data: (OpenBDItem | null)[] = await res.json()
    const item = data[0]
    if (!item) return null

    return {
      title: item.summary.title || '',
      author: item.summary.author || '',
      publisher: item.summary.publisher || '',
      coverUrl: item.summary.cover || '',
      description: stripHtml(extractOpenBDDescription(item)),
    }
  } catch {
    return null
  }
}

async function fetchGoogleBooks(isbn: string): Promise<PartialBookLookup | null> {
  try {
    const url = new URL('https://www.googleapis.com/books/v1/volumes')
    url.searchParams.set('q', `isbn:${isbn}`)

    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
    if (apiKey) {
      url.searchParams.set('key', apiKey)
    }

    const res = await fetch(url)
    if (!res.ok) return null

    const data = (await res.json()) as GoogleBooksResponse
    const info = data.items?.[0]?.volumeInfo
    if (!info) return null

    return {
      title: info.title || '',
      author: info.authors?.join(', ') || '',
      publisher: info.publisher || '',
      coverUrl: normalizeImageUrl(
        info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || ''
      ),
      description: stripHtml(info.description || ''),
    }
  } catch {
    return null
  }
}

function mergeBookInfo(
  openbd: PartialBookLookup | null,
  google: PartialBookLookup | null
): BookLookupResult {
  const hasOpenBD = hasBookInfo(openbd)
  const hasGoogle = hasBookInfo(google)

  return {
    title: openbd?.title || google?.title || '',
    author: openbd?.author || google?.author || '',
    publisher: openbd?.publisher || google?.publisher || '',
    coverUrl: openbd?.coverUrl || google?.coverUrl || '',
    description: openbd?.description || google?.description || '',
    source: hasOpenBD && hasGoogle
      ? 'mixed'
      : hasOpenBD
        ? 'openbd'
        : hasGoogle
          ? 'google-books'
          : 'none',
  }
}

function hasBookInfo(info: PartialBookLookup | null) {
  return Boolean(
    info?.title ||
      info?.author ||
      info?.publisher ||
      info?.coverUrl ||
      info?.description
  )
}

function extractOpenBDDescription(item: OpenBDItem) {
  const textContent = item.onix?.CollateralDetail?.TextContent
  return textContent?.find((content) => content.Text)?.Text || ''
}

function normalizeImageUrl(url: string) {
  return url.replace(/^http:/, 'https:')
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
