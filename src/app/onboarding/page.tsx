"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Types
type Goal = 'fat_loss' | 'maintenance' | 'muscle_gain' | 'performance' | 'event_training';
type Experience = 'beginner' | 'intermediate' | 'advanced';
type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface OnboardingData {
  age: number;
  heightFt: number;
  heightIn: number;
  heightCm: number;
  weight: number;
  unitSystem: 'imperial' | 'metric';
  goal: Goal;
  eventType?: string;
  eventDate?: string;
  experience: Experience;
  trainingDays: Day[];
  sports: string[];
  injuries: string[];
  injuryNotes: string;
}

const DAYS: { key: Day; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

const SPORTS = [
  { key: 'lifting', label: 'Weight Training' },
  { key: 'running', label: 'Running' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'swimming', label: 'Swimming' },
  { key: 'rowing', label: 'Rowing' },
];

const INJURIES = [
  { key: 'no_deadlifts', label: 'No Deadlifts' },
  { key: 'bad_knee', label: 'Knee Issues' },
  { key: 'shoulder_issues', label: 'Shoulder Issues' },
  { key: 'lower_back', label: 'Lower Back Issues' },
  { key: 'wrist_issues', label: 'Wrist Issues' },
];

const EVENT_TYPES = [
  { key: 'marathon', label: 'Marathon' },
  { key: 'half_marathon', label: 'Half Marathon' },
  { key: '10k', label: '10K Race' },
  { key: '5k', label: '5K Race' },
  { key: 'triathlon', label: 'Triathlon' },
  { key: 'powerlifting', label: 'Powerlifting Meet' },
  { key: 'other', label: 'Other' },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  
  const [data, setData] = useState<OnboardingData>({
    age: 30,
    heightFt: 5,
    heightIn: 10,
    heightCm: 178,
    weight: 175,
    unitSystem: 'imperial',
    goal: 'fat_loss',
    experience: 'intermediate',
    trainingDays: ['mon', 'wed', 'fri'],
    sports: ['lifting'],
    injuries: [],
    injuryNotes: '',
  });
  
  const totalSteps = 5;
  
  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };
  
  const toggleDay = (day: Day) => {
    setData(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day],
    }));
  };
  
  const toggleSport = (sport: string) => {
    setData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport],
    }));
  };
  
  const toggleInjury = (injury: string) => {
    setData(prev => ({
      ...prev,
      injuries: prev.injuries.includes(injury)
        ? prev.injuries.filter(i => i !== injury)
        : [...prev.injuries, injury],
    }));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const heightCm = data.unitSystem === 'imperial'
        ? (data.heightFt * 12 + data.heightIn) * 2.54
        : data.heightCm;
      
      const weightKg = data.unitSystem === 'imperial'
        ? data.weight * 0.453592
        : data.weight;
      
      const profileRes = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: data.age,
          heightCm,
          weightKg,
          unitSystem: data.unitSystem,
          goal: data.goal,
          experience: data.experience,
          trainingDays: JSON.stringify(data.trainingDays),
          sports: JSON.stringify(data.sports),
          eventType: data.goal === 'event_training' ? data.eventType : null,
          eventDate: data.goal === 'event_training' && data.eventDate ? data.eventDate : null,
          injuries: JSON.stringify(data.injuries),
          injuryNotes: data.injuryNotes,
        }),
      });
      
      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.error || 'Failed to save profile');
      }
      
      const planRes = await fetch('/api/user/plan', { method: 'POST' });
      
      if (!planRes.ok) {
        const err = await planRes.json();
        throw new Error(err.error || 'Failed to generate plan');
      }
      
      const { welcomeMessage: msg } = await planRes.json();
      setWelcomeMessage(msg);
      setStep(totalSteps + 1);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return data.age > 0 && data.weight > 0;
      case 2: return data.goal && (data.goal !== 'event_training' || data.eventType);
      case 3: return data.experience && data.trainingDays.length >= 2;
      case 4: return data.sports.length > 0;
      case 5: return true;
      default: return true;
    }
  };
  
  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Welcome screen after completion
  if (welcomeMessage) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full space-y-8">
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
            <h1 className="text-2xl font-semibold">Your Plan is Ready</h1>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <p className="text-neutral-300 whitespace-pre-line leading-relaxed text-sm">
              {welcomeMessage}
            </p>
          </div>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-neutral-900">
        <div 
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          {/* Step indicator */}
          <div className="text-xs text-neutral-500 tracking-wide">
            STEP {step} OF {totalSteps}
          </div>
          
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold">The basics</h1>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-400">Age</label>
                  <input
                    type="number"
                    value={data.age}
                    onChange={e => updateData({ age: parseInt(e.target.value) || 0 })}
                    className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-neutral-400">Units</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {(['imperial', 'metric'] as const).map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => updateData({ unitSystem: unit })}
                        className={`p-4 rounded-xl border transition-all ${
                          data.unitSystem === unit
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        {unit === 'imperial' ? 'lbs / ft' : 'kg / cm'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {data.unitSystem === 'imperial' ? (
                  <div>
                    <label className="text-sm text-neutral-400">Height</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={data.heightFt}
                          onChange={e => updateData({ heightFt: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 pr-12 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">ft</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={data.heightIn}
                          onChange={e => updateData({ heightIn: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 pr-12 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">in</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-neutral-400">Height</label>
                    <div className="mt-2 relative">
                      <input
                        type="number"
                        value={data.heightCm}
                        onChange={e => updateData({ heightCm: parseInt(e.target.value) || 0 })}
                        className="w-full p-4 pr-12 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">cm</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-neutral-400">Weight</label>
                  <div className="mt-2 relative">
                    <input
                      type="number"
                      value={data.weight}
                      onChange={e => updateData({ weight: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 pr-12 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
                      {data.unitSystem === 'imperial' ? 'lbs' : 'kg'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold">Your goal</h1>
              
              <div className="space-y-3">
                {[
                  { key: 'fat_loss', label: 'Fat Loss', desc: 'Lose fat, keep muscle' },
                  { key: 'maintenance', label: 'Maintenance', desc: 'Stay where you are' },
                  { key: 'muscle_gain', label: 'Build Muscle', desc: 'Gain size and strength' },
                  { key: 'performance', label: 'Performance', desc: 'Get faster, stronger, better' },
                  { key: 'event_training', label: 'Event Prep', desc: 'Train for something specific' },
                ].map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => updateData({ goal: option.key as Goal })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      data.goal === option.key
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className={`text-sm mt-0.5 ${data.goal === option.key ? 'text-neutral-600' : 'text-neutral-500'}`}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
              
              {data.goal === 'event_training' && (
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <div>
                    <label className="text-sm text-neutral-400">Event Type</label>
                    <select
                      value={data.eventType || ''}
                      onChange={e => updateData({ eventType: e.target.value })}
                      className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select event...</option>
                      {EVENT_TYPES.map(event => (
                        <option key={event.key} value={event.key}>{event.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-neutral-400">Event Date</label>
                    <input
                      type="date"
                      value={data.eventDate || ''}
                      onChange={e => updateData({ eventDate: e.target.value })}
                      className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Experience & Schedule */}
          {step === 3 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold">Experience & schedule</h1>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-neutral-400">Training Experience</label>
                  <div className="mt-3 space-y-3">
                    {[
                      { key: 'beginner', label: 'Beginner', desc: 'Under 1 year consistent' },
                      { key: 'intermediate', label: 'Intermediate', desc: '1-3 years consistent' },
                      { key: 'advanced', label: 'Advanced', desc: '3+ years serious training' },
                    ].map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => updateData({ experience: option.key as Experience })}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          data.experience === option.key
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className={`text-sm mt-0.5 ${data.experience === option.key ? 'text-neutral-600' : 'text-neutral-500'}`}>
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-neutral-400">Training Days</label>
                  <p className="text-xs text-neutral-600 mt-1">Pick at least 2</p>
                  <div className="mt-3 flex gap-2">
                    {DAYS.map((day, i) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleDay(day.key)}
                        className={`flex-1 aspect-square rounded-xl border flex items-center justify-center text-sm font-medium transition-all ${
                          data.trainingDays.includes(day.key)
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        {['M','T','W','T','F','S','S'][i]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">
                    {data.trainingDays.length} day{data.trainingDays.length !== 1 ? 's' : ''} per week
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Activities */}
          {step === 4 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold">What do you train?</h1>
              <p className="text-neutral-500 text-sm">Select all that apply</p>
              
              <div className="space-y-3">
                {SPORTS.map(sport => (
                  <button
                    key={sport.key}
                    type="button"
                    onClick={() => toggleSport(sport.key)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      data.sports.includes(sport.key)
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className="font-medium">{sport.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 5: Constraints */}
          {step === 5 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold">Any limitations?</h1>
              <p className="text-neutral-500 text-sm">We'll work around these</p>
              
              <div className="space-y-3">
                {INJURIES.map(injury => (
                  <button
                    key={injury.key}
                    type="button"
                    onClick={() => toggleInjury(injury.key)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      data.injuries.includes(injury.key)
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className="font-medium">{injury.label}</div>
                  </button>
                ))}
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Anything else?</label>
                <textarea
                  value={data.injuryNotes}
                  onChange={e => updateData({ injuryNotes: e.target.value })}
                  placeholder="Other injuries, constraints, or notes..."
                  rows={3}
                  className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-4 border border-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-900 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed() || loading}
              className={`flex-1 py-4 font-semibold rounded-xl transition-all ${
                canProceed() && !loading
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Building your plan...' : step === totalSteps ? 'Create My Plan' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
