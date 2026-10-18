'use client';
import { useId, useRef, useState } from 'react';
import type { RecipeDiscussion } from '@/features/recipe-discussion';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Button, Dialog, LinkButton, Notice, Skeleton, WidgetFrame } from '@/shared/ui';

export function RecipeComments({discussion,locale,userId,versionNumber,onRefreshRecipe}: {
    discussion:RecipeDiscussion;locale:Locale;userId?:string;versionNumber:number;onRefreshRecipe:()=>Promise<void>;
}) {
    const t=getDictionary(locale).messages;
    const [deletingId,setDeletingId]=useState<string | null>(null), [refreshing,setRefreshing]=useState(false);
    const composer = useRef<HTMLTextAreaElement>(null);
    const composerId = useId();
    const name=(author:{displayName:string|null;username:string}|null)=>author?.displayName || author?.username || t.commentsDeletedAuthor;
    async function refreshRecipe() {setRefreshing(true);try {await onRefreshRecipe();discussion.clearError();} catch { /* The screen displays the refresh error; the comment draft stays intact. */ } finally {setRefreshing(false);}}
    return <WidgetFrame id="recipe-comments" title={t.commentsTitle} subtitle={t.commentsSubtitle} icon="book">
      {discussion.notice && <Notice tone="success">{t[discussion.notice]}</Notice>}
      {discussion.error && <Notice tone="error" role="alert"><p>{t[discussion.error]}</p>{discussion.error==='commentsChanged' ? <Button disabled={refreshing} onClick={()=>void refreshRecipe()}>{t.commentsRefresh}</Button> : discussion.error==='commentsLoadError' ? <Button onClick={discussion.retry}>{t.retry}</Button> : null}</Notice>}
      {discussion.loading && !discussion.items.length ? <Skeleton label={t.loading}/> : !discussion.items.length && !discussion.error ? <p className="muted">{t.commentsEmpty}</p> : null}
      <div className="comment-list">{discussion.items.map(comment=><article className="comment-card" key={comment.id} aria-label={t.commentsBy.replace('{name}',name(comment.author))}>
        <header className="comment-header"><strong>{name(comment.author)}</strong>{comment.hasCooked && <Badge tone="green">{t.commentsCookedBadge}</Badge>}<small>{t.commentsVersion.replace('{version}',String(comment.versionNumber))}{comment.versionNumber!==versionNumber ? ` · ${t.commentsOlderVersion}` : ''}</small></header>
        {comment.replyTo && <blockquote className="comment-quote"><small>{comment.replyTo.authorName || t.commentsDeletedAuthor}</small><p>{comment.replyTo.text ?? t.commentsDeleted}</p></blockquote>}
        <p className="recipe-reading">{comment.text ?? t.commentsDeleted}</p>
        {!comment.deleted && userId && <div className="inline-actions">{(!comment.parentId || comment.replyTo?.text!==null) && <Button variant="ghost" onClick={()=>{discussion.setReply(comment);composer.current?.focus();}}>{t.commentsReply}</Button>}{comment.author?.id===userId && <Button variant="ghost" onClick={()=>setDeletingId(comment.id)}>{t.commentsDelete}</Button>}</div>}
      </article>)}</div>
      {discussion.cursor && <Button disabled={discussion.loading} onClick={()=>void discussion.loadMore()}>{discussion.loading ? t.loading : t.commentsMore}</Button>}
      {userId ? <div className="comment-composer">
        {discussion.reply && <div className="comment-reply-target"><p>{t.commentsReplyTo.replace('{name}',name(discussion.reply.author))}</p><Button variant="ghost" onClick={()=>discussion.setReply(null)}>{t.cancel}</Button></div>}
        <div className="feedback-note"><label htmlFor={composerId}>{t.commentsText}</label><textarea id={composerId} ref={composer} rows={4} maxLength={2000} value={discussion.text} disabled={discussion.posting} onChange={event=>discussion.setText(event.target.value)}/></div>
        <label className="check-label"><input type="checkbox" checked={discussion.hasCooked} disabled={discussion.posting} onChange={event=>discussion.setHasCooked(event.target.checked)}/>{t.commentsCooked}</label>
        <p className="small muted">{t.commentsPublic}</p><Button variant="primary" disabled={discussion.posting || !discussion.text.trim()} onClick={()=>void discussion.post()}>{discussion.posting ? t.busy : t.commentsSend}</Button>
      </div> : <LinkButton href={`/${locale}/sign-in`} variant="ghost">{t.commentsSignIn}</LinkButton>}
      <Dialog open={Boolean(deletingId)} title={t.commentsDeleteTitle} closeLabel={t.close} onClose={()=>{if(!discussion.deleting)setDeletingId(null);}}><p>{t.commentsDeleteNote}</p><footer className="dialog__actions"><Button disabled={discussion.deleting} onClick={()=>setDeletingId(null)}>{t.cancel}</Button><Button variant="danger" disabled={discussion.deleting} onClick={()=>{if(deletingId)void discussion.remove(deletingId).then(()=>setDeletingId(null));}}>{t.delete}</Button></footer></Dialog>
    </WidgetFrame>;
}
