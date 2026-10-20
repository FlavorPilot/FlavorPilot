import type {PairCoverage,PairResult} from '@flavorpilot/contracts/domain';
type WeightedPair=PairResult&{weight:number};
export function assessedPairMean(pairs:WeightedPair[]):number|null {
 const assessed=pairs.filter((p):p is WeightedPair&{score:number}=>p.evidence==='hypothesis'&&p.score!==null);
 const mass=assessed.reduce((sum,p)=>sum+p.weight,0);
 return mass>0?assessed.reduce((sum,p)=>sum+p.score*p.weight,0)/mass:null;
}
export function pairCoverage(pairs:WeightedPair[]):PairCoverage {
 const assessed=pairs.filter(p=>p.evidence==='hypothesis'&&p.score!==null),total=pairs.reduce((sum,p)=>sum+p.weight,0);
 return {status:assessed.length===0?'insufficient':assessed.length===pairs.length?'complete':'partial',assessedPairs:assessed.length,totalPairs:pairs.length,weightedPercent:total===0?0:Math.round(assessed.reduce((sum,p)=>sum+p.weight,0)/total*1000)/10};
}
