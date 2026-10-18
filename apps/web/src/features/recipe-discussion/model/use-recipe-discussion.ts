'use client';
import { useEffect, useRef, useState } from 'react';
import type { CommentResponse } from '@flavorpilot/contracts';
import { commentRepository } from '@/entities/comment';
import { ApiError } from '@/shared/api';
import type { MessageKey } from '@/shared/i18n';

export function useRecipeDiscussion(dishId: string | null, versionNumber: number, userId?: string, token?: string) {
    const [items,setItems] = useState<CommentResponse[]>([]), [cursor,setCursor] = useState<string | null>(null);
    const [loading,setLoading] = useState(false), [posting,setPosting] = useState(false), [deleting,setDeleting] = useState(false);
    const [error,setError] = useState<MessageKey | null>(null);
    const [notice,setNotice] = useState<MessageKey | null>(null);
    const [text,setText] = useState(''), [hasCooked,setHasCooked] = useState(false), [reply,setReply] = useState<CommentResponse | null>(null);
    const [refresh,setRefresh] = useState(0);
    const epoch = useRef(0);
    useEffect(() => {
        const generation = ++epoch.current, controller = new AbortController();
        setItems([]); setCursor(null); setError(null); setNotice(null); setPosting(false); setDeleting(false);
        if(!dishId) {setLoading(false);return;}
        setLoading(true);
        commentRepository.list(dishId,undefined,controller.signal).then(result => {
            if(epoch.current===generation) {setItems(result.items);setCursor(result.nextCursor);}
        }).catch(() => {if(!controller.signal.aborted && epoch.current===generation)setError('commentsLoadError');})
          .finally(() => {if(epoch.current===generation)setLoading(false);});
        return () => {controller.abort();epoch.current++;};
    },[dishId,userId,refresh]);
    useEffect(() => {setText('');setHasCooked(false);setReply(null);},[dishId,userId]);
    async function loadMore() {
        if(!dishId || !cursor || loading)return;
        const generation=epoch.current;
        setLoading(true);setError(null);
        try {
            const result=await commentRepository.list(dishId,cursor);
            if(epoch.current===generation) {setItems(current=>[...new Map([...current,...result.items].map(item=>[item.id,item])).values()]);setCursor(result.nextCursor);}
        } catch {if(epoch.current===generation)setError('commentsLoadError');}
        finally {if(epoch.current===generation)setLoading(false);}
    }
    async function post() {
        if(!dishId || !token || !text.trim() || posting)return;
        const generation=epoch.current;
        setPosting(true);setError(null);setNotice(null);
        try {
            const result=await commentRepository.create(dishId,{text,hasCooked,versionNumber,...(reply ? {parentId:reply.parentId ?? reply.id} : {})},token);
            if(epoch.current===generation) {setItems(current=>[result,...current]);setText('');setHasCooked(false);setReply(null);setNotice('commentsPosted');}
        } catch(problem) {if(epoch.current===generation)setError(problem instanceof ApiError && problem.code==='DISH_VERSION_CHANGED' ? 'commentsChanged' : 'commentsPostError');}
        finally {if(epoch.current===generation)setPosting(false);}
    }
    async function remove(id: string) {
        if(!dishId || !token || deleting)return;
        const generation=epoch.current;
        setDeleting(true);setError(null);setNotice(null);
        try {
            await commentRepository.remove(dishId,id,token);
            if(epoch.current===generation) {
                setItems(current=>current.map(item=>item.id===id ? {...item,text:null,author:null,hasCooked:false,deleted:true} : item.parentId===id ? {...item,replyTo:{authorName:'',text:null}} : item));
                setReply(current=>current?.id===id ? null : current);
                setNotice('commentsRemoved');
            }
        } catch {if(epoch.current===generation)setError('commentsDeleteError');}
        finally {if(epoch.current===generation)setDeleting(false);}
    }
    return {items,cursor,loading,posting,deleting,error,notice,text,hasCooked,reply,setText,setHasCooked,setReply,
        loadMore,post,remove,retry:()=>{if(!posting&&!deleting)setRefresh(value=>value+1);},clearError:()=>setError(null)};
}
export type RecipeDiscussion = ReturnType<typeof useRecipeDiscussion>;
