/**
 * AI Integration Layer for FORCE3
 * 
 * Currently uses deterministic plan generation.
 * Ready to integrate OpenAI/Claude API when keys are provided.
 */

import { generateTrainingPlan, savePlanToDatabase, type GeneratedPlan } from "./planEngine";

// Check if AI is available
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_ENABLED = !!OPENAI_API_KEY;

interface UserProfile {
  id: string;
  goal?: string | null;
  experience?: string | null;
  trainingDays?: string | null; // JSON string
  sports?: string | null; // JSON string
  eventType?: string | null;
  eventDate?: Date | null;
  injuries?: string | null; // JSON string
  injuryNotes?: string | null;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

/**
 * Generate a complete training plan for the user
 */
export async function generatePlan(userId: string, profile: UserProfile): Promise<{
  plan: GeneratedPlan;
  welcomeMessage: string;
}> {
  // Parse JSON fields
  const parsedProfile = {
    goal: profile.goal || 'maintenance',
    experience: profile.experience || 'intermediate',
    trainingDays: safeJsonParse<string[]>(profile.trainingDays, ['mon', 'wed', 'fri']),
    sports: safeJsonParse<string[]>(profile.sports, ['lifting']),
    eventType: profile.eventType || undefined,
    eventDate: profile.eventDate || undefined,
    injuries: safeJsonParse<string[]>(profile.injuries, []),
    age: profile.age || undefined,
    weightKg: profile.weightKg || undefined,
  };
  
  // Generate plan using the engine
  const plan = await generateTrainingPlan(parsedProfile);
  
  // Save to database
  await savePlanToDatabase(userId, plan);
  
  // If AI is enabled, enhance the welcome message
  let welcomeMessage = plan.aiWelcomeMessage;
  
  if (AI_ENABLED) {
    try {
      welcomeMessage = await generateAIWelcomeMessage(parsedProfile, plan);
    } catch (error) {
      console.error('AI welcome message generation failed, using default:', error);
    }
  }
  
  return { plan, welcomeMessage };
}

/**
 * Generate personalized welcome message using AI
 */
async function generateAIWelcomeMessage(
  profile: any,
  plan: GeneratedPlan
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return plan.aiWelcomeMessage;
  }
  
  const prompt = `You are FORCE3, a premium fitness coaching system. Write a brief, personalized welcome message for a new user.

User Profile:
- Goal: ${profile.goal}
- Experience: ${profile.experience}
- Training days: ${profile.trainingDays.join(', ')}
- Sports: ${profile.sports.join(', ')}
- Injuries/constraints: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'None'}
${profile.eventType ? `- Training for: ${profile.eventType}` : ''}

Generated Plan:
- Name: ${plan.name}
- Split: ${plan.splitType}
- Weeks: ${plan.totalWeeks}

Write 3-4 short paragraphs that:
1. Acknowledge their specific goals and constraints
2. Briefly explain what their plan includes
3. Set expectations for week 1
4. End with a motivating but disciplined tone

Keep it concise, confident, and coach-like. No fluff. No emojis.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || plan.aiWelcomeMessage;
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return plan.aiWelcomeMessage;
  }
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get AI-powered coaching feedback (future feature)
 */
export async function getCoachingFeedback(
  userId: string,
  context: {
    workoutCompleted?: boolean;
    missedWorkouts?: number;
    progressionData?: any;
  }
): Promise<string> {
  // Placeholder for future AI coaching
  if (context.workoutCompleted) {
    return "Great session. Rest up and come back ready tomorrow.";
  }
  if (context.missedWorkouts && context.missedWorkouts > 2) {
    return "I noticed you've missed a few sessions. Let's adjust the plan to get you back on track.";
  }
  return "Stay consistent. Trust the process.";
}

