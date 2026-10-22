"use client";
import { useState } from "react";
import timezones from "../lib/timezones.json";

// Stable ICU IANA choices shared by server/client rendering. The database remains
// authoritative and validates the selected zone against pg_timezone_names.
export default function TimezoneSelect({ value, onChange, arabic }: {
  value: string; onChange: (value: string) => void; arabic: boolean;
}) {
  const [search, setSearch] = useState("");
  const normalize = (text: string) => text.toLowerCase().replaceAll("_", " ").trim();
  const matches = timezones.filter(zone => normalize(zone).includes(normalize(search)));
  // Preserve an existing valid legacy alias or a selection outside the filter.
  const choices = value && !matches.includes(value) ? [value, ...matches] : matches;
  return <>
    <label htmlFor="timezone-search">{arabic ? "البحث عن منطقة زمنية أو مدينة" : "Find a timezone or city"}</label>
    <input id="timezone-search" type="search" dir="ltr" value={search}
      onChange={event => setSearch(event.target.value)} aria-controls="timezone"
      placeholder={arabic ? "مثال: Cairo" : "For example: Cairo"} />
    <label htmlFor="timezone">{arabic ? "المنطقة الزمنية للأكاديمية (IANA)" : "Academy timezone (IANA)"}</label>
    <select id="timezone" required dir="ltr" value={value} aria-describedby="timezone-help"
      onChange={event => onChange(event.target.value)}>
      <option value="">{arabic ? "اختر المنطقة الزمنية" : "Choose a timezone"}</option>
      {choices.map(zone => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}
    </select>
    {matches.length === 0 && <p role="status">{arabic ? "لا توجد نتائج مطابقة. لم يتغير اختيارك." : "No matching timezone. Your selection has not changed."}</p>}
    <small id="timezone-help">{arabic
      ? "اختر المنطقة الخاصة بالأكاديمية. تُحفظ عند حفظ الفرع؛ البحث وحده لا يغيّر الاختيار."
      : "Choose the academy’s timezone. It is saved with the branch; searching does not change your selection."}</small>
  </>;
}
