import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name) return NextResponse.json({ gifUrl: null })

  try {
    // First check our database
    const exercise = await prisma.exercise.findFirst({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          {
            slug: {
              contains: name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-'),
            },
          },
        ],
      },
      select: { gifUrl: true, name: true },
    })

    if (exercise?.gifUrl) {
      return NextResponse.json(
        { gifUrl: exercise.gifUrl },
        {
          headers: { 'Cache-Control': 'public, max-age=86400' },
        }
      )
    }

    // Fallback: try ExerciseDB API directly
    if (process.env.RAPIDAPI_KEY) {
      const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(
          name.toLowerCase()
        )}?limit=1`,
        {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
          },
          next: { revalidate: 86400 },
        }
      )

      if (res.ok) {
        const data = await res.json()
        if (data[0]?.gifUrl) {
          // Save to database for next time
          await prisma.exercise.updateMany({
            where: { name: { contains: name, mode: 'insensitive' } },
            data: { gifUrl: data[0].gifUrl },
          })

          return NextResponse.json(
            { gifUrl: data[0].gifUrl },
            {
              headers: { 'Cache-Control': 'public, max-age=86400' },
            }
          )
        }
      }
    }

    return NextResponse.json({ gifUrl: null })
  } catch {
    return NextResponse.json({ gifUrl: null })
  }
}
