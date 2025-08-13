import { render } from '@builder.io/qwik';
import Root from './root';

// Use the newer object form when available; fallback to old signature
try {
  // @ts-ignore - runtime feature detection
  render({ roots: [{ node: document.getElementById('root')!, fn: Root }] });
} catch {
  render(document.getElementById('root') as any, <Root />);
}

