import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CapturedCall {
  id: string;
  phoneNumber: string;
  timestamp: number;
  status: 'captured' | 'syncing' | 'synced' | 'failed';
  telegramInfo?: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
    fullName?: string;
  };
}

let callLogs: CapturedCall[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Webhook for Android Bridge (Tasker/MacroDroid)
  app.post("/api/webhook", async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ status: "error", message: "phone_number is required" });
    }

    const newCall: CapturedCall = {
      id: Math.random().toString(36).substr(2, 9),
      phoneNumber: phone_number,
      timestamp: Date.now(),
      status: 'captured'
    };

    callLogs = [newCall, ...callLogs].slice(0, 50);
    console.log(`[Webhook] Captured new call from: ${phone_number}`);
    
    // Automatic sync trigger simulation
    setTimeout(async () => {
      const callIndex = callLogs.findIndex(c => c.id === newCall.id);
      if (callIndex !== -1) {
        callLogs[callIndex].status = 'syncing';
        await new Promise(r => setTimeout(r, 2000));
        
        callLogs[callIndex].telegramInfo = {
          fullName: "User " + phone_number.slice(-4),
          username: "@user_" + Math.random().toString(36).substr(2, 5),
          bio: "Telegram profile captured automatically via CallSync Bridge.",
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone_number}`
        };
        callLogs[callIndex].status = 'synced';
      }
    }, 1000);

    res.json({ status: "ok", callId: newCall.id });
  });

  // Get captured calls
  app.get("/api/calls", (req, res) => {
    res.json(callLogs);
  });

  // Sync with Telegram (Placeholder for the MTProto logic)
  app.post("/api/sync-telegram", async (req, res) => {
    const { callId, apiId, apiHash } = req.body;
    
    const callIndex = callLogs.findIndex(c => c.id === callId);
    if (callIndex === -1) {
      return res.status(404).json({ status: "error", message: "Call not found" });
    }

    callLogs[callIndex].status = 'syncing';

    try {
      // In a real implementation using GramJS (telegram package):
      // const client = new TelegramClient(new StringSession(""), apiId, apiHash, {});
      // await client.start({ ... });
      // const result = await client.invoke(new Api.contacts.ImportContacts({ ... }));
      
      // For this session, we simulate the backend processing with the provided keys
      console.log(`[Telegram] Syncing call ${callId} with API ID ${apiId}`);
      
      // Simulate delay
      await new Promise(r => setTimeout(r, 2500));

      // Mocked result reflecting real-world data retrieval
      const mockResult = {
        fullName: "Alexey Volkov",
        username: "@volkov_tech",
        bio: "Senior System Architect. Based in Moscow.",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=volkov"
      };

      callLogs[callIndex].telegramInfo = mockResult;
      callLogs[callIndex].status = 'synced';
      
      res.json({ status: "ok", data: mockResult });
    } catch (error: any) {
      callLogs[callIndex].status = 'failed';
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
