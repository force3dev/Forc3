"use strict";(()=>{var e={};e.id=6352,e.ids=[6352],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},64091:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>y,patchFetch:()=>f,requestAsyncStorage:()=>h,routeModule:()=>d,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var r={};n.r(r),n.d(r,{POST:()=>p,dynamic:()=>l});var a=n(49303),o=n(88716),s=n(60670),i=n(87070),c=n(61165),u=n(40740);let l="force-dynamic";async function p(e){let t=await (0,c.rc)();if(!t)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{message:n}=await e.json();if(!n?.trim())return i.NextResponse.json({error:"Message required"},{status:400});if(!process.env.ANTHROPIC_API_KEY)return i.NextResponse.json({error:"Coach not configured",message:"Add ANTHROPIC_API_KEY to .env to enable the AI coach."},{status:503});try{let e=await (0,u.nC)(t,n);return i.NextResponse.json({response:e})}catch(e){return console.error("Coach error:",e),i.NextResponse.json({error:"Coach unavailable. Try again shortly."},{status:500})}}let d=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/coach/chat/route",pathname:"/api/coach/chat",filename:"route",bundlePath:"app/api/coach/chat/route"},resolvedPagePath:"C:\\Users\\Geric\\Desktop\\forc3\\src\\app\\api\\coach\\chat\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:h,staticGenerationAsyncStorage:g,serverHooks:m}=d,y="/api/coach/chat/route";function f(){return(0,s.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},40740:(e,t,n)=>{n.d(t,{JY:()=>h,O1:()=>g,nC:()=>d});var r=n(80213),a=n(20728);function o(){let e=process.env.ANTHROPIC_API_KEY;if(!e)throw Error("ANTHROPIC_API_KEY not set");return new r.ZP({apiKey:e})}async function s(e){return a._.profile.findUnique({where:{userId:e}})}async function i(e,t){let n=new Date;return n.setDate(n.getDate()-t),a._.workoutLog.findMany({where:{userId:e,startedAt:{gte:n},completedAt:{not:null}},include:{workout:{select:{name:!0}},exerciseLogs:{include:{exercise:{select:{name:!0}},sets:{orderBy:{setNumber:"asc"}}}}},orderBy:{startedAt:"desc"},take:10})}async function c(e,t){let n=new Date;return n.setDate(n.getDate()-t),a._.nutritionLog.findMany({where:{userId:e,date:{gte:n}},orderBy:{date:"desc"},take:30})}async function u(e){return a._.trainingPlan.findUnique({where:{userId:e},include:{workouts:{include:{exercises:{include:{exercise:{select:{name:!0,muscleGroups:!0}}}}}}}})}function l(e){return 0===e.length?"No workouts logged in this period.":e.slice(0,5).map(e=>{let t=e.exerciseLogs.reduce((e,t)=>e+t.sets.reduce((e,t)=>e+t.weight*t.reps,0),0),n=e.exerciseLogs.slice(0,3).map(e=>{let t=e.sets.reduce((e,t)=>t.weight>(e?.weight||0)?t:e,e.sets[0]);return t?`${e.exercise.name}: ${t.weight}\xd7${t.reps}`:""}).filter(Boolean).join(", ");return`${new Date(e.startedAt).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}: ${e.workout?.name||"Workout"} | ${Math.round(t)} lbs | ${n}`}).join("\n")}async function p(e){let[t,n,r,a]=await Promise.all([s(e),i(e,14),c(e,7),u(e)]);return`You are FORC3 AI Coach — a world-class personal trainer and nutrition coach with PhD-level expertise in exercise science and sports nutrition.

## YOUR CLIENT
Name: ${t?.name||"Athlete"}
Goal: ${t?.goal||"general fitness"}
Experience: ${t?.experienceLevel||"intermediate"}
Training days: ${t?.trainingDays||4}/week
Equipment: ${t?.equipment||"full_gym"}
Injuries/Limitations: ${t?.injuries&&JSON.parse(t.injuries).join(", ")||"None"}
${t?.sport?`Sport focus: ${t.sport}`:""}

Stats:
- Weight: ${t?.weight?`${t.weight} ${t?.unitSystem==="imperial"?"lbs":"kg"}`:"not set"}
- Daily calorie target: ${t?.targetCalories?`${Math.round(t.targetCalories)} cal`:"not set"}
- Protein target: ${t?.targetProtein?`${Math.round(t.targetProtein)}g`:"not set"}

## CURRENT TRAINING PLAN
${a?`${a.name} — ${a.split} split
Week ${a.currentWeek} of mesocycle
${a.currentPhase?`Phase: ${a.currentPhase}`:""}`:"No plan yet — help them set one up."}

## RECENT PERFORMANCE (Last 2 weeks)
${l(n)}

## RECENT NUTRITION (Last 7 days)
${function(e){if(0===e.length)return"No nutrition logged.";let t={};for(let n of e){let e=n.date.toISOString().slice(0,10);t[e]||(t[e]={cals:0,protein:0}),t[e].cals+=n.calories,t[e].protein+=n.protein}return Object.entries(t).slice(0,5).map(([e,t])=>`${e}: ${Math.round(t.cals)} cal, ${Math.round(t.protein)}g protein`).join("\n")}(r)}

## YOUR COACHING STYLE
- Direct and concise — they're probably at the gym or on the go
- Evidence-based: cite real sports science principles when helpful
- Personalized: always reference THEIR actual numbers and data
- Motivating without being cheesy
- Specific: "add 5 lbs to your bench press" not "try going heavier"
- Flag concerning patterns (overtraining signs, undereating, etc.)

## RULES
1. Always reference their actual data when giving advice
2. If they ask about changing their plan, explain the WHY
3. Be specific with numbers — "aim for 180g protein" not "eat more protein"
4. Keep responses concise — 3-5 sentences unless they ask for detail
5. If you notice concerning patterns, flag them proactively`}async function d(e,t){let n=o(),r=await a._.coachMessage.findMany({where:{userId:e},orderBy:{createdAt:"desc"},take:10});r.reverse();let s=await p(e),i=[...r.map(e=>({role:e.role,content:e.content})),{role:"user",content:t}],c=await n.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:1024,system:s,messages:i}),u="text"===c.content[0].type?c.content[0].text:"";return await a._.coachMessage.createMany({data:[{userId:e,role:"user",content:t},{userId:e,role:"assistant",content:u}]}),u}async function h(e){let t=o(),n=await t.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:256,messages:[{role:"user",content:`Estimate the nutrition for this food/meal: "${e}"

Respond in JSON only (no markdown):
{
  "name": "cleaned up food name",
  "servingSize": "estimated serving (e.g., '1 cup', '200g', '1 piece')",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high" or "medium" or "low"
}

Be realistic. If it's a meal, estimate the whole thing. Round to whole numbers.`}]});return JSON.parse(("text"===n.content[0].type?n.content[0].text:"{}").replace(/```json\n?|\n?```/g,"").trim())}async function g(e,t,n){let r=o(),[a,c]=await Promise.all([s(e),i(e,7)]),u=l(c),p=await r.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:256,messages:[{role:"user",content:`Generate 2-3 short, personalized coaching tips for today's workout.

Workout: ${t}
Exercises: ${n.join(", ")}
Recent performance: ${u}
Goal: ${a?.goal||"general fitness"}
Experience: ${a?.experienceLevel||"intermediate"}

Rules:
- Specific to TODAY's exercises
- Reference actual numbers if available
- Keep each tip under 20 words
- Motivating but practical

Respond as JSON array only: ["tip 1", "tip 2", "tip 3"]`}]}),d=("text"===p.content[0].type?p.content[0].text:"[]").replace(/```json\n?|\n?```/g,"").trim();try{return JSON.parse(d)}catch{return["Focus on form today.","Push hard on your working sets.","Stay hydrated!"]}}},95456:(e,t,n)=>{n.d(t,{AX:()=>p,Gg:()=>l,Rf:()=>d,ed:()=>c});var r=n(86890),a=n(41463),o=n(71615);let s=new TextEncoder().encode(process.env.JWT_SECRET||process.env.NEXTAUTH_SECRET||"forc3-secret-key-change-in-production"),i="forc3_session";async function c(e){return await new r.N(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(s)}async function u(e){try{let{payload:t}=await (0,a._)(e,s);return t}catch{return null}}async function l(){let e=await (0,o.cookies)(),t=e.get(i)?.value;return t?u(t):null}function p(e){return{name:i,value:e,httpOnly:!0,secure:!0,sameSite:"lax",maxAge:2592e3,path:"/"}}function d(){return{name:i,value:"",httpOnly:!0,secure:!0,sameSite:"lax",maxAge:0,path:"/"}}},20728:(e,t,n)=>{n.d(t,{_:()=>a});let r=require("@prisma/client"),a=globalThis.prisma||new r.PrismaClient({log:["warn","error"]})},61165:(e,t,n)=>{n.d(t,{rc:()=>a});var r=n(95456);async function a(){let e=await (0,r.Gg)();return e?.userId??null}n(20728)}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),r=t.X(0,[8948,5972,3112,213],()=>n(64091));module.exports=r})();