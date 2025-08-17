import * as Mod from './ErrorBoundary.jsx';
import React from 'react';

const EB =
  Mod.default ||
  Mod.ErrorBoundary ||
  class CatchAllBoundary extends React.Component {
    constructor(props){ super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error){ return { error }; }
    render(){
      if (this.state.error) {
        const err = this.state.error;
        return (
          <div style={{padding:20,fontFamily:"monospace",color:"#b00020"}}>
            <h3>💥 Runtime Error</h3>
            <pre style={{whiteSpace:"pre-wrap"}}>{String(err)}</pre>
            {err && err.stack && (
              <details open>
                <summary>stack</summary>
                <pre style={{whiteSpace:"pre-wrap"}}>{err.stack}</pre>
              </details>
            )}
          </div>
        );
      }
      return this.props.children;
    }
  };

export default EB;
export const ErrorBoundary = EB;
