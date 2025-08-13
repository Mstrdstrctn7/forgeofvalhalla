import React from "react";
export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error:null, info:null, open:true }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("UI crash:", error, info); this.setState({ info }); }
  handleReset = () => { this.setState({ error:null, info:null, open:true }); try { window.location.reload(); } catch {} };
  render(){
    const { error, info, open } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{background:"#220",color:"#ffd6d6",padding:"12px"}}>
        <b>UI crash:</b> <span style={{whiteSpace:"pre-wrap"}}>{String(error?.message||error)}</span>
        {info?.componentStack && open && (
          <pre style={{whiteSpace:"pre-wrap",fontSize:12,opacity:.9,marginTop:8}}>{info.componentStack.trim()}</pre>
        )}
        <div style={{marginTop:8,display:"flex",gap:8}}>
          <button onClick={()=>this.setState({open:!open})} style={{ padding:"6px 10px" }}>Toggle stack</button>
          <button onClick={this.handleReset} style={{ padding:"6px 10px" }}>Reload</button>
        </div>
      </div>
    );
  }
}
