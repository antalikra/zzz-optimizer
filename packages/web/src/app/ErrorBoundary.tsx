import { Component, type ReactNode } from "react";
import { createLogger } from "../lib/logger";

const log = createLogger("error-boundary");

interface State {
  failed: boolean;
}

/** Catches render crashes so the app shows a fallback instead of a white screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    log.error("render crash", error);
  }

  render(): ReactNode {
    if (this.state.failed) return <p>Something broke. Check the logs.</p>;
    return this.props.children;
  }
}
