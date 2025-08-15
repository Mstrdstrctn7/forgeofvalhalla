import { Link, Route, Routes } from "react-router-dom";

function Home() {
  return (
    <div style={{padding:"16px"}}>
      <h1>Forge of Valhalla</h1>
      <p>Clean bootstrap is live.</p>
      <nav style={{marginTop:12,display:"flex",gap:"10px"}}>
        <Link to="/market">Go to Market</Link>
      </nav>
    </div>
  );
}

function Market() {
  return (
    <div style={{padding:"16px"}}>
      <h2>Market</h2>
      <p>Wire your chart here next.</p>
    </div>
  );
}

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/market" element={<Market/>} />
    </Routes>
  );
}
