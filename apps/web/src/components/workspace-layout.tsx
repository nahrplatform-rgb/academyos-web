"use client";
import {createContext,useCallback,useContext,useSyncExternalStore,type ReactNode} from 'react';
export const navigationMin = 220;
export const navigationMax = 336;
export const inspectorMin = 260;
export const inspectorDefault = 276;
export const inspectorMax = 420;
export type LayoutPreferences={compact:boolean;navigationHidden:boolean;navigationWidth:number;inspectorWidth:number;detailsHidden:boolean};
const defaults:LayoutPreferences={compact:false,navigationHidden:false,navigationWidth:navigationMin,inspectorWidth:inspectorDefault,detailsHidden:false};
const key='academyos:layout:v1',eventName='academyos-layout-change';
const LayoutContext=createContext<{preferences:LayoutPreferences;update:(change:Partial<LayoutPreferences>)=>void;reset:()=>void}>({preferences:defaults,update:()=>{},reset:()=>{}});
function boundedWidth(value: unknown, minimum: number, maximum: number, fallback = minimum) {
 return typeof value === 'number' && Number.isFinite(value)
  ? Math.round(Math.min(maximum, Math.max(minimum, value)))
  : fallback;
}
function clean(value:unknown):LayoutPreferences {
 const p = value && typeof value === 'object' ? value as Record<string, unknown> : {};
 return {
  compact: p.compact === true,
  navigationHidden: p.navigationHidden === true,
  navigationWidth: boundedWidth(p.navigationWidth, navigationMin, navigationMax),
  inspectorWidth: boundedWidth(p.inspectorWidth, inspectorMin, inspectorMax, inspectorDefault),
  detailsHidden: p.detailsHidden === true,
 };
}
function parse(value:string):LayoutPreferences{try{return clean(value.length<512?JSON.parse(value):null);}catch{return defaults;}}
function snapshot(){return document.documentElement.dataset.workspaceLayout??'';}
function subscribe(listener:()=>void){
 if(document.documentElement.dataset.workspaceLayout===undefined){try{document.documentElement.dataset.workspaceLayout=JSON.stringify(parse(localStorage.getItem(key)??''));}catch{document.documentElement.dataset.workspaceLayout=JSON.stringify(defaults);}}
 const storage=(e:StorageEvent)=>{if(e.key===key){document.documentElement.dataset.workspaceLayout=JSON.stringify(parse(e.newValue??''));listener();}};
 window.addEventListener(eventName,listener);window.addEventListener('storage',storage);return()=>{window.removeEventListener(eventName,listener);window.removeEventListener('storage',storage);};
}
/** Browser-only presentation preferences. Never store identity or operating records here. */
export function WorkspaceLayoutProvider({children}:{children:ReactNode}){
 const raw=useSyncExternalStore(subscribe,snapshot,()=>''),preferences=parse(raw);
 const update=useCallback((change:Partial<LayoutPreferences>)=>{const next=JSON.stringify(clean({...parse(snapshot()),...change}));if(next===snapshot())return;document.documentElement.dataset.workspaceLayout=next;try{localStorage.setItem(key,next);}catch{}window.dispatchEvent(new Event(eventName));},[]);
 return <LayoutContext value={{preferences,update,reset:()=>update(defaults)}}>{children}</LayoutContext>;
}
export function useWorkspaceLayout(){return useContext(LayoutContext);}
