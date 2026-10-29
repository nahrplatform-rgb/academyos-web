"use client";
import {createContext,useCallback,useContext,useSyncExternalStore,type ReactNode} from 'react';
export type LayoutPreferences={compact:boolean;inspectorWidth:number;detailsHidden:boolean};
const defaults:LayoutPreferences={compact:false,inspectorWidth:336,detailsHidden:false};
const key='academyos:layout:v1',eventName='academyos-layout-change';
const LayoutContext=createContext<{preferences:LayoutPreferences;update:(change:Partial<LayoutPreferences>)=>void;reset:()=>void}>({preferences:defaults,update:()=>{},reset:()=>{}});
function clean(value:unknown):LayoutPreferences{const p=value&&typeof value==='object'?value as Record<string,unknown>:{};return{compact:p.compact===true,detailsHidden:p.detailsHidden===true,inspectorWidth:typeof p.inspectorWidth==='number'&&Number.isFinite(p.inspectorWidth)?Math.round(Math.min(480,Math.max(280,p.inspectorWidth))):336};}
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
