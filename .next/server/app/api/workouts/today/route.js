"use strict";(()=>{var e={};e.id=8568,e.ids=[8568],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},22991:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>f,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>w,staticGenerationAsyncStorage:()=>y});var s={};r.r(s),r.d(s,{GET:()=>g,dynamic:()=>p});var n=r(49303),a=r(88716),o=r(60670),i=r(87070),c=r(61165),u=r(20728);async function l(e,t,r,s,n="imperial"){let a=new Map,o=r>1&&r%s==0;for(let r of t){let t=await u._.exerciseLog.findFirst({where:{exerciseId:r.exerciseId,workoutLog:{userId:e}},orderBy:{createdAt:"desc"},include:{sets:{orderBy:{setNumber:"asc"},where:{isWarmup:!1}}}}),s=function(e){let t=["quads","hamstrings","glutes","calves","legs"];return e.some(e=>t.includes(e.toLowerCase()))}(r.muscleGroups),i="metric"===n?s?2.5:1.25:s?10:5;if(!t||0===t.sets.length){a.set(r.exerciseId,{exerciseId:r.exerciseId,suggestedWeight:s?135:45,progressionType:"first_time",badge:null,reason:"First time — start light and focus on form"});continue}let c=t.sets,l=c[0]?.weight||45,d=c.length,p=c.every(e=>e.reps>=r.repsMax),g=c.every(e=>e.reps>=r.repsMin);if(o){let e=2.5*Math.round(.8*l/2.5);a.set(r.exerciseId,{exerciseId:r.exerciseId,suggestedWeight:e,progressionType:"deload",badge:"\uD83D\uDD04 Deload",reason:"Deload week — 80% of last weight, focus on recovery"});continue}if(p&&d>=r.sets){let e=l+i;a.set(r.exerciseId,{exerciseId:r.exerciseId,suggestedWeight:e,progressionType:"increase",badge:`⬆️ +${i} ${"metric"===n?"kg":"lbs"}`,reason:`Hit top of rep range last session — time to add weight`})}else g?a.set(r.exerciseId,{exerciseId:r.exerciseId,suggestedWeight:l,progressionType:"hold",badge:null,reason:"Making progress — keep same weight and aim for top of rep range"}):a.set(r.exerciseId,{exerciseId:r.exerciseId,suggestedWeight:l,progressionType:"hold",badge:"\uD83C\uDFAF Hold",reason:"Didn't hit minimum reps last session — keep this weight"})}return a}var d=r(40740);let p="force-dynamic";async function g(){try{let e=await (0,c.rc)();if(!e)return i.NextResponse.json({error:"Unauthorized"},{status:401});let t=await u._.trainingPlan.findUnique({where:{userId:e},include:{workouts:{orderBy:{order:"asc"},include:{exercises:{orderBy:{order:"asc"},include:{exercise:!0}}}}}});if(!t)return i.NextResponse.json({needsOnboarding:!0,error:"No plan found"},{status:404});let r=new Date;r.getDay(),r.getTime(),t.startedAt.getTime();let s=new Date(r);s.setDate(r.getDate()-(r.getDay()+6)%7),s.setHours(0,0,0,0);let n=new Date(r);n.setHours(0,0,0,0);let a=new Date(r);a.setHours(23,59,59,999);let o=await u._.workoutLog.findMany({where:{userId:e,startedAt:{gte:n,lte:a}}}),p=(await u._.workoutLog.findMany({where:{userId:e,startedAt:{gte:s},completedAt:{not:null}},orderBy:{startedAt:"asc"}})).length,g=p%t.workouts.length,m=t.workouts[g];if((p>=t.daysPerWeek||o.some(e=>null!==e.completedAt))&&!o.some(e=>null===e.completedAt))return i.NextResponse.json({isRestDay:!0,currentWeek:t.currentWeek,workoutsThisWeek:p,daysPerWeek:t.daysPerWeek,message:p>=t.daysPerWeek?"Weekly goal hit! Rest and recover.":"Rest day. Your muscles grow when you rest."});let h=await u._.profile.findUnique({where:{userId:e}}),y=h?.unitSystem||"imperial",w=m.exercises.map(e=>({exerciseId:e.exerciseId,name:e.exercise.name,sets:e.sets,repsMin:e.repsMin,repsMax:e.repsMax,muscleGroups:JSON.parse(e.exercise.muscleGroups||"[]")})),x=await l(e,w,t.currentWeek,t.deloadFrequency,y),f=await Promise.all(m.exercises.map(async t=>{let r=await u._.exerciseLog.findFirst({where:{exerciseId:t.exerciseId,workoutLog:{userId:e}},orderBy:{createdAt:"desc"},include:{sets:{orderBy:{setNumber:"asc"}}}}),s=r?.sets[0]?.weight||null,n=r?.sets?.map(e=>({reps:e.reps,weight:e.weight}))||[],a=x.get(t.exerciseId);return{id:t.id,exerciseId:t.exerciseId,name:t.exercise.name,sets:t.sets,repsMin:t.repsMin,repsMax:t.repsMax,rpe:t.rpe,restSeconds:t.restSeconds,muscleGroups:JSON.parse(t.exercise.muscleGroups||"[]"),lastWeight:s,lastSets:n,suggestedWeight:a?.suggestedWeight||s||null,progressionBadge:a?.badge||null,progressionReason:a?.reason||null}})),k=[];if(process.env.ANTHROPIC_API_KEY)try{k=await (0,d.O1)(e,m.name,f.map(e=>e.name))}catch{}return i.NextResponse.json({isRestDay:!1,currentWeek:t.currentWeek,workoutsThisWeek:p,daysPerWeek:t.daysPerWeek,workout:{id:m.id,name:m.name,order:m.order,exercises:f,coachingNotes:k},inProgressLog:o.find(e=>null===e.completedAt)?.id||null})}catch(e){return console.error("Today workout error:",e),i.NextResponse.json({error:"Failed to load workout"},{status:500})}}let m=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/workouts/today/route",pathname:"/api/workouts/today",filename:"route",bundlePath:"app/api/workouts/today/route"},resolvedPagePath:"C:\\Users\\Geric\\Desktop\\forc3\\src\\app\\api\\workouts\\today\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:y,serverHooks:w}=m,x="/api/workouts/today/route";function f(){return(0,o.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:y})}},40740:(e,t,r)=>{r.d(t,{JY:()=>g,O1:()=>m,nC:()=>p});var s=r(80213),n=r(20728);function a(){let e=process.env.ANTHROPIC_API_KEY;if(!e)throw Error("ANTHROPIC_API_KEY not set");return new s.ZP({apiKey:e})}async function o(e){return n._.profile.findUnique({where:{userId:e}})}async function i(e,t){let r=new Date;return r.setDate(r.getDate()-t),n._.workoutLog.findMany({where:{userId:e,startedAt:{gte:r},completedAt:{not:null}},include:{workout:{select:{name:!0}},exerciseLogs:{include:{exercise:{select:{name:!0}},sets:{orderBy:{setNumber:"asc"}}}}},orderBy:{startedAt:"desc"},take:10})}async function c(e,t){let r=new Date;return r.setDate(r.getDate()-t),n._.nutritionLog.findMany({where:{userId:e,date:{gte:r}},orderBy:{date:"desc"},take:30})}async function u(e){return n._.trainingPlan.findUnique({where:{userId:e},include:{workouts:{include:{exercises:{include:{exercise:{select:{name:!0,muscleGroups:!0}}}}}}}})}function l(e){return 0===e.length?"No workouts logged in this period.":e.slice(0,5).map(e=>{let t=e.exerciseLogs.reduce((e,t)=>e+t.sets.reduce((e,t)=>e+t.weight*t.reps,0),0),r=e.exerciseLogs.slice(0,3).map(e=>{let t=e.sets.reduce((e,t)=>t.weight>(e?.weight||0)?t:e,e.sets[0]);return t?`${e.exercise.name}: ${t.weight}\xd7${t.reps}`:""}).filter(Boolean).join(", ");return`${new Date(e.startedAt).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}: ${e.workout?.name||"Workout"} | ${Math.round(t)} lbs | ${r}`}).join("\n")}async function d(e){let[t,r,s,n]=await Promise.all([o(e),i(e,14),c(e,7),u(e)]);return`You are FORC3 AI Coach — a world-class personal trainer and nutrition coach with PhD-level expertise in exercise science and sports nutrition.

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
${n?`${n.name} — ${n.split} split
Week ${n.currentWeek} of mesocycle
${n.currentPhase?`Phase: ${n.currentPhase}`:""}`:"No plan yet — help them set one up."}

## RECENT PERFORMANCE (Last 2 weeks)
${l(r)}

## RECENT NUTRITION (Last 7 days)
${function(e){if(0===e.length)return"No nutrition logged.";let t={};for(let r of e){let e=r.date.toISOString().slice(0,10);t[e]||(t[e]={cals:0,protein:0}),t[e].cals+=r.calories,t[e].protein+=r.protein}return Object.entries(t).slice(0,5).map(([e,t])=>`${e}: ${Math.round(t.cals)} cal, ${Math.round(t.protein)}g protein`).join("\n")}(s)}

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
5. If you notice concerning patterns, flag them proactively`}async function p(e,t){let r=a(),s=await n._.coachMessage.findMany({where:{userId:e},orderBy:{createdAt:"desc"},take:10});s.reverse();let o=await d(e),i=[...s.map(e=>({role:e.role,content:e.content})),{role:"user",content:t}],c=await r.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:1024,system:o,messages:i}),u="text"===c.content[0].type?c.content[0].text:"";return await n._.coachMessage.createMany({data:[{userId:e,role:"user",content:t},{userId:e,role:"assistant",content:u}]}),u}async function g(e){let t=a(),r=await t.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:256,messages:[{role:"user",content:`Estimate the nutrition for this food/meal: "${e}"

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

Be realistic. If it's a meal, estimate the whole thing. Round to whole numbers.`}]});return JSON.parse(("text"===r.content[0].type?r.content[0].text:"{}").replace(/```json\n?|\n?```/g,"").trim())}async function m(e,t,r){let s=a(),[n,c]=await Promise.all([o(e),i(e,7)]),u=l(c),d=await s.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:256,messages:[{role:"user",content:`Generate 2-3 short, personalized coaching tips for today's workout.

Workout: ${t}
Exercises: ${r.join(", ")}
Recent performance: ${u}
Goal: ${n?.goal||"general fitness"}
Experience: ${n?.experienceLevel||"intermediate"}

Rules:
- Specific to TODAY's exercises
- Reference actual numbers if available
- Keep each tip under 20 words
- Motivating but practical

Respond as JSON array only: ["tip 1", "tip 2", "tip 3"]`}]}),p=("text"===d.content[0].type?d.content[0].text:"[]").replace(/```json\n?|\n?```/g,"").trim();try{return JSON.parse(p)}catch{return["Focus on form today.","Push hard on your working sets.","Stay hydrated!"]}}},95456:(e,t,r)=>{r.d(t,{AX:()=>d,Gg:()=>l,Rf:()=>p,ed:()=>c});var s=r(86890),n=r(41463),a=r(71615);let o=new TextEncoder().encode(process.env.JWT_SECRET||process.env.NEXTAUTH_SECRET||"forc3-secret-key-change-in-production"),i="forc3_session";async function c(e){return await new s.N(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(o)}async function u(e){try{let{payload:t}=await (0,n._)(e,o);return t}catch{return null}}async function l(){let e=await (0,a.cookies)(),t=e.get(i)?.value;return t?u(t):null}function d(e){return{name:i,value:e,httpOnly:!0,secure:!0,sameSite:"lax",maxAge:2592e3,path:"/"}}function p(){return{name:i,value:"",httpOnly:!0,secure:!0,sameSite:"lax",maxAge:0,path:"/"}}},20728:(e,t,r)=>{r.d(t,{_:()=>n});let s=require("@prisma/client"),n=globalThis.prisma||new s.PrismaClient({log:["warn","error"]})},61165:(e,t,r)=>{r.d(t,{rc:()=>n});var s=r(95456);async function n(){let e=await (0,s.Gg)();return e?.userId??null}r(20728)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,5972,3112,213],()=>r(22991));module.exports=s})();