// Server-only historian client. Reuses the request shape from the original
// index.js but injects the Bearer token from the environment so it never
// reaches the browser.

import axios from 'axios';
import { TAG_FULLNAMES } from './tags.js';

const BASE =
  process.env.PI_API_BASE ||
  'http://10.156.116.179:4516/api/datasets/dressings/data';

// Fetch a specific set of historian tag fullnames over [unixStart, unixEnd].
// Callers pass the tag group they need (e.g. blending vs wastewise) so each
// query only carries the tags it uses.
export async function fetchHistorian(unixStart, unixEnd, fullnames = TAG_FULLNAMES) {
  const token = process.env.PI_BEARER_TOKEN;
  const useAuth =
    token && token !== 'replace-with-real-token' && token.trim() !== '';

  const params = new URLSearchParams();
  fullnames.forEach((t) => params.append('tagname', t));
  params.append('unixStart', String(unixStart));
  params.append('unixEnd', String(unixEnd));

  const headers = { Accept: 'application/json' };
  if (useAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASE}?${params.toString()}`,
    headers,
    timeout: 30000,
  });
  return response.data;
}
