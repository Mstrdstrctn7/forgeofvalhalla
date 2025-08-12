import { Component, type ReactNode } from "react";
type Props = { children: ReactNode };
type State = { err?: string };
export default class ErrorBoundary extends Component<Props, State> {
  state: State = {};
  static getDerivedStateFromError(e: any) { return { err: e?.message || String(e) }; }
  componentDidCatch(e: any, info: any) { console.error("UI error:", e, info); }
  render() {
    if (this.state.err) return (
      <div style={{ padding:16 }}>
        <h2 style={{color:"#f87171"}}>UI Error</h2>
        <pre style={{whiteSpace:"pre-wrap"}}>{this.state.err}</pre>
      </div>
    );
    return this.props.children;
  }
}
