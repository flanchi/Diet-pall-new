import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 bg-red-50 text-red-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">{this.state.error.message}</p>
          {this.state.info && (
            <pre className="text-xs whitespace-pre-wrap overflow-auto">{this.state.info.componentStack}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
