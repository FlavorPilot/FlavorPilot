'use client';
import { useEffect,useRef,useState } from 'react';
import type { CreateTicket,TicketDetail,TicketPage,TicketUpdate } from '@flavorpilot/contracts';
import { supportRepository } from '@/entities/support';
import { ApiError } from '@/shared/api';
export function useSupportDesk(token:string,staff=false) {
    const [list,setList]=useState<TicketPage|null>(null),[detail,setDetail]=useState<TicketDetail|null>(null);
    const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);
    const [page,setPage]=useState(1),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[attempt,retry]=useState(0);
    const [subject,setSubject]=useState(''),[category,setCategory]=useState<CreateTicket['category']>('account'),[text,setText]=useState(''),[reply,setReply]=useState('');
    const live=useRef(true),selection=useRef(0),pending=useRef<{key:string;id:string}|null>(null);
    useEffect(()=>{live.current=true;return()=>{live.current=false;selection.current++;};},[]);
    const fail=(e:unknown)=>{
        if(!live.current)return;
        setError(e instanceof ApiError && e.code==='ADMIN_STALE_RECORD' ? 'crmConflict' : e instanceof ApiError && e.code==='SUPPORT_LIMIT' ? 'supportLimit' : e instanceof ApiError && e.code==='SUPPORT_CLOSED' ? 'supportClosed' : e instanceof ApiError && e.status===403 ? 'crmDenied' : 'supportError');
    };
    useEffect(()=>{
        const c=new AbortController();setLoading(true);setError('');setList(null);
        supportRepository.list(new URLSearchParams({search:query,page:String(page),limit:'20'}).toString(),token,staff,c.signal)
            .then(value=>{if(!c.signal.aborted)setList(value);}).catch(e=>{if(!c.signal.aborted)fail(e);})
            .finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();
    },[token,staff,page,query,attempt]);
    async function select(id:string,preserveReply=false){
        const current=++selection.current;setBusy(true);setError('');setSuccess(false);if(!preserveReply){setDetail(null);setReply('');}
        try{const value=await supportRepository.detail(id,token,staff);if(live.current && current===selection.current)setDetail(value);}
        catch(e){if(current===selection.current)fail(e);}
        finally{if(live.current && current===selection.current)setBusy(false);}
    }
    function requestId(key:string){if(pending.current?.key!==key)pending.current={key,id:crypto.randomUUID()};return pending.current.id;}
    async function perform(action:()=>Promise<TicketDetail>,done:()=>void){
        if(busy)return false;setBusy(true);setError('');setSuccess(false);
        try{const result=await action();if(!live.current)return false;setDetail(result);done();pending.current=null;setSuccess(true);retry(v=>v+1);return true;}
        catch(e){fail(e);return false;}finally{if(live.current)setBusy(false);}
    }
    return {list,detail,loading,busy,error,success,page,setPage,search,setSearch,subject,setSubject,category,setCategory,text,setText,reply,setReply,
        applySearch:()=>{setPage(1);setQuery(search.trim());},retry:()=>retry(v=>v+1),select,
        close:()=>{selection.current++;setDetail(null);setReply('');setBusy(false);},
        create:()=>perform(()=>supportRepository.create({subject,category,text,requestId:requestId(JSON.stringify(['create',subject.trim(),category,text.trim()]))},token),()=>{setSubject('');setText('');}),
        send:()=>detail ? perform(()=>supportRepository.message(detail.ticket.id,{text:reply,requestId:requestId(JSON.stringify(['reply',detail.ticket.id,reply.trim()]))},token,staff),()=>setReply('')) : Promise.resolve(false),
        update:(body:TicketUpdate)=>detail ? perform(()=>supportRepository.update(detail.ticket.id,body,token),()=>{}) : Promise.resolve(false),
        refreshDetail:()=>{if(detail)void select(detail.ticket.id,true);},
    };
}
export type SupportDeskController=ReturnType<typeof useSupportDesk>;
