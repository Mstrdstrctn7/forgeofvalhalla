import React from "react";

export default class ProdErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error:null, info:null, offender:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){
    // Try to capture a value that might have caused the crash if one was passed via props
    const offender = this.props?.__dbgOffender;
    this.setState({ info, offender });
    // Dump everything to console for stack navigation
    console.error("[ProdErrorBoundary] error:", error);
    console.error("[ProdErrorBoundary] componentStack:", info?.componentStack);
    if (offender !== undefined) console.error("[ProdErrorBoundary] offender value:", offender);
  }
  render(){
    if (!this.state.error) return this.props.children;
    const boxStyle = {
      background:"#2b1a1a", color:"#ffd8d8", padding:"12px", border:"1px solid #a33",
      borderRadius:"10px", margin:"12px", fontFamily:"ui-monospace, monospace", whiteSpace:"pre-wrap"
    };
    return (
      <div style={boxStyle}>
        <div style={{fontWeight:700, marginBottom:6}}>⚠ React runtime error (prod)</div>
        <div><b>Message:</b> {String(this.state.error?.message || this.state.error)}</div>
        {this.state.info?.componentStack && (
          <div style={{marginTop:8}}><b>Component stack:</b>{this.state.info.componentStack}</div>
        )}
        {this.state.offender !== undefined && (
          <div style={{marginTop:8}}>
            <b>Offending value (stringified):</b>
            <pre style={{whiteSpace:"pre-wrap"}}>{safeStringify(this.state.offender)}</pre>
          </div>
        )}
      </div>
    );
  }
}

function safeStringify(v){
  try{
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v == null) return String(v);
    if (v instanceof Error) return v.stack || v.message;
    return JSON.stringify(v, replacer, 2);
  }catch(e){ return "[unserializable value]"; }
}
function replacer(_, val){
  if (val instanceof Window || val instanceof Document) return `[DOM:${val.constructor.name}]`;
  if (typeof val === "function") return `[function ${val.name||"anonymous"}]`;
  if (val instanceof Promise) return "[Promise]";
  return val;
}
