"use strict";(()=>{var e={};e.id=754,e.ids=[754,3538],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6005:e=>{e.exports=require("node:crypto")},71860:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>y,patchFetch:()=>m,requestAsyncStorage:()=>x,routeModule:()=>g,serverHooks:()=>h,staticGenerationAsyncStorage:()=>f});var r={};o.r(r),o.d(r,{GET:()=>u,dynamic:()=>c});var i=o(49303),a=o(88716),s=o(60670),n=o(87070),p=o(13538),l=o(20471),d=o(90477);let c="force-dynamic";async function u(){let e=new Date(Date.now()-6048e5),t=await p.prisma.user.findMany({include:{profile:!0,streak:!0,workoutLogs:{where:{completedAt:{gte:e}},include:{exerciseLogs:{include:{sets:!0}}}},personalRecords:{where:{achievedAt:{gte:e}}}},take:1e3}),o=0;for(let e of t)if(0!==e.workoutLogs.length)try{let t=e.profile?.name||e.email.split("@")[0],r=e.workoutLogs.reduce((e,t)=>e+t.exerciseLogs.reduce((e,t)=>e+t.sets.reduce((e,t)=>e+t.weight*t.reps,0),0),0),{subject:i,html:a}=(0,d.HL)(t,{workouts:e.workoutLogs.length,volume:r,streak:e.streak?.currentStreak||0,prs:e.personalRecords.length});await (0,l.C)({to:e.email,subject:i,html:a}),o++}catch{}return n.NextResponse.json({sent:o})}let g=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/emails/weekly-recap/route",pathname:"/api/emails/weekly-recap",filename:"route",bundlePath:"app/api/emails/weekly-recap/route"},resolvedPagePath:"C:\\Users\\Geric\\Desktop\\forc3\\src\\app\\api\\emails\\weekly-recap\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:x,staticGenerationAsyncStorage:f,serverHooks:h}=g,y="/api/emails/weekly-recap/route";function m(){return(0,s.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:f})}},90477:(e,t,o)=>{o.d(t,{FG:()=>a,HL:()=>s,l7:()=>n});let r=`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #000; color: #fff; max-width: 600px; margin: 0 auto; padding: 24px;
`;function i(e){return`
    <!DOCTYPE html><html><body style="${r}">
      <div style="margin-bottom:24px">
        <span style="font-size:12px;font-weight:900;letter-spacing:0.2em;color:#0066FF">⚡ FORC3</span>
      </div>
      ${e}
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #222;font-size:11px;color:#555">
        FORC3 \xb7 PhD-Level Coaching at App Prices \xb7 
        <a href="https://forc3.app/settings" style="color:#555">Manage preferences</a>
      </div>
    </body></html>
  `}function a(e){return{subject:`Welcome to FORC3 — your program is ready 💪`,html:i(`
      <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Hey ${e}, welcome to FORC3.</h1>
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
    `)}}function s(e,t){return{subject:`Your week in training, ${e} 📊`,html:i(`
      <h1 style="font-size:24px;font-weight:900">Your week recap 📊</h1>
      ${t.recapText?`<p style="color:#ccc;font-size:15px;line-height:1.6;background:#141414;border-left:3px solid #0066FF;padding:16px;border-radius:8px;margin:20px 0">${t.recapText}</p>`:""}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#0066FF">${t.workouts}</div>
          <div style="font-size:12px;color:#888">Workouts</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#FF6B00">${t.streak}🔥</div>
          <div style="font-size:12px;color:#888">Streak</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#00C853">${t.prs}</div>
          <div style="font-size:12px;color:#888">New PRs</div>
        </div>
        <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900">${Math.round(t.volume).toLocaleString()}</div>
          <div style="font-size:12px;color:#888">Total lbs</div>
        </div>
      </div>
      <a href="https://forc3.app/progress/weekly" style="display:inline-block;background:#0066FF;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none">
        Full Week Analysis →
      </a>
    `)}}function n(e,t){return{subject:`Don't break your ${t} day streak 🔥`,html:i(`
      <h1 style="font-size:24px;font-weight:900">${t} days. Don't stop now.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        ${e}, you haven't trained today and your ${t}-day streak is at risk. 
        A quick 15-minute express session is all it takes to keep it alive.
      </p>
      <a href="https://forc3.app/workout/cardio" style="display:inline-block;background:#FF6B00;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Do a 15-Min Express Session →
      </a>
    `)}}},20471:(e,t,o)=>{o.d(t,{C:()=>a});var r=o(82591);let i=null;async function a({to:e,subject:t,html:o}){if(!process.env.RESEND_API_KEY){console.warn("[email] RESEND_API_KEY not set, skipping email to",e);return}await (i||(i=new r.R(process.env.RESEND_API_KEY)),i).emails.send({from:process.env.FROM_EMAIL||"coach@forc3.app",to:e,subject:t,html:o})}},13538:(e,t,o)=>{o.d(t,{prisma:()=>i});var r=o(53524);let i=globalThis.prisma||new r.PrismaClient({log:["warn","error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[8948,5972,2591],()=>o(71860));module.exports=r})();