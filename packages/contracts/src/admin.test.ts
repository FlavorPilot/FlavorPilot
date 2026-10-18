import { describe,it,expect } from 'vitest';
import { adminListQuerySchema,adminModerationRequestSchema,adminReviewRequestSchema } from './admin';
import { createTicketSchema,ticketMessageRequestSchema,ticketUpdateSchema } from './support';
import { modelFeedbackRequestSchema } from './feedback';
const id='aa731c70-950a-4778-937a-b7185e1b4fae';
describe('administration boundaries',()=>{
    it('bounds queries and rejects hidden access controls supplied by the browser',()=>{
        for(const q of [{limit:500},{page:0},{search:'x'.repeat(101)},{role:'owner'},{includePrivate:true}])expect(adminListQuerySchema.safeParse(q).success).toBe(false);
        expect(adminListQuerySchema.parse({page:'2'}).page).toBe(2);
    });
    it('requires a reason and an observed state for moderation and review writes',()=>{
        const input={hidden:true,expectedHidden:false,expectedRevision:0,reason:'Spam report'};
        expect(adminModerationRequestSchema.safeParse(input).success).toBe(true);
        for(const extra of [{reason:''},{expectedHidden:undefined},{visibility:'public'},{actorId:id}])expect(adminModerationRequestSchema.safeParse({...input,...extra}).success).toBe(false);
        expect(adminReviewRequestSchema.safeParse({status:'closed',note:'',expectedRevision:0,expectedUpdatedAt:'invalid'}).success).toBe(false);
    });
    it('requires idempotency IDs and prevents support owner/staff/status spoofing',()=>{
        const ticket={subject:'Cannot save',category:'recipe',text:'Please help me save.',requestId:id};
        expect(createTicketSchema.safeParse(ticket).success).toBe(true);
        for(const extra of [{ownerId:id},{fromStaff:true},{status:'resolved'},{requestId:undefined},{text:' '}])expect(createTicketSchema.safeParse({...ticket,...extra}).success).toBe(false);
        expect(ticketMessageRequestSchema.safeParse({text:'Hello',requestId:id,fromStaff:true}).success).toBe(false);
        expect(ticketUpdateSchema.safeParse({status:'closed',priority:'normal',assignedToSelf:true,reason:'Resolved',expectedRevision:0,assignedTo:id}).success).toBe(false);
    });
    it('keeps team-review permission closed for older clients',()=>{
        const recipe={name:'Dish',description:'',servings:null,steps:[],goal:'balanced',items:[{ingredientId:'salmon',grams:100,preparationId:'raw'},{ingredientId:'lime',grams:10,preparationId:'raw'}]};
        const input={recipe,modelVersion:'m',catalogueVersion:'c',cooked:true,agreement:'matches'};
        expect(modelFeedbackRequestSchema.parse(input).allowTeamReview).toBe(false);
        expect(modelFeedbackRequestSchema.parse({...input,allowTeamReview:true}).allowTeamReview).toBe(true);
        expect(modelFeedbackRequestSchema.safeParse({...input,allowTeamReview:'true'}).success).toBe(false);
    });
});
