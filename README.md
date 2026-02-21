# FORC3 — restored build (Next.js App Router)

This is a restored, runnable scaffold of your latest FORC3 app with:
- Next.js 14 + App Router + TypeScript
- Tailwind CSS (dark UI baseline)
- Prisma + SQLite schema (Users, Profile, Workouts, Meals)
- Auth scaffolding (Credentials + NextAuth handlers set up; demo uses simple login route to keep setup minimal)
- Onboarding flow (goal, experience, sports, units) + AI plan stub
- Dashboard showing recent workouts & meals
- API routes: /api/user/*, /api/workouts, /api/nutrition
- Twilio + AI stubs ready to wire

## 1) Prereqs
- Node.js 18+
- npm (or pnpm/yarn)
- (Optional) SQLite browser: Prisma Studio

## 2) Setup
```bash
cp .env.example .env
# Generate a strong secret and paste into NEXTAUTH_SECRET
# mac/linux:  openssl rand -base64 32
```

## 3) Install & DB
```bash
npm install
npm run db:push
npm run db:studio   # optional
```

## 4) Run app & onboard
```bash
npm run dev
# visit http://localhost:3000/signup
# create account → onboarding → generate plan → dashboard
```

## 5) Useful scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run db:push`
- `npm run db:studio`

## 6) GitHub backup
```bash
git init
git add .
git commit -m "Restore: FORC3 scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/forc3.git
git push -u origin main
```
