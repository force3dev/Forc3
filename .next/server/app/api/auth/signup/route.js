"use strict";(()=>{var e={};e.id=3654,e.ids=[3654,3538],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6113:e=>{e.exports=require("crypto")},6005:e=>{e.exports=require("node:crypto")},5655:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>m,patchFetch:()=>v,requestAsyncStorage:()=>f,routeModule:()=>g,serverHooks:()=>y,staticGenerationAsyncStorage:()=>h});var o={};r.r(o),r.d(o,{POST:()=>x});var i=r(49303),s=r(88716),n=r(60670),a=r(87070),p=r(42023),d=r(13538),l=r(95456);process.env.STRIPE_PRO_PRICE_ID,process.env.STRIPE_ELITE_PRICE_ID;var c=r(20471),u=r(90477);async function x(e){try{let t;let{email:r,password:o,referralCode:i}=await e.json();if(!r||!o)return a.NextResponse.json({error:"Email and password required"},{status:400});if(o.length<8)return a.NextResponse.json({error:"Password must be at least 8 characters"},{status:400});if(!/\d/.test(o))return a.NextResponse.json({error:"Password must contain at least 1 number"},{status:400});if(await d.prisma.user.findUnique({where:{email:r}}))return a.NextResponse.json({error:"An account with this email already exists"},{status:409});let s=await (0,p.hash)(o,12),n=function(e){let t=e.slice(0,3).toUpperCase().replace(/[^A-Z]/g,"X"),r=Math.random().toString(36).substring(2,7).toUpperCase();return`${t}${r}`}(r),x=7;if(i){let e=await d.prisma.user.findUnique({where:{referralCode:i}});e&&(t=e.id,x=14)}let g=await d.prisma.user.create({data:{email:r,passwordHash:s,referralCode:n,referredBy:i||null,profile:{create:{onboardingDone:!1}},subscription:{create:{tier:"free",status:"active",trialEnd:new Date(Date.now()+864e5*x)}},streak:{create:{currentStreak:0,longestStreak:0}}}});t&&await d.prisma.referral.create({data:{referrerId:t,referredId:g.id,referralCode:i,status:"signed_up"}}).catch(()=>{});let{subject:f,html:h}=(0,u.FG)(r.split("@")[0]);(0,c.C)({to:r,subject:f,html:h}).catch(()=>{});let y=await (0,l.ed)({userId:g.id,email:g.email,onboardingDone:!1}),m=a.NextResponse.json({success:!0});return m.cookies.set((0,l.AX)(y)),m}catch(e){return console.error("Signup error:",e),a.NextResponse.json({error:"Failed to create account"},{status:500})}}let g=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/signup/route",pathname:"/api/auth/signup",filename:"route",bundlePath:"app/api/auth/signup/route"},resolvedPagePath:"C:\\Users\\Geric\\Desktop\\forc3\\src\\app\\api\\auth\\signup\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:f,staticGenerationAsyncStorage:h,serverHooks:y}=g,m="/api/auth/signup/route";function v(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:h})}},95456:(e,t,r)=>{r.d(t,{AX:()=>c,Gg:()=>l,Rf:()=>u,ed:()=>p});var o=r(86890),i=r(41463),s=r(71615);let n=new TextEncoder().encode(process.env.JWT_SECRET||process.env.NEXTAUTH_SECRET||"forc3-secret-key-change-in-production"),a="forc3_session";async function p(e){return await new o.N(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(n)}async function d(e){try{let{payload:t}=await (0,i._)(e,n);return t}catch{return null}}async function l(){let e=await (0,s.cookies)(),t=e.get(a)?.value;return t?d(t):null}function c(e){return{name:a,value:e,httpOnly:!0,secure:!0,sameSite:"lax",maxAge:2592e3,path:"/"}}function u(){return{name:a,value:"",httpOnly:!0,secure:!0,sameSite:"lax",maxAge:0,path:"/"}}},90477:(e,t,r)=>{r.d(t,{FG:()=>s,HL:()=>n,l7:()=>a});let o=`
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
  `}function s(e){return{subject:`Welcome to FORC3 — your program is ready 💪`,html:i(`
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
    `)}}function a(e,t){return{subject:`Don't break your ${t} day streak 🔥`,html:i(`
      <h1 style="font-size:24px;font-weight:900">${t} days. Don't stop now.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.6">
        ${e}, you haven't trained today and your ${t}-day streak is at risk. 
        A quick 15-minute express session is all it takes to keep it alive.
      </p>
      <a href="https://forc3.app/workout/cardio" style="display:inline-block;background:#FF6B00;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px">
        Do a 15-Min Express Session →
      </a>
    `)}}},20471:(e,t,r)=>{r.d(t,{C:()=>s});var o=r(82591);let i=null;async function s({to:e,subject:t,html:r}){if(!process.env.RESEND_API_KEY){console.warn("[email] RESEND_API_KEY not set, skipping email to",e);return}await (i||(i=new o.R(process.env.RESEND_API_KEY)),i).emails.send({from:process.env.FROM_EMAIL||"coach@forc3.app",to:e,subject:t,html:r})}},13538:(e,t,r)=>{r.d(t,{prisma:()=>i});var o=r(53524);let i=globalThis.prisma||new o.PrismaClient({log:["warn","error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972,3112,2591,2023],()=>r(5655));module.exports=o})();