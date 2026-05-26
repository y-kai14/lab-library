import type { Book } from '../types'

export interface RecommendationResult {
  bookId: string
  reason: string
}

export interface AiRecommendResponse {
  recommendations: RecommendationResult[]
}

const getApiKey = () => {
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
}

export const isGeminiEnabled = () => {
  return getApiKey().trim().length > 0
}

/**
 * 登録されている書籍リストとユーザーの入力から、Gemini API を用いて推薦する書籍を決定します。
 */
export async function recommendBooks(
  books: Book[],
  userQuery: string
): Promise<RecommendationResult[]> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'Gemini APIキーが設定されていません。.env.local ファイルに VITE_GEMINI_API_KEY を設定してください。'
    )
  }

  if (books.length === 0) {
    return []
  }

  // Gemini API の初期化
  // @google/generative-ai v0.x / v1.x では以下のように初期化します
  // import { GoogleGenAI } もしくは import { GoogleGenerativeAI } from '@google/generative-ai'
  // 最新の SDK に合わせて GoogleGenerativeAI を使用します。
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)

  // 最新で最も高速かつ推薦性能の高い 'gemini-1.5-flash' または 'gemini-2.0-flash' を使用
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  // LLM に渡す書籍の情報を最小限にトリミングしてコンテキストサイズと応答速度を最適化
  const bookContexts = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    description: b.description || '概要なし',
    status: b.borrowedBy ? '貸出中' : '在庫あり',
  }))

  const prompt = `
あなたは研究室の優秀な図書AIアシスタントです。
登録されている蔵書リストと、ユーザーの要望（読みたい本、やりたいこと、解決したい課題など）に基づいて、ユーザーに最も適した本を最大3冊まで推薦してください。

推薦する本は必ず「蔵書リスト」に存在する本の中から選んでください。該当する本が全くない場合は、空の配列を返してください。

必ず以下のJSON形式で回答を返してください。JSON以外の文章（挨拶や説明など）は一切含めないでください。

【出力フォーマット】
{
  "recommendations": [
    {
      "bookId": "推薦する本のID（蔵書リストのidと完全一致させてください）",
      "reason": "ユーザーの要望に対して、なぜこの本を推薦するのかの分かりやすい具体的な理由（日本語。2〜3文程度で親切に）"
    }
  ]
}

【蔵書リスト】
${JSON.stringify(bookContexts, null, 2)}

【ユーザーの要望】
${userQuery}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error('AIから空の返答がありました。')
    }

    const parsed = JSON.parse(text) as AiRecommendResponse
    if (!parsed || !Array.isArray(parsed.recommendations)) {
      return []
    }

    return parsed.recommendations
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error(
      error instanceof Error
        ? `AI推薦の取得中にエラーが発生しました: ${error.message}`
        : 'AI推薦の取得中に予期せぬエラーが発生しました。'
    )
  }
}
