import { isCivilDay } from '@/lib/experience-format';
import { ownerNavigation } from './owner-navigation';
import type { NavigationItem } from './workspace-shell';

/** Presentation-only route catalogue. Every destination checks current server authority. */
export function workspaceNavigation(locale: string, academy: string, role: 'owner'|'trainer'|'guardian', existing: NavigationItem[]): NavigationItem[] {
  const ar=locale==='ar',t=(en:string,arabic:string)=>ar?arabic:en,base=`/${locale}/workspace/${academy}`;
  const active=existing.find(item=>item.current)?.href.split(/[?#]/)[0];
  const items:NavigationItem[]=role==='owner'?ownerNavigation(locale,academy,undefined):[
    {href:`${base}/${role}/home`,label:t('Home','الرئيسية'),module:role==='guardian'?'family':'operations'},
    {href:`${base}/${role}/calendar`,label:t('Calendar','التقويم'),module:'training'},
    {href:role==='trainer'?`${base}/trainer/schedule`:`${base}/guardian/training`,label:role==='trainer'?t('My sessions','تدريباتي'):t('Training & attendance','التدريبات والحضور'),module:'attendance'},
    {href:role==='trainer'?`${base}/development`:`${base}/guardian/development`,label:t('Development','التطور'),module:'development'},
  ];
  // The catalogue remains canonical. Only the reviewed Owner civil-day hint may
  // survive reconstruction; arbitrary caller links/query data never replace it.
  const calendarPath=`${base}/calendar`;
  const proposed=role==='owner'?existing.find(item=>item.href.startsWith(calendarPath+'?'))?.href:undefined;
  const query=new URLSearchParams(proposed?.slice(calendarPath.length+1).split('#')[0]);
  const anchor=query.getAll('anchor');
  const calendarHref=anchor.length===1&&isCivilDay(anchor[0])?`${calendarPath}?anchor=${anchor[0]}`:calendarPath;
  return items.filter(item=>item.href!==`/${locale}/workspace`).map(item=>({...item,href:item.href===calendarPath?calendarHref:item.href,current:active===item.href || Boolean(item.href!==base && active?.startsWith(item.href+'/'))}));
}
