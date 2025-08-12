import supa from "../lib/supa";
export default function Header(){
  return (
    <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px",borderBottom:"1px solid #222"}}>
      <h1 style={{fontSize:18,fontWeight:600}}>Forge of Valhalla</h1>
      <button onClick={async()=>{await supa.auth.signOut(); location.href="/login";}}
        style={{padding:"8px 12px",borderRadius:10,background:"#222",border:"1px solid #333",color:"#fff"}}>
        Sign out
      </button>
    </header>
  );
}
