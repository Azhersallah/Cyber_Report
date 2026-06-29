// ============================================
// DURABLE OBJECT - LICENSE MANAGER
// All data in DO storage, WebSocket = online status
// ============================================

export interface Env {
  LICENSE_TOKEN_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  LICENSE_SESSIONS: DurableObjectNamespace;
}

interface User {
  machineId: string;
  customerName: string;
  activated: boolean;
  appVersion: string | null;
  createdAt: string;
  activatedAt: string | null;
  deactivatedAt: string | null;
  lastActive: string;
  tokenVersion: string | null;
  updateNotification: any | null;
}

interface Session {
  email: string;
  createdAt: string;
  expiresAt: string;
}

interface WebSocketMeta {
  machineId: string;
  type: 'desktop' | 'admin';
  connectedAt: number;
  lastPing: number; // Track last ping time for timeout detection
}

const TOKEN_VERSION = "v2";
const PING_TIMEOUT_MS = 180000; // 3 minutes - if no ping received, consider offline (increased from 60s to match new 2min ping interval)

export class LicenseSession {
  private state: DurableObjectState;
  private env: Env;
  private connections: Map<WebSocket, WebSocketMeta> = new Map();
  private adminConnections: Set<WebSocket> = new Set();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // Restore WebSocket connections on wake - only keep OPEN connections
    this.state.getWebSockets().forEach(ws => {
      const meta = ws.deserializeAttachment() as WebSocketMeta;
      if (meta && ws.readyState === WebSocket.OPEN) {
        this.connections.set(ws, meta);
        if (meta.type === 'admin') this.adminConnections.add(ws);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(url);
    }

    // HTTP API
    if (request.method === 'POST') {
      const body = await request.json() as any;
      return this.handleAction(body);
    }

    if (url.pathname === '/online-status') {
      return this.getOnlineStatus();
    }

    return new Response('Not Found', { status: 404 });
  }

  // ========== WEBSOCKET ==========
  private handleWebSocket(url: URL): Response {
    const machineId = url.searchParams.get('machineId');
    const type = (url.searchParams.get('type') || 'desktop') as 'desktop' | 'admin';

    if (!machineId) {
      return Response.json({ error: 'machineId required' }, { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const meta: WebSocketMeta = { machineId, type, connectedAt: Date.now(), lastPing: Date.now() };
    
    this.state.acceptWebSocket(server);
    server.serializeAttachment(meta);
    this.connections.set(server, meta);

    if (type === 'admin') {
      this.adminConnections.add(server);
      setTimeout(() => this.sendOnlineList(server), 100);
    } else {
      this.broadcastToAdmins('user-online', { machineId, connectedAt: meta.connectedAt });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);
      const meta = this.connections.get(ws);
      if (!meta) return;

      if (data.type === 'ping') {
        // Update lastPing time for desktop connections
        meta.lastPing = Date.now();
        ws.serializeAttachment(meta);
        this.connections.set(ws, meta);
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      } else if (data.type === 'get-online-list' && meta.type === 'admin') {
        this.sendOnlineList(ws);
      } else if (data.type === 'get-users' && meta.type === 'admin') {
        // Send full user list via WebSocket (0 HTTP requests!)
        const users = await this.getAllUsers();
        const online = this.getOnlineUsers();
        ws.send(JSON.stringify({ 
          type: 'users-list', 
          users: users.map(u => ({ ...u, isOnline: online.includes(u.machineId) })),
          serverTime: Date.now()
        }));
      } else if (meta.type === 'admin') {
        // Handle admin commands via WebSocket (0 HTTP requests!)
        await this.handleAdminCommand(ws, data);
      }
    } catch {}
  }

  // Handle admin commands via WebSocket
  private async handleAdminCommand(ws: WebSocket, data: any) {
    const { type, machineId, customerName, purchaseState, requestId } = data;
    
    try {
      if (type === 'activate') {
        let user = await this.getUser(machineId);
        if (user) {
          await this.updateUser(machineId, { activated: true, activatedAt: this.now() });
        } else {
          await this.createUser(machineId, { activated: true, activatedAt: this.now() });
        }
        
        // Send real-time activation notification to connected desktop
        this.sendToDesktop(machineId, { type: 'license-activated' });
        
        // Broadcast updated user list to all admins
        await this.broadcastUserListUpdate();
        
        // Send success response to requesting admin
        ws.send(JSON.stringify({ 
          type: 'command-response', 
          requestId, 
          success: true, 
          action: 'activate',
          machineId 
        }));
        
      } else if (type === 'deactivate') {
        await this.updateUser(machineId, { activated: false, deactivatedAt: this.now() });
        
        // Send real-time revoke notification to connected desktop
        this.sendToDesktop(machineId, { type: 'license-revoked' });
        
        // Broadcast updated user list to all admins
        await this.broadcastUserListUpdate();
        
        // Send success response
        ws.send(JSON.stringify({ 
          type: 'command-response', 
          requestId, 
          success: true, 
          action: 'deactivate',
          machineId 
        }));
        
      } else if (type === 'update-user') {
        let user = await this.getUser(machineId);
        if (user) {
          await this.updateUser(machineId, { 
            customerName: customerName ?? user.customerName,
            activated: purchaseState !== undefined ? purchaseState : user.activated
          });
        } else {
          await this.createUser(machineId, { customerName, activated: !!purchaseState });
        }
        
        // Broadcast updated user list to all admins
        await this.broadcastUserListUpdate();
        
        // Send success response
        ws.send(JSON.stringify({ 
          type: 'command-response', 
          requestId, 
          success: true, 
          action: 'update-user',
          machineId 
        }));
        
      } else if (type === 'delete-user') {
        await this.state.storage.delete(`user:${machineId}`);
        
        // Broadcast updated user list to all admins
        await this.broadcastUserListUpdate();
        
        // Send success response
        ws.send(JSON.stringify({ 
          type: 'command-response', 
          requestId, 
          success: true, 
          action: 'delete-user',
          machineId 
        }));
      }
    } catch (error: any) {
      // Send error response
      ws.send(JSON.stringify({ 
        type: 'command-response', 
        requestId, 
        success: false, 
        error: error.message || 'Unknown error' 
      }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    const meta = this.connections.get(ws);
    if (meta) {
      this.connections.delete(ws);
      if (meta.type === 'admin') {
        this.adminConnections.delete(ws);
      } else {
        this.broadcastToAdmins('user-offline', { machineId: meta.machineId });
      }
    }
  }

  async webSocketError(ws: WebSocket) {
    this.webSocketClose(ws);
  }

  private getOnlineUsers(): string[] {
    const online: string[] = [];
    const staleConnections: WebSocket[] = [];
    const now = Date.now();
    
    this.connections.forEach((meta, ws) => {
      if (meta.type === 'desktop') {
        // Check if connection is open AND has pinged recently
        const isOpen = ws.readyState === WebSocket.OPEN;
        const hasRecentPing = (now - meta.lastPing) < PING_TIMEOUT_MS;
        
        if (isOpen && hasRecentPing) {
          online.push(meta.machineId);
        } else {
          // Mark stale connection for cleanup (closed or no recent ping)
          staleConnections.push(ws);
        }
      }
    });
    
    // Clean up stale connections
    staleConnections.forEach(ws => {
      const meta = this.connections.get(ws);
      this.connections.delete(ws);
      if (meta) {
        this.broadcastToAdmins('user-offline', { machineId: meta.machineId });
        // Close the WebSocket if it's still open but timed out
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(1000, 'Ping timeout'); } catch {}
        }
      }
    });
    
    return online;
  }

  private getOnlineStatus(): Response {
    const online = this.getOnlineUsers();
    return Response.json({ online, count: online.length });
  }

  private sendOnlineList(ws: WebSocket) {
    const users: { machineId: string; connectedAt: number }[] = [];
    const staleConnections: WebSocket[] = [];
    const now = Date.now();
    
    this.connections.forEach((meta, conn) => {
      if (meta.type === 'desktop') {
        const isOpen = conn.readyState === WebSocket.OPEN;
        const hasRecentPing = (now - meta.lastPing) < PING_TIMEOUT_MS;
        
        if (isOpen && hasRecentPing) {
          users.push({ machineId: meta.machineId, connectedAt: meta.connectedAt });
        } else {
          staleConnections.push(conn);
        }
      }
    });
    
    // Clean up stale connections
    staleConnections.forEach(conn => {
      const meta = this.connections.get(conn);
      this.connections.delete(conn);
      if (meta) {
        this.broadcastToAdmins('user-offline', { machineId: meta.machineId });
        if (conn.readyState === WebSocket.OPEN) {
          try { conn.close(1000, 'Ping timeout'); } catch {}
        }
      }
    });
    
    ws.send(JSON.stringify({ type: 'online-list', users }));
  }

  private broadcastToAdmins(event: string, data: any) {
    const msg = JSON.stringify({ type: event, ...data, ts: Date.now() });
    this.adminConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }

  // Broadcast user list changes to all admins
  private async broadcastUserListUpdate() {
    const users = await this.getAllUsers();
    const online = this.getOnlineUsers();
    const msg = JSON.stringify({ 
      type: 'users-list-updated', 
      users: users.map(u => ({ ...u, isOnline: online.includes(u.machineId) })),
      serverTime: Date.now()
    });
    this.adminConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }

  // Send message to specific desktop by machineId
  private sendToDesktop(machineId: string, data: any) {
    const msg = JSON.stringify({ ...data, ts: Date.now() });
    this.connections.forEach((meta, ws) => {
      if (meta.type === 'desktop' && meta.machineId === machineId && ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  }

  // ========== HTTP ACTIONS ==========
  private async handleAction(body: any): Promise<Response> {
    const { action, machineId, token, appVersion, adminEmail, adminPassword, sessionToken } = body;
    const secret = this.env.LICENSE_TOKEN_SECRET || 'PPro-Default-Secret';

    // Login
    if (action === 'login') {
      if (!await this.verifyAdmin(adminEmail, adminPassword)) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const sid = await this.createSession(adminEmail);
      return Response.json({ success: true, sessionToken: sid, email: adminEmail });
    }

    // Verify session
    if (action === 'verify-session') {
      const session = await this.getSession(sessionToken);
      return Response.json({ valid: !!session, email: session?.email });
    }

    // Logout
    if (action === 'logout') {
      if (sessionToken) await this.state.storage.delete(`session:${sessionToken}`);
      return Response.json({ success: true });
    }

    // Admin actions require auth
    const adminActions = ['activate', 'deactivate', 'list-users', 'update-user', 'delete-user', 'set-update-notification'];
    if (adminActions.includes(action)) {
      let authed = false;
      if (sessionToken) {
        const s = await this.getSession(sessionToken);
        authed = !!s;
      } else if (adminEmail && adminPassword) {
        authed = await this.verifyAdmin(adminEmail, adminPassword);
      }
      if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify license
    if (action === 'verify') {
      const user = await this.getUser(machineId);
      if (user?.activated) {
        const newToken = await this.generateToken(machineId, secret);
        await this.updateUser(machineId, { lastActive: this.now(), tokenVersion: TOKEN_VERSION, appVersion });
        return Response.json({ activated: true, token: newToken });
      }
      if (user) {
        await this.updateUser(machineId, { lastActive: this.now(), appVersion });
        return Response.json({ activated: false });
      }
      return Response.json({ activated: false, notRegistered: true });
    }

    // Refresh token
    if (action === 'refresh') {
      if (!await this.verifyToken(token, machineId, secret)) {
        return Response.json({ error: 'Invalid token', activated: false }, { status: 401 });
      }
      const user = await this.getUser(machineId);
      if (user?.activated) {
        const newToken = await this.generateToken(machineId, secret);
        await this.updateUser(machineId, { lastActive: this.now(), appVersion });
        return Response.json({ activated: true, token: newToken });
      }
      return Response.json({ activated: false, revoked: true });
    }

    // Heartbeat (still supported for backward compat)
    if (action === 'heartbeat') {
      const user = await this.getUser(machineId);
      if (!user) return Response.json({ success: false, notRegistered: true });
      await this.updateUser(machineId, { lastActive: this.now(), appVersion });
      return Response.json({ success: true, activated: user.activated, updateNotification: user.updateNotification });
    }

    // Status
    if (action === 'status') {
      const user = await this.getUser(machineId);
      const online = this.getOnlineUsers();
      if (user) {
        return Response.json({ exists: true, activated: user.activated, isOnline: online.includes(machineId), lastActive: user.lastActive });
      }
      return Response.json({ exists: false, activated: false });
    }

    // Activate
    if (action === 'activate') {
      let user = await this.getUser(machineId);
      if (user) {
        await this.updateUser(machineId, { activated: true, activatedAt: this.now() });
      } else {
        await this.createUser(machineId, { activated: true, activatedAt: this.now() });
      }
      
      // Send real-time activation notification to connected desktop
      this.sendToDesktop(machineId, { type: 'license-activated' });
      
      // Broadcast updated user list to all admins via WebSocket
      await this.broadcastUserListUpdate();
      
      return Response.json({ success: true, activated: true });
    }

    // Deactivate
    if (action === 'deactivate') {
      await this.updateUser(machineId, { activated: false, deactivatedAt: this.now() });
      
      // Send real-time revoke notification to connected desktop
      this.sendToDesktop(machineId, { type: 'license-revoked' });
      
      // Broadcast updated user list to all admins via WebSocket
      await this.broadcastUserListUpdate();
      
      return Response.json({ success: true, activated: false });
    }

    // List users
    if (action === 'list-users') {
      const users = await this.getAllUsers();
      const online = this.getOnlineUsers();
      return Response.json({
        success: true,
        serverTime: Date.now(),
        users: users.map(u => ({ ...u, isOnline: online.includes(u.machineId) }))
      });
    }

    // Update user
    if (action === 'update-user') {
      const { customerName, purchaseState } = body;
      let user = await this.getUser(machineId);
      if (user) {
        await this.updateUser(machineId, { 
          customerName: customerName ?? user.customerName,
          activated: purchaseState !== undefined ? purchaseState : user.activated
        });
      } else {
        await this.createUser(machineId, { customerName, activated: !!purchaseState });
      }
      
      // Broadcast updated user list to all admins via WebSocket
      await this.broadcastUserListUpdate();
      
      return Response.json({ success: true });
    }

    // Delete user
    if (action === 'delete-user') {
      await this.state.storage.delete(`user:${machineId}`);
      
      // Broadcast updated user list to all admins via WebSocket
      await this.broadcastUserListUpdate();
      
      return Response.json({ success: true, deleted: true });
    }

    // Set update notification
    if (action === 'set-update-notification') {
      const { title, message, version, forceUpdate, targetMachineId } = body;
      const notif = { title, message, version, forceUpdate };
      if (targetMachineId) {
        await this.updateUser(targetMachineId, { updateNotification: notif });
      } else {
        await this.state.storage.put('global:updateNotification', notif);
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  // ========== STORAGE HELPERS ==========
  private async getUser(machineId: string): Promise<User | null> {
    return await this.state.storage.get<User>(`user:${machineId}`) || null;
  }

  private async createUser(machineId: string, data: Partial<User>): Promise<void> {
    const user: User = {
      machineId,
      customerName: data.customerName || '',
      activated: data.activated || false,
      appVersion: data.appVersion || null,
      createdAt: this.now(),
      activatedAt: data.activatedAt || null,
      deactivatedAt: null,
      lastActive: this.now(),
      tokenVersion: null,
      updateNotification: null
    };
    await this.state.storage.put(`user:${machineId}`, user);
  }

  private async updateUser(machineId: string, data: Partial<User>): Promise<void> {
    const user = await this.getUser(machineId);
    if (user) {
      await this.state.storage.put(`user:${machineId}`, { ...user, ...data });
    }
  }

  private async getAllUsers(): Promise<User[]> {
    const map = await this.state.storage.list<User>({ prefix: 'user:' });
    return Array.from(map.values());
  }

  private async getSession(sessionId: string): Promise<Session | null> {
    if (!sessionId) return null;
    const session = await this.state.storage.get<Session>(`session:${sessionId}`);
    if (session && new Date(session.expiresAt) > new Date()) return session;
    return null;
  }

  private async createSession(email: string): Promise<string> {
    const id = crypto.randomUUID();
    const session: Session = {
      email,
      createdAt: this.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    await this.state.storage.put(`session:${id}`, session);
    return id;
  }

  private async verifyAdmin(email: string, password: string): Promise<boolean> {
    if (!email || !password) return false;
    const allowedEmail = this.env.ADMIN_EMAIL || 'azhersallah1@gmail.com';
    if (email !== allowedEmail) return false;
    const hash = await this.hashPassword(password);
    const stored = this.env.ADMIN_PASSWORD_HASH || await this.hashPassword('a4z4h4e4r');
    return hash === stored;
  }

  private async hashPassword(password: string): Promise<string> {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async generateToken(machineId: string, secret: string): Promise<string> {
    const data = `${TOKEN_VERSION}:${machineId}:${Date.now()}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return btoa(`${data}:${sigHex}`);
  }

  private async verifyToken(token: string, machineId: string, secret: string): Promise<boolean> {
    try {
      const decoded = atob(token);
      const [version, tokenMachineId, ts, sig] = decoded.split(':');
      if (version !== TOKEN_VERSION || tokenMachineId !== machineId) return false;
      const data = `${version}:${tokenMachineId}:${ts}`;
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
      const expectedHex = Array.from(new Uint8Array(expected)).map(b => b.toString(16).padStart(2, '0')).join('');
      return sig === expectedHex;
    } catch { return false; }
  }

  private now(): string {
    return new Date().toISOString();
  }
}
