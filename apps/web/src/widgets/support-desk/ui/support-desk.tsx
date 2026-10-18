'use client';
import { useId,useState } from 'react';
import { ticketCategories,ticketPriorities,ticketStatuses,type TicketUpdate } from '@flavorpilot/contracts';
import type { SupportDeskController } from '@/features/support-desk';
import { getDictionary,type Locale } from '@/shared/i18n';
import { Badge,Button,Notice,Skeleton,WidgetFrame } from '@/shared/ui';
export function SupportDesk({desk,locale,staff=false,userId}:{desk:SupportDeskController;locale:Locale;staff?:boolean;userId:string}) {
    const t=getDictionary(locale).messages,id=useId();
    const categoryNames={account:t.account,recipe:t.recipe,model:t.supportModel,billing:t.crmBilling,other:t.supportOther};
    const statusNames={new:t.supportNew,working:t.supportWorking,waiting_user:t.supportWaitingUser,waiting_fix:t.supportWaitingFix,resolved:t.supportResolved,closed:t.supportClosedStatus};
    return <div className="stack crm-support">
      {desk.error && <Notice tone="error" role="alert"><p>{desk.error==='crmConflict' ? t.crmConflict : desk.error==='supportLimit' ? t.supportLimit : desk.error==='supportClosed' ? t.supportClosed : desk.error==='crmDenied' ? t.crmDenied : t.supportError}</p><Button disabled={desk.busy} onClick={()=>{desk.retry();desk.refreshDetail();}}>{t.retry}</Button></Notice>}
      {desk.success && <Notice tone="success">{t.supportSaved}</Notice>}
      {!staff && <WidgetFrame id={`${id}-new`} title={t.supportCreate} subtitle={t.supportPrivacy} icon="info"><form className="stack" onSubmit={e=>{e.preventDefault();void desk.create();}}>
        <label htmlFor={`${id}-subject`}>{t.supportSubject}</label><input id={`${id}-subject`} minLength={3} maxLength={160} required value={desk.subject} disabled={desk.busy} onChange={e=>desk.setSubject(e.target.value)}/>
        <label htmlFor={`${id}-category`}>{t.supportCategory}</label><select id={`${id}-category`} value={desk.category} disabled={desk.busy} onChange={e=>{const c=ticketCategories.find(c=>c===e.target.value);if(c)desk.setCategory(c);}}>{ticketCategories.map(c=><option key={c} value={c}>{categoryNames[c]}</option>)}</select>
        <label htmlFor={`${id}-text`}>{t.supportDescription}</label><textarea id={`${id}-text`} rows={4} minLength={5} maxLength={4000} required value={desk.text} disabled={desk.busy} onChange={e=>desk.setText(e.target.value)}/>
        <Button type="submit" variant="primary" disabled={desk.busy || desk.subject.trim().length<3 || desk.text.trim().length<5}>{desk.busy ? t.busy : t.supportSend}</Button>
      </form></WidgetFrame>}
      <WidgetFrame id={`${id}-list`} title={staff ? t.crmSupport : t.supportMine} icon="book" action={<Button disabled={desk.busy || desk.loading} onClick={()=>{desk.retry();desk.refreshDetail();}}>{t.crmRefresh}</Button>}>
        <form className="crm-search" onSubmit={e=>{e.preventDefault();desk.applySearch();}}><label className="sr-only" htmlFor={`${id}-search`}>{t.crmSearch}</label><input id={`${id}-search`} maxLength={100} value={desk.search} disabled={desk.busy} onChange={e=>desk.setSearch(e.target.value)}/><Button type="submit" disabled={desk.busy}>{t.crmSearch}</Button></form>
        {desk.loading ? <Skeleton label={t.loading}/> : <div className="crm-records">{desk.list?.items.map(ticket=><article key={ticket.id} className="crm-record"><div><strong>{ticket.subject}</strong><small>{categoryNames[ticket.category]} · {statusNames[ticket.status]} · {ticket.priority==='high' ? t.supportHigh : t.supportNormal}</small></div><Button disabled={desk.busy} onClick={()=>void desk.select(ticket.id)}>{t.crmOpen}</Button></article>)}{desk.list?.total===0 && <p>{t.crmEmpty}</p>}</div>}
        {desk.list && <div className="crm-paging"><Button disabled={desk.page===1 || desk.loading || desk.busy} onClick={()=>desk.setPage(desk.page-1)}>{t.crmPrevious}</Button><span>{desk.page} · {desk.list.total}</span><Button disabled={desk.page*desk.list.limit>=desk.list.total || desk.loading || desk.busy} onClick={()=>desk.setPage(desk.page+1)}>{t.crmNext}</Button></div>}
      </WidgetFrame>
      {desk.detail && <WidgetFrame id={`${id}-detail`} title={desk.detail.ticket.subject} action={<Button disabled={desk.busy} onClick={desk.close}>{t.close}</Button>}>
        <Badge>{statusNames[desk.detail.ticket.status]}</Badge><p className="small muted">{desk.detail.ticket.id}</p>
        {staff && <TicketManagement key={`${desk.detail.ticket.id}:${desk.detail.ticket.revision}`} desk={desk} locale={locale} userId={userId}/>}
        <div className="crm-messages">{desk.detail.messages.map(m=><article key={m.id} className={`crm-message ${m.fromStaff ? 'crm-message--staff' : ''}`}><strong>{m.fromStaff ? t.supportTeam : t.supportUser}</strong><small>{new Date(m.createdAt).toLocaleString(locale==='uk' ? 'uk-UA' : 'en-GB')}</small><p>{m.text}</p></article>)}</div>
        {['closed','resolved'].includes(desk.detail.ticket.status) ? <Notice>{t.supportClosed}</Notice> : <form className="stack" onSubmit={e=>{e.preventDefault();void desk.send();}}><label htmlFor={`${id}-reply`}>{t.supportReply}</label><textarea id={`${id}-reply`} maxLength={4000} rows={3} value={desk.reply} disabled={desk.busy} onChange={e=>desk.setReply(e.target.value)}/><Button type="submit" variant="primary" disabled={desk.busy || !desk.reply.trim()}>{desk.busy ? t.busy : t.supportReplySend}</Button></form>}
      </WidgetFrame>}
    </div>;
}
function TicketManagement({desk,locale,userId}:{desk:SupportDeskController;locale:Locale;userId:string}) {
    const t=getDictionary(locale).messages,id=useId(),ticket=desk.detail!.ticket;
    const [status,setStatus]=useState(ticket.status),[priority,setPriority]=useState(ticket.priority),[assignedToSelf,setAssigned]=useState(ticket.assignedTo===userId),[reason,setReason]=useState('');
    const names={new:t.supportNew,working:t.supportWorking,waiting_user:t.supportWaitingUser,waiting_fix:t.supportWaitingFix,resolved:t.supportResolved,closed:t.supportClosedStatus};
    function save(){const body:TicketUpdate={status,priority,assignedToSelf,reason,expectedRevision:ticket.revision};void desk.update(body);}
    return <fieldset className="feedback-fieldset stack" disabled={desk.busy}><legend>{t.supportManage}</legend>
      <label htmlFor={`${id}-status`}>{t.crmStatus}</label><select id={`${id}-status`} value={status} onChange={e=>{const s=ticketStatuses.find(s=>s===e.target.value);if(s)setStatus(s);}}>{ticketStatuses.map(s=><option key={s} value={s}>{names[s]}</option>)}</select>
      <label htmlFor={`${id}-priority`}>{t.supportPriority}</label><select id={`${id}-priority`} value={priority} onChange={e=>{const p=ticketPriorities.find(p=>p===e.target.value);if(p)setPriority(p);}}>{ticketPriorities.map(p=><option key={p} value={p}>{p==='high' ? t.supportHigh : t.supportNormal}</option>)}</select>
      <label className="check-label"><input type="checkbox" checked={assignedToSelf} onChange={e=>setAssigned(e.target.checked)}/>{t.supportAssign}</label>
      <label htmlFor={`${id}-reason`}>{t.crmReason}</label><input id={`${id}-reason`} value={reason} maxLength={500} onChange={e=>setReason(e.target.value)}/>
      <Button disabled={reason.trim().length<5} onClick={save}>{t.crmSave}</Button>
    </fieldset>;
}
