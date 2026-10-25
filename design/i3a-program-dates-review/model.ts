export type Draft={name:string;from:string;to:string;start:string;end:string;weekdays:number[]};
export type DateRow={date:string;start:string;end:string;utcStart:string;utcEnd:string};
export function localCandidates(date:string,time:string,timezone:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return[];
 const desired=date+'T'+time+':00',wall=Date.parse(desired+'Z');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const local=(stamp:number)=>{const p=Object.fromEntries(formatter.formatToParts(stamp).map(v=>[v.type,v.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;};
 const offsets=new Set<number>();for(let h=-36;h<=36;h+=3){const sample=wall+h*3600000;offsets.add(Date.parse(local(sample)+'Z')-sample);}
 return [...offsets].map(o=>wall-o).filter(stamp=>local(stamp)===desired).sort((a,b)=>a-b).map(x=>new Date(x).toISOString());
}
export function previewDates(d:Draft,timezone:string):{dates:DateRow[];error?:string;date?:string}{
 if(!d.name.trim()||!d.from||!d.to||!d.start||!d.end||!d.weekdays.length)return{dates:[],error:'required'};
 const from=Date.parse(d.from+'T00:00:00Z'),to=Date.parse(d.to+'T00:00:00Z'),days=(to-from)/86400000+1;
 if(!Number.isFinite(days)||new Date(from).toISOString().slice(0,10)!==d.from||new Date(to).toISOString().slice(0,10)!==d.to||days<1||days>28)return{dates:[],error:'range'};
 if(d.end<=d.start)return{dates:[],error:'overnight'};
 const dates:DateRow[]=[];
 for(let v=from;v<=to;v+=86400000){if(!d.weekdays.includes(new Date(v).getUTCDay()))continue;const date=new Date(v).toISOString().slice(0,10),start=localCandidates(date,d.start,timezone),end=localCandidates(date,d.end,timezone);
  if(start.length!==1||end.length!==1)return{dates:[],error:'dst',date};
  dates.push({date,start:d.start,end:d.end,utcStart:start[0],utcEnd:end[0]});
 }
 if(!dates.length)return{dates:[],error:'empty'};if(dates.length>20)return{dates:[],error:'count'};
 return{dates};
}
