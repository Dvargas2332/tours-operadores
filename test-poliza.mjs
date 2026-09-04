import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

const BASE = 'http://localhost:3000';
let cookie = '';

function fetchConCookie(input, init) {
  const headers = new Headers(init?.headers);
  if (cookie) headers.set('cookie', cookie);
  return globalThis.fetch(input, { ...init, headers, credentials: 'include' }).then((resp) => {
    const sc = resp.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return resp;
  });
}

const client = createTRPCClient({ links: [httpBatchLink({ url: BASE + '/api/trpc', transformer: superjson, fetch: fetchConCookie })] });
await client.auth.login.mutate({ usuario: 'admin', contrasena: 'tourhub' });

const name = 'poliza-responsabilidad-civil-hasta-21-abril-2027-poliza-1788532478576-g9jw1h.pdf';

const staticRes = await fetchConCookie(BASE + '/uploads/operadores/polizas/' + name);
console.log('STATIC  status:', staticRes.status, '| type:', staticRes.headers.get('content-type'), '| disp:', staticRes.headers.get('content-disposition'));

const previewRes = await fetchConCookie(BASE + '/api/poliza-preview/' + name);
console.log('PREVIEW status:', previewRes.status, '| type:', previewRes.headers.get('content-type'), '| disp:', previewRes.headers.get('content-disposition'));
