export const AI_MODEL='gpt-6-luna';
export const AI_PROMPT_VERSION='culinary-review-1';
export const AI_LIMITS={explain:{input:3000,output:2000,units:2},step:{input:5000,output:1600,units:1},full:{input:12000,output:4000,units:4}} as const;
export type AiFeature=keyof typeof AI_LIMITS;
export const AI_PLANS={free:{month:0,day:0},pro:{month:300,day:30},studio:{month:1200,day:100},kitchen:{month:3000,day:200}} as const;
// Standard short-context USD/M: input 0.10, output 0.50. Explicit caching without
// breakpoints avoids cache-write premiums; requests force the default service tier.
// Micro USD, rounded up; integer arithmetic avoids decimal rounding drift.
export const aiCost=(input:number,output:number)=>Math.ceil((input+output*5)/10);
export function aiPeriods(now=new Date()) {
 const y=now.getUTCFullYear(),m=now.getUTCMonth(),d=now.getUTCDate();
 return {month:new Date(Date.UTC(y,m,1)).toISOString(),day:new Date(Date.UTC(y,m,d)).toISOString(),resetAt:new Date(Date.UTC(y,m+1,1)).toISOString(),dailyResetAt:new Date(Date.UTC(y,m,d+1)).toISOString()};
}
