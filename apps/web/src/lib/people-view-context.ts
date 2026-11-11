/** A bounded navigation hint, never a cached player or operation authority. */
export type PeopleViewContext = {
  search: string;
  selection: string|null;
  position: {generation:string;page:number;offset:number}|null;
};

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function decodePeopleViewContext(raw:string|null):PeopleViewContext|null {
  try {
    if(!raw||raw.length>1024)return null;
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value)||
      Object.keys(value).sort().join(',')!=='position,search,selection'||
      typeof value.search!=='string'||value.search.length>160||
      (value.selection!==null&&(typeof value.selection!=='string'||!uuid.test(value.selection))))return null;
    const position=value.position;
    if(position!==null&&(!position||typeof position!=='object'||Array.isArray(position)||
      Object.keys(position).sort().join(',')!=='generation,offset,page'||
      typeof position.generation!=='string'||!uuid.test(position.generation)||
      !Number.isInteger(position.page)||position.page<0||position.page>1000000||
      !Number.isInteger(position.offset)||position.offset<0||position.offset>=50))return null;
    return {search:value.search,selection:value.selection,position};
  } catch {return null;}
}
