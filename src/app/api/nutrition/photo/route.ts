import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from '@/lib/ai/models'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { imageBase64, mimeType = 'image/jpeg' } = await request.json()
    if (!imageBase64) return NextResponse.json({ error: 'Image required' }, { status: 400 })

    const message = await anthropic.messages.create({
      model: AI_MODELS.FAST,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              }
            },
            {
              type: 'text',
              text: `Analyze this meal photo and estimate the nutritional content.

Identify each food item visible, estimate portions, and provide a nutritional breakdown.

Respond in JSON format:
{
  "description": "Brief description of what you see",
  "items": [
    {"name": "Food item", "portion": "6 oz", "calories": 180, "protein": 35, "carbs": 0, "fat": 4}
  ],
  "totals": {"calories": 480, "protein": 45, "carbs": 42, "fat": 8},
  "confidence": "high|medium|low",
  "notes": "Any relevant nutrition notes"
}`
            }
          ]
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      parsed = null
    }

    if (!parsed) {
      return NextResponse.json({
        description: content,
        items: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        confidence: 'low',
        notes: 'Could not parse detailed breakdown'
      })
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Photo nutrition error:', error?.message)
    return NextResponse.json({ error: 'Could not analyze image' }, { status: 500 })
  }
}
