// ============================================
// CLOUDFLARE WORKERS + DURABLE OBJECTS
// Pure DO - no D1, WebSocket = online status
// ============================================

export { LicenseSession } from './LicenseSession';

export interface Env {
  LICENSE_TOKEN_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  LICENSE_SESSIONS: DurableObjectNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Get Durable Object stub
      const id = env.LICENSE_SESSIONS.idFromName('global');
      const stub = env.LICENSE_SESSIONS.get(id);

      // WebSocket upgrade - pass through to DO
      if (url.pathname === '/ws' || request.headers.get('Upgrade') === 'websocket') {
        return stub.fetch(request);
      }

      // GET online status
      if (url.pathname === '/online-status' && request.method === 'GET') {
        const res = await stub.fetch(new Request('https://do/online-status'));
        const data = await res.json();
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // POST actions - forward to DO
      if (request.method === 'POST') {
        const res = await stub.fetch(request);
        const data = await res.json();
        return new Response(JSON.stringify(data), { 
          status: res.status, 
          headers: corsHeaders 
        });
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: corsHeaders 
      });
    } catch (error: any) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};
