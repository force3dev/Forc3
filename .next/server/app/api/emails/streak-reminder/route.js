"use strict";(()=>{var e={};e.id=2195,e.ids=[2195,3538],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6005:e=>{e.exports=require("node:crypto")},59937:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>y,requestAsyncStorage:()=>g,routeModule:()=>x,serverHooks:()=>m,staticGenerationAsyncStorage:()=>f});var o={};r.r(o),r.d(o,{GET:()=>u,dynamic:()=>c});var i=r(49303),a=r(88716),n=r(60670),s=r(87070),p=r(13538),d=r(20471),l=r(90477);let c="force-dynamic";async function u(){let e=new Date;e.setHours(0,0,0,0);let t=await p.prisma.streak.findMany({where:{currentStreak:{gte:3},lastWorkoutDate:{lt:e}},include:{user:{include:{profile:!0}}},take:500}),r=0;for(let e of t)try{let t=e.user.profile?.name||e.user.email.split("@")[0],{subject:o,html:i}=(0,l.l7)(t,e.currentStreak);await (0,d.C)({to:e.user.email,subject:o,html:i}),r++}catch{}return s.NextResponse.json({sent:r})}let x=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/emails/streak-reminder/route",pathname:"/api/emails/streak-reminder",filename:"route",bundlePath:"app/api/emails/streak-reminder/route"},resolvedPagePath:"C:\\Users\\Geric\\Desktop\\forc3\\src\\app\\api\\emails\\streak-reminder\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:g,staticGenerationAsyncStorage:f,serverHooks:m}=x,h="/api/emails/streak-reminder/route";function y(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:f})}},90477:(e,t,r)=>{r.d(t,{FG:()=>a,HL:()=>n,l7:()=>s});let o=`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #000; color: #fff; max-width: 600px; margin: 0 auto; padding: 24px;
`;function i(e){return`
    <!DOCTYPE html><html><body style="${o}">
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
    `)}}function n(e,t){return{subject:`Your week in training, ${e} 📊`,html:i(`
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
    `)}}function s(e,t){return{subject:`Don't break your ${t} day streak 🔥`,html:i(`
      <h1 style="font-size:24px;font-weight:900">${t} days. Don't stop now.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        ${e}, you haven't trained today and your ${t}-day streak is at risk. 
        A quick 15-minute express session is all it takes to keep it alive.
      </p>
      <a href="https://forc3.app/workout/cardio" style="display:inline-block;background:#FF6B00;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Do a 15-Min Express Session →
      </a>
    `)}}},20471:(e,t,r)=>{r.d(t,{C:()=>a});var o=r(82591);let i=null;async function a({to:e,subject:t,html:r}){if(!process.env.RESEND_API_KEY){console.warn("[email] RESEND_API_KEY not set, skipping email to",e);return}await (i||(i=new o.R(process.env.RESEND_API_KEY)),i).emails.send({from:process.env.FROM_EMAIL||"coach@forc3.app",to:e,subject:t,html:r})}},13538:(e,t,r)=>{r.d(t,{prisma:()=>i});var o=r(53524);let i=globalThis.prisma||new o.PrismaClient({log:["warn","error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972,2591],()=>r(59937));module.exports=o})();