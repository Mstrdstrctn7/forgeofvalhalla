// src/debug/ClientErrorOverlay.jsx
import React, { useEffect, useRef, useState } from "react";

const boxStyle = {
  position: "fixed",
  left: "8px",
  bottom: "8px",
  right: "8px",
  maxHeight: "35vh",
  overflow: "auto",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
  color: "#eaeaea",
  background: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "10px",
  padding: "8px 10px",
  zIndex: 2147483647,
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
};

const line = (t, c) => (
  <div style={{ whiteSpace: "pre-wrap", margin: "2px 0", color: c }}>{t}</div>
);

export default function ClientErrorOverlay() {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState([]);
  const lock = useRef(false);

  useEffect(() => {
    // show logs too
    const push = (type, payload, color) => {
      setItems((arr) => [...arr, { type, payload, color, ts: Date.now() }].slice(-300));
    };

    const onErr = (msg, src, lineNo, colNo, error) => {
      push("error", `${msg}\n@ ${src}:${lineNo}:${colNo}\n${error?.stack || ""}`, "#ff8a8a");
      return false;
    };
    const onRej = (e) => {
      push("error", `Unhandled promise rejection: ${e?.reason?.message || e?.reason || e}`, "#ff8a8a");
    };

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    // mirror console.* (without infinite loops)
    const orig = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };
    console.log = (...a) => { orig.log(...a); push("log", a.map(String).join(" "), "#c5e1ff"); };
    console.info = (...a) => { orig.info(...a); push("info", a.map(String).join(" "), "#c5ffd7"); };
    console.warn = (...a) => { orig.warn(...a); push("warn", a.map(String).join(" "), "#ffe9a8"); };
    console.error = (...a) => { orig.error(...a); push("error", a.map(String).join(" "), "#ff8a8a"); };

    // announce
    console.info("[Overlay] console + error overlay active");

    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      console.log = orig.log;
      console.info = orig.info;
      console.warn = orig.warn;
      console.error = orig.error;
    };
  }, []);

  if (!open) return null;

  return (
    <div style={boxStyle}>
      <div style={{ display:"flex", gap:8, marginBottom:6, alignItems:"center" }}>
        <b>Client Overlay</b>
        <button
          onClick={() => setItems([])}
          style={{ marginLeft:"auto", background:"#222", color:"#ddd", border:"1px solid #444", borderRadius:6, padding:"2px 8px" }}
        >
          Clear
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ background:"#2b2b2b", color:"#ddd", border:"1px solid #444", borderRadius:6, padding:"2px 8px" }}
        >
          Hide
        </button>
      </div>
      {items.length === 0 ? line("No messages yet. Trigger something in the app…", "#aaa") :
        items.map((it) => <div key={it.ts}>{line(it.payload, it.color)}</div>)}
    </div>
  );
}
