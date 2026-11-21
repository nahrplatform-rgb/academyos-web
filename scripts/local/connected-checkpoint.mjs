// Run this read-only function through the task's own browse MCP session. It
// requires the actual signed-in browser and never exports cookies or tokens.
export async function connectedCheckpoint(page,expected){
  return page.evaluate(async wanted=>{
    if(!['http://localhost:3000','http://localhost:3100'].includes(location.origin))throw new Error('Wrong local origin.');
    const runtimeReply=await fetch('/api/local-runtime',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!runtimeReply.ok)throw new Error('Runtime identity unavailable: '+runtimeReply.status);
    const runtime=await runtimeReply.json();
    if(runtime.instance!==wanted.instance||runtime.mode!==wanted.mode||
      (wanted.mode==='production'&&(runtime.buildId!==wanted.buildId||runtime.sourceHash!==wanted.sourceHash)))throw new Error('Wrong or stale local runtime.');
    const reply=await fetch('/api/onboarding',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'context'}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!reply.ok)throw new Error('Signed-in workspace lookup failed: '+reply.status+'; '+(reply.headers.get('server-timing')??'no phase timing'));
    const value=await reply.json();
    if(!value.data?.memberships?.some(m=>m.academy_id===wanted.academy&&m.role===wanted.role))throw new Error('Expected membership is absent from the loaded context; do not switch account or infer an empty academy.');
    return {status:'passed',origin:location.origin,mode:runtime.mode,instance:runtime.instance,buildId:runtime.buildId,
      academy:wanted.academy,role:wanted.role,lookupStatus:reply.status,timing:reply.headers.get('server-timing'),
      scope:'Actual signed-in canonical lookup; separate route/control/write assertions remain required.'};
  },expected);
}
if(process.argv.includes('--browser-code'))console.log(connectedCheckpoint.toString());
