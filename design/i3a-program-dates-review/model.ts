export type TimeSlot={start:string;end:string};
export type Draft={name:string;from:string;to:string;weekdays:number[];times:Partial<Record<number,TimeSlot>>};
export type DateRow={date:string;start:string;end:string;utcStart:string;utcEnd:string};
export function localCandidates(date:string,time:string,timezone:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return[];
 const desired=date+'T'+time+':00',wall=Date.parse(desired+'Z');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const local=(stamp:number)=>{const p=Object.fromEntries(formatter.formatToParts(stamp).map(v=>[v.type,v.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;};
 const offsets=new Set<number>();for(let h=-36;h<=36;h+=3){const sample=wall+h*3600000;offsets.add(Date.parse(local(sample)+'Z')-sample);}
 return [...offsets].map(o=>wall-o).filter(stamp=>local(stamp)===desired).sort((a,b)=>a-b).map(x=>new Date(x).toISOString());
}
export function rangeInfo(d:Draft){
 const from=Date.parse(d.from+'T00:00:00Z'),to=Date.parse(d.to+'T00:00:00Z'),days=(to-from)/86400000+1;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.from)||!/^\d{4}-\d{2}-\d{2}$/.test(d.to)||!Number.isFinite(days)||new Date(from).toISOString().slice(0,10)!==d.from||new Date(to).toISOString().slice(0,10)!==d.to||days<1)return null;
 const firstDay=new Date(from).getUTCDay();
 const total=d.weekdays.reduce((n,weekday)=>{const offset=(weekday-firstDay+7)%7;return n+(offset<days?Math.floor((days-1-offset)/7)+1:0);},0);
 return{from,to,days,total,windows:Math.ceil(days/28)};
}
export function previewDates(d:Draft,timezone:string,windowIndex=0):{dates:DateRow[];error?:string;date?:string}{
 if(!d.name.trim()||!d.from||!d.to||!d.weekdays.length)return{dates:[],error:'required'};
 const info=rangeInfo(d);if(!info||!Number.isInteger(windowIndex)||windowIndex<0||windowIndex>=info.windows)return{dates:[],error:'range'};
 if(d.weekdays.some(day=>!Number.isInteger(day)||day<0||day>6)||new Set(d.weekdays).size!==d.weekdays.length)return{dates:[],error:'required'};
 for(const day of d.weekdays){const slot=d.times[day];if(!slot||!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end))return{dates:[],error:'required'};if(slot.end<=slot.start)return{dates:[],error:'overnight'};}
 if(!info.total)return{dates:[],error:'empty'};
 const from=info.from+windowIndex*28*86400000,to=Math.min(info.to,from+27*86400000),dates:DateRow[]=[];
 for(let v=from;v<=to;v+=86400000){if(!d.weekdays.includes(new Date(v).getUTCDay()))continue;const date=new Date(v).toISOString().slice(0,10),slot=d.times[new Date(v).getUTCDay()]!,start=localCandidates(date,slot.start,timezone),end=localCandidates(date,slot.end,timezone);
  if(start.length!==1||end.length!==1)return{dates:[],error:'dst',date};
  dates.push({date,start:slot.start,end:slot.end,utcStart:start[0],utcEnd:end[0]});
 }
 return{dates};
}
