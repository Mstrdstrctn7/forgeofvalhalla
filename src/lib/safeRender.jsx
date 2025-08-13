import React from "react";
function summarize(v){
  if (v === null || v === undefined) return String(v);
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}
function SafeRender({ value }){
  return (
    <code style={{
      background: "#1d1d1d",
      color: "#ffc",
      padding: "1px 6px",
      borderRadius: 8,
      fontSize: 12,
      whiteSpace: "pre-wrap"
    }}>
      {summarize(value)}
    </code>
  );
}
export { SafeRender };
export default SafeRender;
