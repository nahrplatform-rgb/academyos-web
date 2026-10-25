'use strict';
const STORE='academyos-design-v1';
function seed(){return {lang:'en',theme:'light',page:'requests',persona:'platform',selected:'DEMO-01',tab:'details',query:'',filter:'all',checked:[],phone:false,scenario:'happy',draft:{},dirty:false,error:'',toast:'',unknown:null,seq:1,academies:[{id:'DEMO-01',name:'Riverside Sports Academy · Demo',email:'owner.riverside@example.invalid',owner:'pending',delivery:'queued',invite:'valid',branch:'',timezone:'',sportEn:'',sportAr:'',complete:false,version:1}],events:[]}}
let M=seed();try{const saved=JSON.parse(sessionStorage.getItem(STORE));if(saved?.academies)M={...M,...saved,checked:[],draft:{},dirty:false,error:'',toast:'',scenario:'happy'}}catch{}
let persistAvailable=true;
function persist(){try{sessionStorage.setItem(STORE,JSON.stringify({...M,draft:{},dirty:false,error:'',toast:'',checked:[],scenario:'happy',lab:M.lab?{...M.lab,form:{},marks:{},dirtyMarks:false}:undefined}))}catch{persistAvailable=false}}
function current(){return M.academies.find(a=>a.id===M.selected)||null}
function permitted(){return M.persona==='owner'&&current()?.owner==='accepted'&&M.scenario!=='restricted'}
function eventRecord(action,target){M.events.unshift({ref:'SIM-OP-'+String(M.seq++).padStart(4,'0'),action,target,time:'2026-10-23T12:00:00Z'});persist();return M.events[0].ref}
function filtered(){return M.academies.filter(a=>a.name.toLowerCase().includes(M.query.toLowerCase())&&(M.filter!=='pending'||a.owner==='pending'))}
function changePage(page){if(M.dirty){ask(t('unsaved'),t('unsavedCopy'),()=>{M.dirty=false;M.draft={};if(M.studioActive&&typeof studioDrafts!=='undefined')studioDrafts[M.page]={};if(M.labActive&&M.lab){M.lab.form={};M.lab.marks={};M.lab.dirtyMarks=false}M.error='';M.page=page;M.scenario='happy';render(true)})}else{M.page=page;M.error='';M.toast='';M.scenario='happy';render(true)}}
function announce(msg){document.getElementById('announcement').textContent=msg}
