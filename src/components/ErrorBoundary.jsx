import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { error: null, info: null, open: false };
  }
  static getDerivedStateFromError(error){
    return { error };
  }
  componentDidCatch(error, info){
    this.setState({ info });
    try {
      window.__FOV_LAST_ERROR__ = {
        message: String(error?.message || error),
        stack: String(error?.stack || ""),
        componentStack: String(info?.componentStack || "")
      };
      // also log to console so it lands in Netlify analytics / browser
      // eslint-disable-next-line no-console
      console.error("[UI crash]", window.__FOV_LAST_ERROR__);
    } catch {}
  }
  handleReset = () => {
    // simplest: full reload; you can replace with route reset if you like
    window.location.reload();
  };
  render(){
    const { error, info, open } = this.state;
    if (!error) return this.props.children;

    const box = {
      background: "#1a1a1a", color: "#ffe08a",
      border: "1px solid rgba(255,208,80,.35)",
      borderRadius: "12px", padding: "12px", margin: "14px"
    };
    const btn = {
      background: "#252525", color: "#ffd54a",
      border: "1px solid #333", borderRadius: "10px",
      padding: "6px 10px", cursor: "pointer"
    };
    const pre = {
      whiteSpace: "pre-wrap", fontSize: 12,
      background: "#0f0f0f", color: "#ddd",
      borderRadius: "8px", padding: "8px", marginTop: "8px"
    };

    return (
      <div style={box}>
        <div style={{fontWeight:700, marginBottom: 6}}>UI crash: {String(error?.message || error)}</div>
        <div style={{fontSize: 12, opacity:.85}}>
          A client error occurred. Use the toggle below to see the stack.
        </div>
        <div style={{marginTop: 8, display: "flex", gap: 8}}>
          <button onClick={()=>this.setState({open:!open})} style={btn}>
            {open ? "Hide stack" : "Show stack"}
          </button>
          <button onClick={this.handleReset} style={btn}>Reload</button>
        </div>
        {open && (
          <div style={{marginTop: 10}}>
            <div style={{fontWeight:600, marginBottom: 4}}>Error stack</div>
            <pre style={pre}>{String(error?.stack || "")}</pre>
            {info?.componentStack ? (
              <>
                <div style={{fontWeight:600, marginTop: 10, marginBottom: 4}}>Component stack</div>
                <pre style={pre}>{String(info.componentStack)}</pre>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  }
}
