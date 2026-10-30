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
  return items.filter(item=>item.href!==`/${locale}/workspace`).map(item=>({...item,current:active===item.href || Boolean(item.href!==base && active?.startsWith(item.href+'/'))}));
}
