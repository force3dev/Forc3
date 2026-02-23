"use strict";exports.id=740,exports.ids=[740],exports.modules={40740:(e,t,n)=>{n.d(t,{JY:()=>g,O1:()=>m,bD:()=>y,nC:()=>h});var r=n(80213),i=n(13538),a=n(77265);function o(){let e=process.env.CLAUDE_API_KEY;if(!e)throw Error("CLAUDE_API_KEY not set");return new r.ZP({apiKey:e})}async function s(e){return i.prisma.profile.findUnique({where:{userId:e}})}async function l(e,t){let n=new Date;return n.setDate(n.getDate()-t),i.prisma.workoutLog.findMany({where:{userId:e,startedAt:{gte:n},completedAt:{not:null}},include:{workout:{select:{name:!0}},exerciseLogs:{include:{exercise:{select:{name:!0}},sets:{orderBy:{setNumber:"asc"}}}}},orderBy:{startedAt:"desc"},take:10})}async function c(e,t){let n=new Date;return n.setDate(n.getDate()-t),i.prisma.nutritionLog.findMany({where:{userId:e,date:{gte:n}},orderBy:{date:"desc"},take:30})}async function u(e){return i.prisma.trainingPlan.findUnique({where:{userId:e},include:{workouts:{include:{exercises:{include:{exercise:{select:{name:!0,muscleGroups:!0}}}}}}}})}function d(e){return 0===e.length?"No workouts logged in this period.":e.slice(0,5).map(e=>{let t=e.exerciseLogs.reduce((e,t)=>e+t.sets.reduce((e,t)=>e+t.weight*t.reps,0),0),n=e.exerciseLogs.slice(0,3).map(e=>{let t=e.sets.reduce((e,t)=>t.weight>(e?.weight||0)?t:e,e.sets[0]);return t?`${e.exercise.name}: ${t.weight}\xd7${t.reps}`:""}).filter(Boolean).join(", ");return`${new Date(e.startedAt).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}: ${e.workout?.name||"Workout"} | ${Math.round(t)} lbs | ${n}`}).join("\n")}async function p(e){let[t,n,r,i]=await Promise.all([s(e),l(e,14),c(e,7),u(e)]),o=function(e){if(!e||!Array.isArray(e)||0===e.length)return"";let t=new Date;return e.map(e=>{let n=e.type?.replace(/_/g," ")||"event";if(e.date){let r=new Date(e.date),i=Math.max(0,Math.round((r.getTime()-t.getTime())/864e5));return`${n} — ${Math.round(i/7)} weeks away (${r.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})})`}return n}).join(", ")}(t?.raceGoals),p="";if(t?.raceGoals&&Array.isArray(t.raceGoals)){let e=t.raceGoals.filter(e=>e.date).map(e=>({type:e.type,days:Math.max(0,Math.round((new Date(e.date).getTime()-Date.now())/864e5))})).sort((e,t)=>e.days-t.days);if(e.length>0){let t=e[0];t.days<=21?p=`
⚠️ TAPER ALERT: Only ${t.days} days until ${t.type?.replace(/_/g," ")}. Recommend reducing volume 40-60%, maintaining some race-pace work, prioritizing sleep and fueling.`:t.days<=42&&(p=`
RACE APPROACHING: ${t.days} days to ${t.type?.replace(/_/g," ")}. Begin building race-specific fitness, practice race nutrition, reduce junk volume.`)}}return`You are Coach Alex — a world-class coach who works with EVERYONE: bodybuilders, powerlifters, endurance athletes, beginners, combat sports athletes, people losing weight, older adults, hybrid athletes, and more. You've trained Olympic athletes, Ironman champions, powerlifting record holders, and everyday people just getting started. You're direct, motivating, and real. You don't sugarcoat but you always believe in your athletes. You remember everything about your athletes and reference their history naturally. You speak like a human coach — casual but expert, encouraging but honest.

Rules for your communication style:
- Never say "Great question!" or robotic filler phrases
- Never use bullet points in conversational messages — speak naturally
- Reference their specific history when relevant: "Last Tuesday you hit X, today let's aim for Y"
- Call them by first name occasionally
- Be brief when brief is better — don't pad responses
- Celebrate wins genuinely, not over the top
- When they miss workouts, be real but understanding — not preachy
- Use occasional emphasis but not constantly
- Sound like a coach, not a chatbot

## YOUR CLIENT
Name: ${t?.name||"Athlete"}
Goal: ${t?.goal||"general fitness"}
Experience: ${t?.experienceLevel||"intermediate"}
Training days: ${t?.trainingDays||4}/week
Equipment: ${t?.equipment||"full_gym"}
Injuries/Limitations: ${t?.injuries&&JSON.parse(t.injuries).join(", ")||"None"}
${t?.sport?`Sport focus: ${t.sport}`:""}
${o?`
## RACE / EVENT GOALS
Training for: ${o}
Prioritize sport-specific cardio and taper as race approaches.${p}`:""}

Stats:
- Weight: ${t?.weight?`${t.weight} ${t?.unitSystem==="imperial"?"lbs":"kg"}`:"not set"}
- Daily calorie target: ${t?.targetCalories?`${Math.round(t.targetCalories)} cal`:"not set"}
- Protein target: ${t?.targetProtein?`${Math.round(t.targetProtein)}g`:"not set"}

## CURRENT TRAINING PLAN
${i?`${i.name} — ${i.split} split
Week ${i.currentWeek} of mesocycle
${i.currentPhase?`Phase: ${i.currentPhase}`:""}`:"No plan yet — help them set one up."}

## HYBRID WEEKLY SCHEDULE
${(()=>{try{if(!t)return"No profile data available.";let e=(0,a.dd)({goal:t.goal||"general",experienceLevel:t.experienceLevel||"intermediate",trainingDays:t.trainingDays||4,sport:t.sport||void 0,raceGoals:Array.isArray(t.raceGoals)?t.raceGoals:[],trainingVolume:t.trainingVolume||"intermediate"});return(0,a.ps)(e)}catch{return"Hybrid schedule unavailable."}})()}

## RECENT PERFORMANCE (Last 2 weeks)
${d(n)}

## RECENT NUTRITION (Last 7 days)
${function(e){if(0===e.length)return"No nutrition logged.";let t={};for(let n of e){let e=n.date.toISOString().slice(0,10);t[e]||(t[e]={cals:0,protein:0}),t[e].cals+=n.calories,t[e].protein+=n.protein}return Object.entries(t).slice(0,5).map(([e,t])=>`${e}: ${Math.round(t.cals)} cal, ${Math.round(t.protein)}g protein`).join("\n")}(r)}

## COACHING RULES
1. Always reference their actual data when giving advice
2. If they ask about changing their plan, explain the WHY
3. Be specific with numbers — "aim for 180g protein" not "eat more protein"
4. Keep responses concise — 3-5 sentences unless they ask for detail
5. If you notice concerning patterns, flag them proactively
6. Reference their upcoming race when relevant — connect today's training to their goal`}async function h(e,t){let n=o(),r=await i.prisma.coachMessage.findMany({where:{userId:e},orderBy:{createdAt:"desc"},take:10});r.reverse();let a=await p(e),s=[...r.map(e=>({role:e.role,content:e.content})),{role:"user",content:t}],l=await n.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:1024,system:a,messages:s}),c="text"===l.content[0].type?l.content[0].text:"";return await i.prisma.coachMessage.createMany({data:[{userId:e,role:"user",content:t},{userId:e,role:"assistant",content:c}]}),c}async function g(e){let t=o(),n=await t.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:256,messages:[{role:"user",content:`Estimate the nutrition for this food/meal: "${e}"

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

Be realistic. If it's a meal, estimate the whole thing. Round to whole numbers.`}]});return JSON.parse(("text"===n.content[0].type?n.content[0].text:"{}").replace(/```json\n?|\n?```/g,"").trim())}async function m(e,t,n){let r=o(),[i,a]=await Promise.all([s(e),l(e,7)]),c=d(a),u=await r.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:256,messages:[{role:"user",content:`Generate 2-3 short, personalized coaching tips for today's workout.

Workout: ${t}
Exercises: ${n.join(", ")}
Recent performance: ${c}
Goal: ${i?.goal||"general fitness"}
Experience: ${i?.experienceLevel||"intermediate"}

Rules:
- Specific to TODAY's exercises
- Reference actual numbers if available
- Keep each tip under 20 words
- Motivating but practical

Respond as JSON array only: ["tip 1", "tip 2", "tip 3"]`}]}),p=("text"===u.content[0].type?u.content[0].text:"[]").replace(/```json\n?|\n?```/g,"").trim();try{return JSON.parse(p)}catch{return["Focus on form today.","Push hard on your working sets.","Stay hydrated!"]}}async function y(e){let t=o(),n=e.equipment.length>0?e.equipment.join(", "):"bodyweight only",r=e.limitations.length>0?e.limitations.join(", "):"none",i=`You are Coach Alex, a world-class coach with expertise in:
- Strength training and powerlifting
- Bodybuilding and physique development
- Endurance sports (running, cycling, swimming, triathlon)
- Sport-specific conditioning (MMA, basketball, football, etc)
- Fat loss and body recomposition
- Beginner programming and movement fundamentals
- Advanced periodization and peaking
- Injury rehabilitation and prevention
- Longevity and general health fitness

You create fully personalized programs for anyone regardless of their goal.
You never use cookie-cutter templates — every program is built from scratch
based on the individual's specific situation.

ALWAYS return valid JSON in exactly this format:
{
  "programName": "string",
  "programDescription": "string",
  "weeklyStructure": [
    {
      "day": 1,
      "dayName": "Monday",
      "focus": "string",
      "type": "strength|cardio|hybrid|rest|active_recovery",
      "workout": {
        "name": "string",
        "exercises": [
          {
            "name": "string",
            "sets": number,
            "reps": "string",
            "rest": number,
            "tempo": "string",
            "notes": "string",
            "muscleGroups": ["string"],
            "equipment": "string"
          }
        ],
        "warmUp": "string",
        "coolDown": "string",
        "estimatedDuration": number,
        "coachNotes": "string"
      },
      "cardio": null
    }
  ],
  "coachMessage": "string",
  "progressionRules": "string",
  "keyFocusAreas": ["string"]
}

Return ONLY the JSON object with no markdown, no explanation, no other text.`,a=`Create a complete personalized training program for this athlete:

Name: ${e.name||"Athlete"}
Primary Goal: ${e.primaryGoal}
Custom Goal Description: ${e.customGoal||"N/A"}
Sport: ${e.sport||"N/A"}
Experience Level: ${e.experienceLevel}
Training Days Per Week: ${e.trainingDaysPerWeek}
Session Length: ${e.sessionLength} minutes
Available Equipment: ${n}
Physical Limitations: ${r}
Age: ${e.age||"Not specified"}
Weight: ${e.weight?`${e.weight} kg`:"Not specified"}
Height: ${e.height?`${e.height} cm`:"Not specified"}
Upcoming Race/Event: ${e.raceGoal||"None"}
Race Date: ${e.raceDate||"N/A"}
Additional Context: ${e.goalDescription||"None"}

Build them a complete ${e.trainingDaysPerWeek}-day training week that:
1. Perfectly matches their goal (NOT a generic program)
2. Uses ONLY their available equipment: ${n}
3. Avoids exercises that aggravate: ${r}
4. Is appropriate for their experience level: ${e.experienceLevel}
5. Fits within ${e.sessionLength} minutes per session
6. Includes specific coaching cues for each exercise
7. Has warm-up and cool-down for every workout day
8. Includes cardio where relevant to the goal

Goal-specific guidance:
- muscle_gain/bodybuilding: hypertrophy focus, 3-4 sets \xd7 8-12 reps, include isolation work
- strength/powerlifting: low reps (1-5), main lifts first, heavy accessories
- fat_loss: compound movements, metabolic circuits, integrate cardio
- complete_beginner: fundamental movement patterns, low volume, build confidence
- endurance: sport-specific cardio programming, 2x/week max strength
- sport_performance: explosive power, conditioning, sport-specific movements
- longevity: joint-friendly movements, mobility, sustainable training
- hybrid: balance strength and cardio based on days available
- triathlon: all three disciplines + strength support

Sunday should always be rest or active recovery.
Return only the JSON object.`,s=await t.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:4096,system:i,messages:[{role:"user",content:a}]}),l=("text"===s.content[0].type?s.content[0].text:"{}").replace(/```json\n?|\n?```/g,"").trim();try{return JSON.parse(l)}catch{throw Error("AI program generation returned invalid JSON")}}},77265:(e,t,n)=>{n.d(t,{$I:()=>u,dd:()=>c,ps:()=>d});var r=n(62643);function i(e){let t=r.zr.find(t=>t.id===e);if(!t)throw Error(`Cardio template not found: ${e}`);return t}function a(e){return{templateId:e.id,title:e.title,type:e.type,duration:e.duration,intensity:e.intensity}}function o(e,t){if(0===t)return!1;let n=e[t-1];return n.hasStrength&&!!n.strengthLabel&&/legs|lower|full/i.test(n.strengthLabel)}function s(e,t,n){let r=Array(7).fill(null);if(t>=6){let e=["Push A","Pull A","Legs A","Push B","Pull B","Legs B"];for(let t=0;t<6;t++)r[t]=e[t]}else if(5===t)r[0]="Push",r[1]="Pull",r[2]="Legs",r[3]="Upper",r[4]="Full Body";else if(4===t){r[0]="Upper A",r[2]="Lower A",r[3]="Upper B",r[5]="Lower B";let e=["Upper A","Lower A","Upper B","Lower B"];r.fill(null),[0,1,3,4].forEach((t,n)=>{r[t]=e[n]})}else 3===t?(r[0]="Full Body A",r[2]="Full Body B",r[4]="Full Body C"):2===t&&(r[0]="Upper",r[3]="Lower");return n.isPowerlifter&&r[5],r}let l=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];function c(e){let t,n,c;let u=function(e){let{sport:t,raceGoals:n}=e,r=n||[],i="triathlon"===t||r.some(e=>["sprint_tri","olympic_tri","half_ironman","full_ironman"].includes(e.type)),a="running"===t||r.some(e=>["5k_10k","half_marathon","full_marathon"].includes(e.type)),o="swimming"===t||r.some(e=>"swim_race"===e.type),s="cycling"===t||r.some(e=>"cycling_race"===e.type),l=r.some(e=>"ocr"===e.type),c=r.some(e=>"powerlifting"===e.type),u=Date.now(),d=r.filter(e=>e.date).map(e=>Math.max(0,Math.round((new Date(e.date).getTime()-u)/6048e5))),p=d.length>0?Math.min(...d):null,h="general";return i?h="triathlete":a?h="runner":o?h="swimmer":s?h="cyclist":l?h="ocr":t&&(h=t),{isTriathlete:i,isRunner:a,isSwimmer:o,isCyclist:s,isOCR:l,isPowerlifter:c,primarySport:h,weeksToRace:p,inTaper:null!==p&&p<=3,raceApproaching:null!==p&&p<=6}}(e),d=Math.min(e.trainingDays,5),p=function(e,t){let n=e.trainingVolume||"intermediate";return t.isTriathlete||t.isRunner?"advanced"===n?5:"intermediate"===n?4:3:t.isSwimmer||t.isCyclist?"advanced"===n?4:3:"endurance"===e.goal?4:"fat_loss"===e.goal?3:2}(e,u);u.isTriathlete?(t=function(e,t,n,r){let o=s(7,n,t),c=t.inTaper,u={0:a(i("run-easy")),1:a(i("swim-drills")),2:a(c?i("run-easy"):i("run-tempo")),3:a(c?i("bike-recovery"):i("bike-endurance")),4:a(i("swim-pull")),5:a(c?i("run-easy"):i("run-long")),6:null};return l.map((e,t)=>({day:e,dayIndex:t,hasStrength:!!o[t],strengthLabel:o[t]||void 0,cardio:u[t]||void 0,isRest:6===t,note:6===t?"Rest & recovery":c&&[3,5].includes(t)?"Taper week — keep intensity low":void 0}))}(0,u,d,0),n="triathlete",c=u.inTaper?"Taper week — reducing volume ahead of race":"Triathlon hybrid: swim, bike, run + strength"):u.isRunner?(t=function(e,t,n,r){let o=s(7,n,t),c=t.inTaper,u={0:a(i("run-easy")),1:a(c?i("run-easy"):i("run-400-intervals")),2:a(i("run-easy")),3:a(c?i("run-easy"):i("run-tempo")),4:a(i("run-easy")),5:a(c?i("run-easy"):i("run-long")),6:null};return r<5&&delete u[4],r<4&&delete u[2],l.map((e,n)=>({day:e,dayIndex:n,hasStrength:!!o[n],strengthLabel:o[n]||void 0,cardio:u[n]||void 0,isRest:6===n&&!u[6],note:t.raceApproaching&&5===n?"Key long run — race simulation pace":void 0}))}(0,u,d,p),n="runner",c=u.raceApproaching?"Race-specific run build + strength support":"Running hybrid: aerobic base + speed work + strength"):u.isSwimmer?(t=function(e,t,n,r){let o=s(7,n,t),c=t.inTaper,u={0:a(i("swim-drills")),1:null,2:a(c?i("swim-endurance"):i("swim-pull")),3:a(c?i("swim-drills"):i("swim-sprints")),4:a(i("swim-kick")),5:a(i("swim-endurance")),6:null};return r<4&&delete u[4],l.map((e,t)=>({day:e,dayIndex:t,hasStrength:!!o[t],strengthLabel:o[t]||void 0,cardio:u[t]||void 0,isRest:!u[t]&&!o[t]}))}(0,u,d,p),n="swimmer",c="Swimming hybrid: technique + strength + endurance"):u.isCyclist?(t=function(e,t,n,r){let o=s(7,n,t),c=t.inTaper,u={0:a(i("bike-recovery")),1:null,2:a(c?i("bike-recovery"):i("bike-threshold")),3:a(i("bike-endurance")),4:null,5:a(i("bike-endurance")),6:null};return l.map((e,t)=>({day:e,dayIndex:t,hasStrength:!!o[t],strengthLabel:o[t]||void 0,cardio:u[t]||void 0,isRest:!u[t]&&!o[t],note:5===t?"Long ride — aim for 60–90 min":void 0}))}(0,u,d,0),n="cyclist",c="Cycling hybrid: threshold + endurance + strength"):"endurance"===e.goal?(t=function(e,t){let n=s(7,t,{isTriathlete:!1}),r={0:a(i("run-easy")),1:null,2:a(i("run-800-repeats")),3:a(i("bike-endurance")),4:null,5:a(i("run-long")),6:a(i("bike-recovery"))};return l.map((e,t)=>({day:e,dayIndex:t,hasStrength:!!n[t],strengthLabel:n[t]||void 0,cardio:r[t]||void 0,isRest:!r[t]&&!n[t]}))}(0,d),n="endurance",c="Endurance-focused hybrid: aerobic volume + strength maintenance"):(t=function(e,t,n){let r=s(7,t,{}),c=[a(i("run-fartlek")),a(i("hiit-jump-rope-tabata")),a(i("row-steady-state")),a(i("bike-recovery")),a(i("run-easy"))],u=l.map((e,t)=>({day:e,dayIndex:t,hasStrength:!!r[t],strengthLabel:r[t]||void 0,cardio:void 0,isRest:!1})),d=0,p=[...c];for(let e=0;e<7&&d<n;e++)!u[e].hasStrength&&6!==e&&(o(u,e)?u[e].cardio=a(i("bike-recovery")):u[e].cardio=p[d%p.length],d++);return u.forEach(e=>{e.isRest=!e.hasStrength&&!e.cardio}),u}(0,d,p),n="general",c="General hybrid: strength-primary with cardio for conditioning");let h=(t=function(e){for(let t=0;t<e.length;t++){let n=e[t].cardio;if(n){if(function(e,t){let n=0;for(let r=t-1;r>=0;r--){let t=e[r].cardio;if(t&&("hard"===t.intensity||"max"===t.intensity))n++;else break}return n}(e,t)>=2&&("hard"===n.intensity||"max"===n.intensity)){let i=r.zr.find(e=>e.type===n.type&&"easy"===e.intensity)||r.zr.find(e=>"easy"===e.intensity);i&&(e[t].cardio=a(i),e[t].note=(e[t].note?e[t].note+" \xb7 ":"")+"Intensity reduced — recovery day")}if(o(e,t)&&"hard"===n.intensity){let o=r.zr.find(e=>e.type===n.type&&"easy"===e.intensity)||i("bike-recovery");e[t].cardio=a(o),e[t].note=(e[t].note?e[t].note+" \xb7 ":"")+"Easy cardio — recovery after heavy lift"}}}return e}(t)).reduce((e,t)=>e+(t.cardio?.duration||0),0),g=t.filter(e=>e.hasStrength).length;return{days:t,weeklyCardioMinutes:h,weeklyLiftDays:g,programType:n,description:c}}function u(e){let t=new Date().getDay(),n=0===t?6:t-1,r=e.days.find(e=>e.dayIndex===n);return r?.cardio||null}function d(e){let t=e.days.map(e=>{let t=[];return e.hasStrength&&t.push(`Lift (${e.strengthLabel})`),e.cardio&&t.push(`${e.cardio.title} [${e.cardio.intensity}]`),e.isRest&&0===t.length&&t.push("Rest"),`${e.day}: ${t.join(" + ")}`});return[`Program: ${e.description}`,`Weekly cardio: ${e.weeklyCardioMinutes} min | Lift days: ${e.weeklyLiftDays}`,"",...t].join("\n")}}};