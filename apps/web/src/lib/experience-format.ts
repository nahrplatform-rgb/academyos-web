/** Persisted instants + explicit branch IANA zone; civil-day arithmetic never uses the host zone. */
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
