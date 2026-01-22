import { createServer, IncomingMessage, ServerResponse } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { WebSocketServer, WebSocket } from 'ws';

const execAsync = promisify(exec);

const GT_WORKSPACE = process.env.GT_WORKSPACE ?? `${process.env.HOME}/gt`;
const PORT = parseInt(process.env.API_PORT ?? '3001', 10);
const WS_BROADCAST_INTERVAL_MS = 10000;

interface ConvoyListItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface ConvoyStatus {
  id: string;
  title: string;
  status: string;
  tracked: unknown[] | null;
  completed: number;
  total: number;
  created_at?: string;
}

async function runGtCommand(command: string): Promise<string> {
  const { stdout } = await execAsync(`cd ${GT_WORKSPACE} && gt ${command}`);
  return stdout;
}

async function getConvoyList(): Promise<ConvoyListItem[]> {
  const output = await runGtCommand('convoy list --all --json');
  return JSON.parse(output) as ConvoyListItem[];
}

async function getConvoyStatus(id: string): Promise<ConvoyStatus> {
  const output = await runGtCommand(`convoy status ${id} --json`);
  return JSON.parse(output) as ConvoyStatus;
}

async function getAllConvoyStatuses(): Promise<ConvoyStatus[]> {
  const list = await getConvoyList();
  const statuses = await Promise.all(
    list.map(async (convoy) => {
      const status = await getConvoyStatus(convoy.id);
      return {
        ...status,
        created_at: convoy.created_at,
      };
    })
  );
  return statuses;
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: ServerResponse, data: unknown): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/api/convoys') {
    const convoys = await getAllConvoyStatuses();
    sendJson(res, convoys);
    return;
  }

  if (url.pathname === '/api/convoy-list') {
    const list = await getConvoyList();
    sendJson(res, list);
    return;
  }

  if (url.pathname.startsWith('/api/convoy/')) {
    const id = url.pathname.replace('/api/convoy/', '');
    const status = await getConvoyStatus(id);
    sendJson(res, status);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = createServer((req, res) => void handleRequest(req, res));

const wss = new WebSocketServer({ server });

async function broadcastConvoys(): Promise<void> {
  const convoys = await getAllConvoyStatuses();
  const message = JSON.stringify({ type: 'convoys', data: convoys });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  void getAllConvoyStatuses().then((convoys) => {
    ws.send(JSON.stringify({ type: 'convoys', data: convoys }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString()) as { type: string };
    console.log('Received message:', message.type);
    if (message.type === 'refresh') {
      console.log('Broadcasting refresh to all clients');
      void broadcastConvoys();
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

setInterval(() => void broadcastConvoys(), WS_BROADCAST_INTERVAL_MS);

server.listen(PORT, () => {
  console.log(`Gas Town API server running at http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
  console.log(`Using workspace: ${GT_WORKSPACE}`);
});
