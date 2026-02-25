export async function generateStoryCard(workout: {
  duration: number
  volume: number
  prs: string[]
  streak: number
  userName: string
}): Promise<string> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')!

    // Dark gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, 1920)
    grad.addColorStop(0, '#0a0a0a')
    grad.addColorStop(0.5, '#0d1117')
    grad.addColorStop(1, '#000')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1920)

    // Green accent lines
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(0, 0, 6, 1920)
    ctx.fillRect(1074, 0, 6, 1920)

    // FORC3 branding
    ctx.fillStyle = '#22c55e'
    ctx.font = '900 80px Arial'
    ctx.fillText('FORC3', 80, 180)

    // Duration
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 200px Arial'
    ctx.fillText(`${workout.duration}`, 80, 680)
    ctx.font = '400 52px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('MINUTES', 80, 760)

    // Volume
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 120px Arial'
    ctx.fillText(`${(workout.volume / 1000).toFixed(1)}K`, 80, 960)
    ctx.font = '400 52px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('LBS LIFTED', 80, 1040)

    // PRs
    if (workout.prs.length > 0) {
      ctx.fillStyle = '#fbbf24'
      ctx.font = '700 56px Arial'
      ctx.fillText(`NEW PR: ${workout.prs[0]}`, 80, 1200)
    }

    // Streak
    ctx.fillStyle = '#f97316'
    ctx.font = '700 56px Arial'
    ctx.fillText(`${workout.streak} Day Streak`, 80, 1320)

    // Bottom
    ctx.fillStyle = '#374151'
    ctx.font = '400 40px Arial'
    ctx.fillText(`@${workout.userName}`, 80, 1760)
    ctx.fillText('forc3.app', 80, 1820)

    resolve(canvas.toDataURL('image/png'))
  })
}

export async function generateWorkoutCard(workout: {
  name: string
  duration: number
  volume: number
  exercises: number
  sets: number
  prs: string[]
  streak: number
  userName: string
}): Promise<string> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const ctx = canvas.getContext('2d')!

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 630)
    grad.addColorStop(0, '#0a0a0a')
    grad.addColorStop(1, '#0d1117')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1200, 630)

    // Green top accent
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(0, 0, 1200, 4)

    // Branding
    ctx.fillStyle = '#22c55e'
    ctx.font = '700 28px Arial'
    ctx.fillText('FORC3', 60, 60)

    // Workout name
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 48px Arial'
    ctx.fillText(workout.name, 60, 140)

    // Stats
    ctx.fillStyle = '#9ca3af'
    ctx.font = '400 24px Arial'
    ctx.fillText(`${workout.duration} min  ·  ${workout.exercises} exercises  ·  ${workout.sets} sets`, 60, 190)

    // Volume
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 72px Arial'
    ctx.fillText(`${(workout.volume / 1000).toFixed(1)}K lbs`, 60, 340)

    // Streak
    ctx.fillStyle = '#f97316'
    ctx.font = '700 28px Arial'
    ctx.fillText(`${workout.streak} day streak`, 60, 420)

    // Username
    ctx.fillStyle = '#6b7280'
    ctx.font = '400 24px Arial'
    ctx.fillText(`@${workout.userName}  ·  forc3.app`, 60, 580)

    resolve(canvas.toDataURL('image/png'))
  })
}
