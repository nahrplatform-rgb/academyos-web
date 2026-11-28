/** Persisted instants + explicit branch IANA zone; civil-day arithmetic never uses the host zone. */
export function formatCount(locale: string, count: number) {
 if(!Number.isSafeInteger(count)||count<0)return locale==='ar'?'غير متاح':'Unavailable';
 return new Intl.NumberFormat(locale==='ar'?'ar-EG':'en-GB').format(count);
}

/** Count words only: callers still own scope, completeness and saved state. */
export function formatQuantity(locale: string, count: number, noun: 'player'|'session'|'change') {
 const value=formatCount(locale,count);
 if(!Number.isSafeInteger(count)||count<0)return value;
 if(locale!=='ar')return `${value} ${noun}${count===1?'':'s'}`;
 const words={
  player:{zero:'لا يوجد لاعبون',one:'لاعب واحد',two:'لاعبان',few:'لاعبين',many:'لاعبًا',other:'لاعب'},
  session:{zero:'لا تدريبات',one:'تدريب واحد',two:'تدريبان',few:'تدريبات',many:'تدريبًا',other:'تدريب'},
  change:{zero:'لا تغييرات',one:'تغيير واحد',two:'تغييران',few:'تغييرات',many:'تغييرًا',other:'تغيير'},
 }[noun];
 const rule=new Intl.PluralRules('ar-EG').select(count);
 return rule==='zero'||rule==='one'||rule==='two'?words[rule]:`${value} ${words[rule]}`;
}

export function addCivilDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0,10);
}
export function sessionTime(locale: string, timezone: string, start: string, end: string) {
  const language = locale === 'ar' ? 'ar-EG' : 'en-GB';
  const date = new Intl.DateTimeFormat(language,{timeZone:timezone,weekday:'short',day:'numeric',month:'short'}).format(new Date(start));
  const time = new Intl.DateTimeFormat(language,{timeZone:timezone,hour:'numeric',minute:'2-digit'});
  return {date,time:`${time.format(new Date(start))} – ${time.format(new Date(end))}`};
}

export function monthGridStart(day: string) {
 const first=day.slice(0,7)+'-01';const weekday=new Date(`${first}T12:00:00Z`).getUTCDay();return addCivilDays(first,-weekday);
}
export function shiftMonth(day: string, offset: number) {
 const date=new Date(`${day.slice(0,7)}-01T12:00:00Z`);date.setUTCMonth(date.getUTCMonth()+offset);return date.toISOString().slice(0,10);
}

/** Navigation hints are civil dates only, never cached authority or host-local time. */
export function isCivilDay(value: unknown): value is string {
 return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith('0000') && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
}
