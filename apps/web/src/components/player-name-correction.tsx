'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Button, Input } from './ui/controls';

type Names = { id: string; name: string; alternateName?: string; version: number };
type Candidate = { id: string; display_name: string; branch_name: string };
type Review = { revision: number; candidates: Candidate[]; after?: string };
type Receipt = { player_id?: string; name_version?: number; cancelled?: boolean };

export function PlayerNameCorrection({ player, storageKey, request, readCurrent, onConfirmed, onFailure, onClose, t, ref }: {
    player: Names;
    storageKey: string;
    request: <T>(body: Record<string, unknown>) => Promise<T>;
    readCurrent: () => Promise<Names>;
    onConfirmed: () => void;
    onFailure: (error: unknown) => void;
    onClose: () => void;
    t: (en: string, ar: string) => string;
    ref: Ref<{canLeave: () => boolean}>;
}) {
    const [base,setBase]=useState(player);
    const [name,setName]=useState(player.name);
    const [alternate,setAlternate]=useState(player.alternateName??'');
    const [pending,setPending]=useState<string|null>(()=>{try{return sessionStorage.getItem(storageKey);}catch{return null;}});
    const [review,setReview]=useState<Review|null>(null);
    const [different,setDifferent]=useState(false);
    const [busy,setBusy]=useState(false);
    const [needsCurrent,setNeedsCurrent]=useState(false);
    const [confirmed,setConfirmed]=useState(false);
    const [notice,setNotice]=useState('');
    const locked=useRef(false);
    const dirty=name.trim()!==base.name||alternate.trim()!==(base.alternateName??'');

    useEffect(()=>{
        if(!pending&&(!dirty||confirmed)&&!busy)return;
        const guard=(event:BeforeUnloadEvent)=>event.preventDefault();
        window.addEventListener('beforeunload',guard);
        return ()=>window.removeEventListener('beforeunload',guard);
    },[pending,dirty,busy,confirmed]);

    function canLeave() {
        return !pending&&!locked.current&&(confirmed||!dirty||
            window.confirm(t('Discard unsaved name corrections?', 'تجاهل تعديلات الأسماء غير المحفوظة؟')));
    }
    useImperativeHandle(ref,()=>({canLeave}));

    function clearReview(){
        setReview(null);
        setDifferent(false);
    }
    function forget(){
        sessionStorage.removeItem(storageKey);
        setPending(null);
    }
    function codeOf(error:unknown){
        return (error as {code?:string})?.code;
    }
    async function run(work:()=>Promise<void>){
        if(locked.current)return;
        locked.current=true;
        setBusy(true);
        setNotice('');
        try{await work();}
        catch(error){
            if(['authentication_required','denied','setup_required'].includes(codeOf(error)??''))onFailure(error);
            else setNotice(t('Could not complete the request. Try again.', 'تعذّر إكمال الطلب. أعد المحاولة.'));
        }
        finally{locked.current=false;setBusy(false);}
    }
    async function reviewNames(after?:string){
        const page=await request<{items:Candidate[];revision:number;more:boolean}>({
            action:'candidates',name,...(after?{after}:{})
        });
        if(after&&page.revision!==review?.revision){
            clearReview();
            setNotice(t('Matching records changed. Review them again.', 'تغيّرت السجلات المطابقة. راجعها مجددًا.'));
            return;
        }
        setReview({revision:page.revision,candidates:[
            ...(after?review?.candidates??[]:[]),...page.items.filter(row=>row.id!==player.id)
        ],after:page.more?page.items.at(-1)?.id:undefined});
    }
    async function reloadNames(useSavedNames=false){
        const current=await readCurrent();
        setBase(current);
        if(useSavedNames){
            setName(current.name);
            setAlternate(current.alternateName??'');
        }
        clearReview();
        setNeedsCurrent(false);
    }
    async function confirm(receipt:Receipt){
        if(receipt.player_id!==player.id||!Number.isInteger(receipt.name_version)||(receipt.name_version??0)<2)
            throw Error('Unexpected name correction receipt');
        forget();
        setConfirmed(true);
        setNeedsCurrent(true);
        onConfirmed();
        try{await reloadNames(true);}
        catch(error){
            if(['authentication_required','denied','setup_required'].includes(codeOf(error)??''))throw error;
            setNotice(t('Saved names could not be loaded. Try loading them again.', 'تعذّر تحميل الأسماء المحفوظة. حاول تحميلها مجددًا.'));
        }
    }
    async function save(){
        if(!review||review.after||needsCurrent||pending||!dirty||(review.candidates.length&&!different))return;
        const op=crypto.randomUUID();
        sessionStorage.setItem(storageKey,op);
        setPending(op);
        let receipt:Receipt;
        try{
            receipt=await request<Receipt>({action:'correctNames',player:player.id,op,
                version:base.version,name,alternateName:alternate,revision:review.revision,different});
        }catch(error){
            if(codeOf(error)==='review_required'){
                forget();
                clearReview();
                setNotice(t('Matching records changed. Review them again.', 'تغيّرت السجلات المطابقة. راجعها مجددًا.'));
                return;
            }
            if(codeOf(error)==='conflict'){
                forget();
                setNeedsCurrent(true);
                clearReview();
                setNotice(t('The player record changed. Load the current names and review your draft.', 'تغيّر سجل اللاعب. حمّل الأسماء الحالية وراجع مسودتك.'));
                return;
            }
            if(['invalid','limited'].includes(codeOf(error)??''))forget();
            throw error;
        }
        await confirm(receipt);
    }
    async function recover(){
        const original=await request<Receipt>({action:'reconcile',op:pending});
        if(original.cancelled){
            forget();
            clearReview();
            setNeedsCurrent(true);
            setNotice(t('The original correction did not save.', 'لم يُحفظ تعديل الأسماء الأصلي.'));
            return;
        }
        await confirm(original);
    }

    return <section aria-label={t('Correct player names','تعديل أسماء اللاعب')}>
        {confirmed&&<p role="status">{t('Player names saved.', 'حُفظت أسماء اللاعب.')}</p>}
        {notice&&<p role="alert">{notice}</p>}
        {confirmed&&needsCurrent&&busy&&<p role="status">{t('Loading saved names…','جارٍ تحميل الأسماء المحفوظة…')}</p>}
        {pending?<Button type="button" disabled={busy} onClick={()=>void run(recover)}>
            {t('Check original name correction','تحقّق من تعديل الأسماء الأصلي')}
        </Button>:<>
            {!confirmed&&<form className="journey-form" onSubmit={event=>{event.preventDefault();if(!needsCurrent&&dirty)void run(()=>reviewNames());}}>
                <label htmlFor="correct-player-name">{t('Display name','اسم العرض')}</label>
                <Input id="correct-player-name" required maxLength={160} dir="auto" disabled={busy} value={name}
                    onChange={event=>{setName(event.target.value);clearReview();}}/>
                <label htmlFor="correct-player-alternate">{t('Alternate full name (optional)','الاسم الكامل البديل (اختياري)')}</label>
                <Input id="correct-player-alternate" maxLength={160} dir="auto" disabled={busy} value={alternate}
                    onChange={event=>{setAlternate(event.target.value);clearReview();}}/>
                {needsCurrent?<Button type="button" disabled={busy} onClick={()=>void run(()=>reloadNames())}>
                    {t('Load current names','حمّل الأسماء الحالية')}
                </Button>:<Button disabled={busy||!dirty||!name.trim()}>{t('Review matching players','راجع اللاعبين المطابقين')}</Button>}
            </form>}
            {confirmed&&needsCurrent&&<Button type="button" disabled={busy} onClick={()=>void run(()=>reloadNames(true))}>
                {t('Reload saved names','أعد تحميل الأسماء المحفوظة')}
            </Button>}
            {review&&!needsCurrent&&!confirmed&&<>
                <p><bdi>{base.name}</bdi> → <bdi>{name.trim()}</bdi></p>
                {base.alternateName!==(alternate.trim()||undefined)&&<p>
                    {t('Alternate name','الاسم البديل')} · <bdi>{alternate.trim()||t('Remove it','إزالة الاسم البديل')}</bdi>
                </p>}
                {review.candidates.length>0&&<ul>{review.candidates.map(row=>
                    <li key={row.id}><bdi>{row.display_name}</bdi> · {row.branch_name}</li>
                )}</ul>}
                {review.after?<Button type="button" disabled={busy} onClick={()=>void run(()=>reviewNames(review.after))}>
                    {t('Next matching page','الصفحة المطابقة التالية')}
                </Button>:<>
                    {review.candidates.length>0&&<label className="people-check">
                        <input type="checkbox" checked={different} disabled={busy} onChange={event=>setDifferent(event.target.checked)}/>
                        {t('I reviewed the matches. This is a different player.','راجعت السجلات المطابقة. هذا لاعب مختلف.')}
                    </label>}
                    <Button type="button" disabled={busy||Boolean(review.candidates.length&&!different)} onClick={()=>void run(save)}>
                        {t('Save name correction','حفظ تعديل الأسماء')}
                    </Button>
                </>}
            </>}
        </>}
        <Button type="button" disabled={busy||Boolean(pending)} onClick={()=>{if(canLeave())onClose();}}>
            {t('Close name correction','إغلاق تعديل الأسماء')}
        </Button>
    </section>;
}
