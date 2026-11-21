export default function WorkspacePanelIcon({side,expanded,arabic}:{
  side:'start'|'end'; expanded:boolean; arabic:boolean;
}) {
  const onRight=arabic===(side==='start');
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
    style={onRight?{transform:'scaleX(-1)'}:undefined}>
    <rect x="3" y="4.5" width="18" height="15" rx="2"/>
    <path d="M9 4.5v15"/>
    <path d={expanded?'m16 9-3 3 3 3':'m13 9 3 3-3 3'}/>
  </svg>;
}
