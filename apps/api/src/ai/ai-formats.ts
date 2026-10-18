const text=(maxLength=1200)=>({type:'string',minLength:1,maxLength});
const list=(items:unknown,maxItems:number,minItems=0)=>({type:'array',items,maxItems,minItems});
const object=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const commentFormat=object({id:{type:'string'},kind:{type:'string',enum:['clarity','consistency','ingredientUsage','technique']},stepId:{type:['string','null']},message:text(),suggestedText:{type:['string','null'],maxLength:4000}});
export const reviewFormat=object({comments:list(commentFormat,6)});
export const outcomeFormat=object({verdict:{type:'string',enum:['promising','mixed','needsWork','insufficientContext']},summary:text(),taste:text(),texture:text(),strengths:list(text(),4),risks:list(text(),4),cookingAdvice:list(object({title:text(160),instruction:text(),reason:text()}),4,1),assumptions:list(text(),4)});
export const fullReviewFormat=object({comments:list(commentFormat,6),outcome:outcomeFormat});
export const generationFormat=object({recipe:object({name:text(160),description:text(),servings:{type:['integer','null'],minimum:1,maximum:1000},steps:list(object({id:{type:'string'},text:text(2000),ingredientIds:list(text(100),24)}),16,1)}),assumptions:list(text(),4)});
