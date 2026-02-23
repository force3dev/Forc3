export async function generateShareImage(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')

  // Dynamic import so the app doesn't crash if html2canvas isn't installed yet
  let html2canvas: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>
  try {
    const mod = await import('html2canvas')
    html2canvas = mod.default as typeof html2canvas
  } catch {
    throw new Error('html2canvas not installed. Run: npm install html2canvas')
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#000000',
    scale: 2,
    useCORS: true,
  })

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/png', 1.0)
  })
}

export async function shareImage(blob: Blob, text: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        text,
        files: [new File([blob], 'forc3-workout.png', { type: 'image/png' })],
      })
      return
    } catch {
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'forc3-workout.png'
  a.click()
  URL.revokeObjectURL(url)
}
