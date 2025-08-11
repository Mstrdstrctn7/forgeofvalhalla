import React from "react";
import { supabase } from "../supabaseClient";

export default function LogoutButton() {
  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    window.location.href = "/login";
  };
  return (
    <button onClick={signOut} style={{padding:"8px 12px",borderRadius:8}}>
      Log out
    </button>
  );
}
