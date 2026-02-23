// ─── Email Templates ──────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #000; color: #fff; max-width: 600px; margin: 0 auto; padding: 24px;
`

function wrap(content: string) {
  return `
    <!DOCTYPE html><html><body style="${BASE_STYLE}">
      <div style="margin-bottom:24px">
        <span style="font-size:12px;font-weight:900;letter-spacing:0.2em;color:#0066FF">⚡ FORC3</span>
      </div>
      ${content}
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #222;font-size:11px;color:#555">
        FORC3 · PhD-Level Coaching at App Prices · 
        <a href="https://forc3.app/settings" style="color:#555">Manage preferences</a>
      </div>
    </body></html>
  `
}

export function welcomeEmail(name: string) {
  return {
    subject: `Welcome to FORC3 — your program is ready 💪`,
    html: wrap(`
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Hey ${name}, welcome to FORC3.</h1>
      <p style="color:#aaa;font-size:16px;line-height:1.6;margin-bottom:24px">
        I'm Coach Alex — your personal hybrid athlete AI coach. I've built your first training week 
        based on your goals. Let's get to work.
      </p>
      <a href="https://forc3.app/dashboard" 
        style="display:inline-block;background:#0066FF;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px">
        See Your First Workout →
      </a>
      <div style="margin-top:32px;background:#141414;border:1px solid #222;border-radius:16px;padding:20px">
        <p style="font-size:13px;color:#888;margin-bottom:12px">What to expect this week:</p>
        <p style="font-size:14px;color:#ddd;line-height:1.8">
          ✅ Your personalized training schedule<br>
          ✅ Daily AI coaching check-ins<br>
          ✅ Workout logging + progress tracking<br>
          ✅ Adaptive program that evolves weekly
        </p>
      </div>
    `),
  }
}

export function day1Email(name: string) {
  return {
    subject: `Your first workout is waiting, ${name}`,
    html: wrap(`
      <h1 style="font-size:24px;font-weight:900">Your program is ready. Day 1 starts now.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        ${name}, your first workout is loaded and ready. The hardest part is just starting — 
        and you've already done that by signing up.
      </p>
      <a href="https://forc3.app/dashboard"
        style="display:inline-block;background:#00C853;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Start My First Workout →
      </a>
    `),
  }
}

export function day3Email(name: string, hasTrainedThisWeek: boolean) {
  if (hasTrainedThisWeek) {
    return {
      subject: `How's training going, ${name}?`,
      html: wrap(`
        <h1 style="font-size:24px;font-weight:900">You're killing it this week 🔥</h1>
        <p style="color:#aaa;font-size:15px;line-height:1.6">
          ${name}, you're already building momentum. Here's a preview of what's coming next week — 
          your program adapts based on how this week goes.
        </p>
        <a href="https://forc3.app/dashboard" style="display:inline-block;background:#0066FF;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
          View This Week →
        </a>
      `),
    }
  }
  return {
    subject: `How's training going, ${name}?`,
    html: wrap(`
      <h1 style="font-size:24px;font-weight:900">Life happens. Get back on track. 💪</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        ${name}, haven't seen you in a few days — totally normal. Here's a quick 20-min session 
        to get the momentum back. No pressure.
      </p>
      <a href="https://forc3.app/dashboard" style="display:inline-block;background:#0066FF;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Start a 20-Min Session →
      </a>
    `),
  }
}

export function weekOneEmail(name: string, stats: { workouts: number; streak: number; xp: number }) {
  return {
    subject: `One week in 🔥 Here's your progress`,
    html: wrap(`
      <h1 style="font-size:24px;font-weight:900">One week down, ${name}.</h1>
      <div style="display:flex;gap:16px;margin:20px 0">
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;flex:1;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#0066FF">${stats.workouts}</div>
          <div style="font-size:12px;color:#888">Workouts</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;flex:1;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#FF6B00">${stats.streak}🔥</div>
          <div style="font-size:12px;color:#888">Day Streak</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;flex:1;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#00C853">${stats.xp}</div>
          <div style="font-size:12px;color:#888">XP Earned</div>
        </div>
      </div>
      <p style="color:#aaa;font-size:14px">Unlock weekly AI recap, advanced analytics, and unlimited coaching with Premium.</p>
      <a href="https://forc3.app/upgrade" style="display:inline-block;background:#00C853;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:12px">
        Try Premium Free →
      </a>
    `),
  }
}

export function trialEndingEmail(name: string, daysLeft: number) {
  return {
    subject: `Your free trial ends in ${daysLeft} days`,
    html: wrap(`
      <h1 style="font-size:24px;font-weight:900">Your trial ends in ${daysLeft} days, ${name}</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        After your trial, you'll lose access to: unlimited AI coaching, adaptive weekly program, 
        race programming, nutrition AI, and recovery scores.
      </p>
      <a href="https://forc3.app/upgrade" style="display:inline-block;background:#00C853;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Keep Premium →
      </a>
      <p style="color:#555;font-size:12px;margin-top:12px">Cancel anytime. No questions asked.</p>
    `),
  }
}

export function weeklyRecapEmail(
  name: string,
  stats: { workouts: number; volume: number; streak: number; prs: number; recapText?: string }
) {
  return {
    subject: `Your week in training, ${name} 📊`,
    html: wrap(`
      <h1 style="font-size:24px;font-weight:900">Your week recap 📊</h1>
      ${stats.recapText ? `<p style="color:#ccc;font-size:15px;line-height:1.6;background:#141414;border-left:3px solid #0066FF;padding:16px;border-radius:8px;margin:20px 0">${stats.recapText}</p>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#0066FF">${stats.workouts}</div>
          <div style="font-size:12px;color:#888">Workouts</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#FF6B00">${stats.streak}🔥</div>
          <div style="font-size:12px;color:#888">Streak</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#00C853">${stats.prs}</div>
          <div style="font-size:12px;color:#888">New PRs</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900">${Math.round(stats.volume).toLocaleString()}</div>
          <div style="font-size:12px;color:#888">Total lbs</div>
        </div>
      </div>
      <a href="https://forc3.app/progress/weekly" style="display:inline-block;background:#0066FF;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none">
        Full Week Analysis →
      </a>
    `),
  }
}

export function streakAtRiskEmail(name: string, streakDays: number) {
  return {
    subject: `Don't break your ${streakDays} day streak 🔥`,
    html: wrap(`
      <h1 style="font-size:24px;font-weight:900">${streakDays} days. Don't stop now.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        ${name}, you haven't trained today and your ${streakDays}-day streak is at risk. 
        A quick 15-minute express session is all it takes to keep it alive.
      </p>
      <a href="https://forc3.app/workout/cardio" style="display:inline-block;background:#FF6B00;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Do a 15-Min Express Session →
      </a>
    `),
  }
}

export function prAchievementEmail(name: string, exercise: string, weight: number, reps: number) {
  return {
    subject: `New PR! You just got stronger 🏆`,
    html: wrap(`
      <h1 style="font-size:28px;font-weight:900">New personal record 🏆</h1>
      <div style="background:linear-gradient(135deg,#FFD700,#FF8C00);border-radius:16px;padding:24px;text-align:center;margin:20px 0">
        <div style="font-size:14px;font-weight:700;color:#000;opacity:0.7;margin-bottom:4px">${exercise}</div>
        <div style="font-size:40px;font-weight:900;color:#000">${weight} lbs × ${reps}</div>
      </div>
      <p style="color:#aaa;font-size:15px">${name}, you're getting stronger. Keep going.</p>
      <a href="https://forc3.app/progress" style="display:inline-block;background:#0066FF;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none">
        See All PRs →
      </a>
    `),
  }
}
