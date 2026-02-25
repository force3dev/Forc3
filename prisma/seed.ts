import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding FORC3 database...')

  // Create weekly challenges
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  await prisma.challenge.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Volume King', description: 'Lift 30,000 lbs this week', type: 'volume', target: 30000, unit: 'lbs', startDate: weekStart, endDate: weekEnd },
      { title: 'Run Club', description: 'Run 20km this week', type: 'distance', target: 20, unit: 'km', startDate: weekStart, endDate: weekEnd },
      { title: 'Consistency King', description: 'Train 5 days this week', type: 'frequency', target: 5, unit: 'days', startDate: weekStart, endDate: weekEnd },
    ]
  })

  console.log('Seeded weekly challenges')
  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
