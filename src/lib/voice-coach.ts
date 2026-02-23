'use client'

export class VoiceCoach {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private enabled = true

  constructor() {
    if (typeof window === 'undefined') return
    this.synth = window.speechSynthesis
    this.enabled = localStorage.getItem('voiceCoachEnabled') !== 'false'
    const load = () => {
      const voices = this.synth!.getVoices()
      this.voice =
        voices.find(v => v.lang === 'en-US' && v.localService) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] ||
        null
    }
    load()
    if (this.synth) this.synth.onvoiceschanged = load
  }

  speak(text: string, rate = 0.95, pitch = 1.0) {
    if (!this.synth || !this.enabled) return
    this.synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    if (this.voice) utterance.voice = this.voice
    utterance.rate = rate
    utterance.pitch = pitch
    this.synth.speak(utterance)
  }

  stop() {
    this.synth?.cancel()
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceCoachEnabled', String(enabled))
    }
    if (!enabled) this.stop()
  }

  isEnabled() {
    return this.enabled
  }

  // ─── Cardio cues ─────────────────────────────────────────────────────────────
  announceWarmup() {
    this.speak("Alright, let's warm up. Easy effort, get your body ready.")
  }

  announceMainSet(intervalsRemaining?: number) {
    const suffix = intervalsRemaining ? ` You've got ${intervalsRemaining} intervals.` : ''
    this.speak(`Main set. Push it now — this is what you trained for.${suffix}`)
  }

  announceRest(intervalsRemaining: number) {
    this.speak(`Rest. Recover. You've got ${intervalsRemaining} more intervals.`)
  }

  announceLastInterval() {
    this.speak("Last one! Give everything you've got.")
  }

  announceWorkoutComplete() {
    this.speak("That's a wrap. Great work today.")
  }

  // ─── Strength cues ────────────────────────────────────────────────────────────
  announceSet(setNumber: number, exerciseName: string) {
    this.speak(`Set ${setNumber}. ${exerciseName}. Let's go.`)
  }

  announceRestPeriod(seconds: number) {
    this.speak(`${seconds} seconds rest.`)
  }

  announceLastSet() {
    this.speak("Last set. Make it count.")
  }
}

// Singleton
let _voiceCoach: VoiceCoach | null = null
export function getVoiceCoach(): VoiceCoach {
  if (!_voiceCoach) _voiceCoach = new VoiceCoach()
  return _voiceCoach
}
