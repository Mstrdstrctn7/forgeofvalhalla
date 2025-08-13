import React from "react";
export function SafeRender({ value, fallback="…" }){
  if (value == null) return fallback;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return String(value);
  // Don’t crash the tree; show a small pill and log to console to find source
  console.warn("[SafeRender] Non-primitive rendered:", value);
  return <code style={{
    background:"#1d1d1d", color:"#ffc",
    padding:"1px 6px", borderRadius:"8px", fontSize:12
  }}>{summarize(value)}</code>;
}
function summarize(v){
  if (v instanceof Promise) return "[Promise]";
  if (v instanceof Error) return v.message || "[Error]";
  if (Array.isArray(v)) return `[Array(${v.length})]`;
  if (v && v.constructor && v.constructor.name && v.constructor.name !== "Object") return `[${v.constructor.name}]`;
  try { return JSON.stringify(v).slice(0,120) + (JSON.stringify(v).length>120?"…":""); } catch { return "[object]"; }
}
