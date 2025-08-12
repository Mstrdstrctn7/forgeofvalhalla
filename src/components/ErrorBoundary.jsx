import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err){ return { err }; }
  componentDidCatch(err, info){ console.error("React error:", err, info); }
  render(){
    if (this.state.err) {
      return (
        <div style={{padding:16,color:"#fdd",background:"#200",fontFamily:"monospace",whiteSpace:"pre-wrap"}}>
          <b>UI crash:</b> {String(this.state.err.message || this.state.err)}
        </div>
      );
    }
    return this.props.children;
  }
}
