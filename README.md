# 🧛 Dracula Trading Suite

Secure, modular, and high-performance Solana trading + logging suite.

---

## 📦 Modules

| Module                   | Description                          |
|--------------------------|--------------------------------------|
| `dracula-backend`        | Express backend for trading ops      |
| `draculadex-frontend`    | Frontend DEX UI (Vite + JS)          |
| `log-server-memory-clean`| Secure internal logging microservice |

---

## 🔧 Local Setup

1. Clone this repo
2. Copy `.env.example` → `.env` and configure secrets
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run:
   ```bash
   npm start
   ```

---

## ✅ Security Practices

- All `.env` files are gitignored
- Private keys and secrets are never committed
- `.gitignore` and `SECURITY.md` are enforced

---

## 📬 Vulnerability Disclosure

Please report responsibly via `security@yourdomain.com` or open a security advisory on GitHub.

---

> Built with Dracula precision 🦇
