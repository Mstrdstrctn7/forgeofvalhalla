import { Component, type ReactNode } from "react";
type Props = { children: ReactNode };
type State = { err?: any };
export default class ErrorBoundary extends Component<Props, State> {
  state: State = {};
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any, info: any) { console.error("React error:", err, info); }
  render() {
    if (this.state.err) {
      const msg = this.state.err?.message || String(this.state.err);
      return <div style={{padding:16,color:"#fdd",background:"#200",fontFamily:"monospace",whiteSpace:"pre-wrap"}}>UI Error: {msg}</div>;
    }
    return this.props.children;
  }
}
