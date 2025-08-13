import { renderToStream } from '@builder.io/qwik/server';
import Root from './root';

export default function (opts: any) {
  return renderToStream(<Root />, opts);
}

