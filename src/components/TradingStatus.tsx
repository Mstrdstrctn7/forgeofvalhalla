import { useEffect, useState } from "react";
import supa from "../lib/supa";

export default function TradingStatus(){
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    supa.auth.getSession().then(({data}) => setLogged(!!data.session));
  }, []);
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${logged ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <span className="text-sm opacity-80">{logged ? 'Signed In' : 'Login Required'}</span>
    </div>
  );
}
