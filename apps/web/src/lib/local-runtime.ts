// A launcher identity, not authentication or domain readiness. Never enabled on a host deployment.
export function localRuntime(env:Record<string,string|undefined>,origin:string){
  if(env.VERCEL||!['http://localhost:3000','http://localhost:3100'].includes(origin))return null;
  let value;
  try{value=JSON.parse(env.ACADEMYOS_LOCAL_RUNTIME??'');}catch{return null;}
  if(!value||!['dev','production'].includes(value.mode)||
    !/^[a-f0-9-]{36}$/.test(value.instance??'')||
    (value.mode==='production'&&(!/^[a-f0-9]{64}$/.test(value.sourceHash??'')||typeof value.buildId!=='string')))return null;
  return {instance:value.instance,mode:value.mode,sourceHash:value.mode==='production'?value.sourceHash:null,
    buildId:value.mode==='production'?value.buildId:null};
}
