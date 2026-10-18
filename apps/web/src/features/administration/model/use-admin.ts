'use client';
import { useEffect, useRef, useState } from 'react';
import type { AdminAccess,AdminOverview,AdminUserPage,AdminUserDetail,AdminRecipePage,AdminCataloguePage,AdminFeedbackPage,AdminAuditPage,AdminService,AdminSection,AdminModerationRequest,AdminReviewRequest } from '@flavorpilot/contracts';
import { adminRepository } from '@/entities/administration';
import { ApiError } from '@/shared/api';
export type AdminData={overview?:AdminOverview;users?:AdminUserPage;user?:AdminUserDetail;recipes?:AdminRecipePage;catalogue?:AdminCataloguePage;feedback?:AdminFeedbackPage;audit?:AdminAuditPage;service?:AdminService};
const errorKey=(e:unknown)=>e instanceof ApiError && e.code==='ADMIN_STALE_RECORD' ? 'crmConflict' : e instanceof ApiError && e.status===403 ? 'crmDenied' : 'crmError';
export function useAdminAccess(token:string) {
    const [access,setAccess]=useState<AdminAccess|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
    const [attempt,retry]=useState(0);
    useEffect(()=>{
        const c=new AbortController();setLoading(true);setAccess(null);setError('');
        adminRepository.access(token,c.signal).then(value=>{if(!c.signal.aborted)setAccess(value);})
            .catch(e=>{if(!c.signal.aborted)setError(errorKey(e));}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
        return()=>c.abort();
    },[token,attempt]);
    return {access,loading,error,retry:()=>retry(v=>v+1)};
}
export function useAdminData(token:string,section:AdminSection) {
    const [data,setData]=useState<AdminData>({}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(false);
    const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1),[attempt,retry]=useState(0);
    const generation=useRef(0);
    useEffect(()=>{
        const c=new AbortController(),run=++generation.current;setLoading(true);setData({});setError('');
        const q=new URLSearchParams({search:query,page:String(page),limit:'20'}).toString();
        async function load():Promise<AdminData>{
            switch(section){
                case 'overview':return {overview:await adminRepository.overview(token,c.signal)};
                case 'users':return {users:await adminRepository.users(q,token,c.signal)};
                case 'recipes':return {recipes:await adminRepository.recipes(q,token,c.signal)};
                case 'catalogue':return {catalogue:await adminRepository.catalogue(q,token,c.signal)};
                case 'feedback':return {feedback:await adminRepository.feedback(q,token,c.signal)};
                case 'audit':return {audit:await adminRepository.audit(q,token,c.signal)};
                case 'service':return {service:await adminRepository.service(token,c.signal)};
                default:return {};
            }
        }
        load().then(value=>{if(!c.signal.aborted)setData(value);}).catch(e=>{if(!c.signal.aborted)setError(errorKey(e));})
            .finally(()=>{if(!c.signal.aborted)setLoading(false);});
        return()=>{c.abort();if(generation.current===run)generation.current++;};
    },[token,section,query,page,attempt]);
    async function mutate(action:()=>Promise<unknown>){
        if(busy)return false;const run=generation.current;setBusy(true);setError('');setNotice(false);
        try{await action();if(run!==generation.current)return false;setNotice(true);retry(v=>v+1);return true;}
        catch(e){if(run===generation.current)setError(errorKey(e));return false;}
        finally{if(run===generation.current)setBusy(false);}
    }
    async function user(id:string){
        const run=generation.current;setBusy(true);setError('');
        try{const user=await adminRepository.user(id,token);if(run===generation.current)setData(d=>({...d,user}));}
        catch(e){if(run===generation.current)setError(errorKey(e));}
        finally{if(run===generation.current)setBusy(false);}
    }
    return {data,loading,busy,error,notice,search,setSearch,page,setPage,
        applySearch:()=>{setPage(1);setQuery(search.trim());setNotice(false);},retry:()=>retry(v=>v+1),user,
        closeUser:()=>setData(d=>({...d,user:undefined})),
        moderate:(id:string,input:AdminModerationRequest)=>mutate(()=>adminRepository.moderate(id,input,token)),
        review:(id:string,input:AdminReviewRequest)=>mutate(()=>adminRepository.review(id,input,token)),
    };
}
export type AdminController=ReturnType<typeof useAdminData>;
