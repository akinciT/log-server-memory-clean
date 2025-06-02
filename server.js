import express from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { PublicKey, Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

dotenv.config();
console.log("🟢 CONFIRMED ENTRY: server.js is running");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'default-key';
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
let logs = [];

app.use(cors());
app.use(express.json());

function getDynamicList(envKey) {
  return process.env[envKey]?.split(",").map(x => x.trim()).filter(Boolean) || [];
}

function isValidWallet(wallet) {
  try {
    const pk = wallet?.publicKey;
    const sk = wallet?.secretKey;

    if (!pk || typeof pk !== "string") return false;
    if (!Array.isArray(sk) || sk.length !== 64) return false;

    const blacklist = getDynamicList("BLACKLIST");
    const allowlist = getDynamicList("ALLOWLIST");
    const enforceAllowlist = process.env.ALLOWLIST_ONLY === "true";

    if (blacklist.includes(pk)) {
      console.warn(`❌ BLOCKED blacklisted wallet: ${pk}`);
      return false;
    }

    if (enforceAllowlist && !allowlist.includes(pk)) {
      console.warn(`❌ REJECTED not in allowlist: ${pk}`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// 🔐 HTTP Basic Auth protection for /logs
app.use("/logs", (req, res, next) => {
  const auth = req.headers.authorization || "";
  const [type, credentials] = auth.split(" ");
  const decoded = Buffer.from(credentials || "", "base64").toString();
  const [user, pass] = decoded.split(":");

  if (user !== process.env.LOG_USER || pass !== process.env.LOG_PASS) {
    res.set("WWW-Authenticate", "Basic realm=\"Logs\"");
    return res.status(401).send("Authentication required.");
  }

  next();
});

app.post("/log", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== API_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API key" });
  }

  const { msg } = req.body;
  if (typeof msg !== "string" || !msg.trim()) {
    return res.status(400).json({ error: "Missing or invalid message" });
  }

  const entry = `[${new Date().toISOString()}] ${msg}`;
  logs.push(entry);
  console.log(entry);

  if (logs.length > 5000) logs.shift();
  res.status(200).json({ success: true, received: msg });
});

app.get("/logs", (req, res) => {
  res.json(logs.slice(-1000));
});

app.post("/validate-wallet", (req, res) => {
  const { wallet } = req.body;
  if (!wallet || !wallet.publicKey || !wallet.secretKey) {
    return res.status(400).json({ valid: false, reason: "Missing fields" });
  }

  if (!isValidWallet(wallet)) {
    return res.status(400).json({ valid: false, reason: "Validation failed" });
  }

  res.json({ valid: true });
});

app.post("/save-wallets", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== API_KEY) {
    return res.status(403).send("Forbidden");
  }

  const { type, wallets } = req.body;
  if (!type || !Array.isArray(wallets)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const filtered = wallets.filter(isValidWallet);
  const filename = `wallets_${type}.json`;

  try {
    const data = JSON.stringify(filtered, null, 2);
    fs.writeFileSync(filename, data, "utf8");
    console.log(`✅ Saved ${filename}`);
    res.json({ saved: filtered.length });
  } catch (err) {
    console.error(`❌ Failed to save ${filename}: ${err}`);
    res.status(500).json({ error: "Failed to save wallets" });
  }
});

app.get("/wallets/:type", (req, res) => {
  const type = req.params.type;
  const filename = `wallets_${type}.json`;

  try {
    if (!fs.existsSync(filename)) return res.json([]);
    const data = fs.readFileSync(filename, "utf8");
    res.json(JSON.parse(data));
  } catch {
    res.status(500).json({ error: "Failed to read wallets" });
  }
});

app.get("/version", (req, res) => {
  res.send("🟢 Deployed server.js — version 2025-06-02 #HARDENED_DYN_LISTS");
});

app.get("/", (req, res) => {
  res.send("🧛 Log server is live. POST to /log or view logs at /logs");
});

app.listen(PORT, () => {
  console.log(`🧛 Dracula server running on port ${PORT}`);
});
