import { useEffect, useState } from "react";
export default function TradingStatus(){
  const [s,setS]=useState<"ok"|"disabled"|"unauth"|"error">("disabled");
  async function probe(){
    try{
      const r = await fetch("/.netlify/functions/accountSummary");
      if (r.status===200) return setS("ok");
      if (r.status===403) return setS("disabled");
      if (r.status===401) return setS("unauth");
      setS("error");
    }catch{ setS("error"); }
  }
  useEffect(()=>{ probe(); const id=setInterval(probe,15000); return ()=>clearInterval(id); },[]);
  const map={ok:["#10b981","Trading Ready"],disabled:["#ef4444","Trading Disabled"],unauth:["#f59e0b","Login Required"],error:["#ef4444","Endpoint Error"]}[s];
  return (<div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:999,background:"#0b0b0b",border:"1px solid #222"}}>
    <span style={{width:10,height:10,borderRadius:999,background:map[0] as string}}/> <span style={{fontSize:12}}>{map[1]}</span>
  </div>);
}
