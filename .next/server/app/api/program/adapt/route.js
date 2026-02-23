"use strict";(()=>{var e={};e.id=8659,e.ids=[8659,1165,3538],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},77476:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>w,requestAsyncStorage:()=>g,routeModule:()=>m,serverHooks:()=>h,staticGenerationAsyncStorage:()=>x});var s={};r.r(s),r.d(s,{POST:()=>d,dynamic:()=>l});var a=r(49303),n=r(88716),o=r(60670),i=r(87070),c=r(61165),u=r(13538),p=r(80213);let l="force-dynamic";async function d(e){let t=await (0,c.getCurrentUserId)();if(!t)return i.NextResponse.json({error:"Unauthorized"},{status:401});try{let e=function(){let e=process.env.CLAUDE_API_KEY;if(!e)throw Error("CLAUDE_API_KEY not set");return new p.ZP({apiKey:e})}(),[r,s,a]=await Promise.all([u.prisma.profile.findUnique({where:{userId:t}}),u.prisma.trainingPlan.findUnique({where:{userId:t},include:{workouts:{include:{exercises:{include:{exercise:{select:{name:!0}}}}}}}}),u.prisma.workoutLog.findMany({where:{userId:t,startedAt:{gte:new Date(Date.now()-6048e5)}},include:{exerciseLogs:{include:{exercise:{select:{name:!0}},sets:!0}}},orderBy:{startedAt:"desc"}})]);if(!s)return i.NextResponse.json({error:"No training plan found"},{status:404});let n=s.workouts.length,o=a.filter(e=>e.completedAt).length,c=[],l=[];for(let e of a)for(let t of e.exerciseLogs){let e=s.workouts.flatMap(e=>e.exercises).find(e=>e.exercise.name===t.exercise.name);e&&t.sets.length>0&&(t.sets.every(t=>t.reps>=(e.repsMin||8))?c.includes(t.exercise.name)||c.push(t.exercise.name):l.includes(t.exercise.name)||l.push(t.exercise.name))}let d=`You are Coach Alex. Adapt this athlete's program for next week based on last week's performance.

Current Program: ${s.name}
Athlete Goal: ${r?.goal||"general"}
Experience: ${r?.experienceLevel||"intermediate"}

Last Week's Performance:
- Workouts completed: ${o}/${n}
- Exercises where they hit all target reps: ${c.join(", ")||"none recorded"}
- Exercises where they struggled: ${l.join(", ")||"none recorded"}
- Recovery score: good (no health data available)

Current exercises:
${s.workouts.map(e=>`${e.name}: ${e.exercises.map(e=>e.exercise.name).join(", ")}`).join("\n")}

Adaptation rules:
- If completed all workouts: slightly increase volume (add 1 set or increase reps by 2)
- If missed workouts: keep same difficulty, focus on consistency
- Progress weights/volume where they hit all reps
- Modify or swap exercises they struggled with
- Keep the same overall structure unless there's a clear reason to change

Return a JSON object with adaptations:
{
  "adaptations": [
    {
      "workoutName": "string",
      "changes": [
        {
          "exerciseName": "string",
          "action": "increase_sets|increase_reps|swap|keep|reduce",
          "newSets": number,
          "newReps": "string",
          "reason": "string"
        }
      ]
    }
  ],
  "coachNote": "string",
  "weekFocus": "string"
}

Return only the JSON.`,m=await e.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:2048,messages:[{role:"user",content:d}]}),g=("text"===m.content[0].type?m.content[0].text:"{}").replace(/```json\n?|\n?```/g,"").trim(),x=JSON.parse(g);for(let e of x.adaptations||[]){let t=s.workouts.find(t=>t.name===e.workoutName);if(t)for(let r of e.changes||[]){if("keep"===r.action)continue;let e=t.exercises.find(e=>e.exercise.name===r.exerciseName);if(e&&("increase_sets"===r.action||"increase_reps"===r.action||"reduce"===r.action)){let{min:t,max:s}=function(e){let t=e?.match(/^(\d+)\s*[-–]\s*(\d+)$/);if(t)return{min:parseInt(t[1]),max:parseInt(t[2])};let r=e?.match(/^(\d+)$/);return r?{min:parseInt(r[1]),max:parseInt(r[1])}:{min:8,max:12}}(r.newReps||"8-12");await u.prisma.workoutExercise.update({where:{id:e.id},data:{sets:r.newSets||e.sets,repsMin:t,repsMax:s}})}}}return await u.prisma.trainingPlan.update({where:{userId:t},data:{currentWeek:{increment:1}}}),i.NextResponse.json({success:!0,adaptations:x,message:x.coachNote||"Program adapted for next week."})}catch(e){return console.error("Program adaptation error:",e),i.NextResponse.json({error:e instanceof Error?e.message:"Failed to adapt program"},{status:500})}}let m=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/program/adapt/route",pathname:"/api/program/adapt",filename:"route",bundlePath:"app/api/program/adapt/route"},resolvedPagePath:"C:\\Users\\Geric\\Desktop\\forc3\\src\\app\\api\\program\\adapt\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:g,staticGenerationAsyncStorage:x,serverHooks:h}=m,f="/api/program/adapt/route";function w(){return(0,o.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:x})}},95456:(e,t,r)=>{r.d(t,{AX:()=>l,Gg:()=>p,Rf:()=>d,ed:()=>c});var s=r(86890),a=r(41463),n=r(71615);let o=new TextEncoder().encode(process.env.JWT_SECRET||process.env.NEXTAUTH_SECRET||"forc3-secret-key-change-in-production"),i="forc3_session";async function c(e){return await new s.N(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(o)}async function u(e){try{let{payload:t}=await (0,a._)(e,o);return t}catch{return null}}async function p(){let e=await (0,n.cookies)(),t=e.get(i)?.value;return t?u(t):null}function l(e){return{name:i,value:e,httpOnly:!0,secure:!0,sameSite:"lax",maxAge:2592e3,path:"/"}}function d(){return{name:i,value:"",httpOnly:!0,secure:!0,sameSite:"lax",maxAge:0,path:"/"}}},13538:(e,t,r)=>{r.d(t,{prisma:()=>a});var s=r(53524);let a=globalThis.prisma||new s.PrismaClient({log:["warn","error"]})},61165:(e,t,r)=>{r.d(t,{getCurrentUserId:()=>a});var s=r(95456);async function a(){let e=await (0,s.Gg)();return e?.userId??null}r(13538)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,5972,3112,213],()=>r(77476));module.exports=s})();