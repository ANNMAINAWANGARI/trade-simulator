# 🧩 DEFI SIMULATOR

## 🗞️ What is Defi Simulator?

A full-stack decentralized finance (DeFi) simulation platform that mimics real-world token swaps using live market data from the 1inch aggregation protocol — all without requiring actual blockchain transactions.

---

## 🚀 What It Does

- Authenticates users using JWT-based login/registration
- Initializes a virtual wallet with:
  - 10 ETH + 10 USDC on Ethereum
  - 10 USDC on Polygon
- Uses 1inch's `swap`, `spot price`, and `token` APIs to simulate swaps with live data
- Supports:
  - **Classic swaps** (e.g., ETH → DAI on Ethereum)
  - **Cross-chain swaps** (e.g., USDC on Polygon → ETH on Ethereum)
- Updates wallet balances to reflect the swap outcome
- Shows real-world swap behavior: price impact, slippage, and route variations
- Does **not** execute actual on-chain transactions or require MetaMask

---

## 🛠️ How It Works

1. **User Auth:** Users register/login through a simple backend using JWT. Sessions are persisted client-side using localStorage.
2. **Wallet Simulation:** On first login, a wallet is created and seeded with preset balances. All balances are stored and updated off-chain(Postgresql).
3. **Token Fetching:** The app uses 1inch's Token API to retrieve supported tokens and metadata (symbol, decimals, address).
4. **Swap Execution:**
   - For classic swaps: 1inch’s Swap and Quote APIs are called to calculate realistic output amounts and simulate token routing.
   - For cross-chain swaps: 1inch’s cross-chain endpoints are used to determine transfer equivalents.
5. **Balance Update:** After a simulated swap, balances are updated based on returned values, including consideration for slippage and routing inefficiencies.
6. **Precision Handling:** Inbuilt wallet utility functions are used for accurate handling of decimals, especially between assets like ETH (18 decimals) and USDC (6 decimals).

---

## 🧱 Tech Stack

| Layer         | Technology                          |
|---------------|--------------------------------------|
| Frontend      | Next.js (w/ TailwindCSS for UI)     |
| Backend       | Node.js + Express + Typescript       |
| Auth          | JSON Web Tokens (JWT)                |
| API Provider  | [1inch API](https://portal.1inch.dev/documentation/apis)  |
| State Mgmt    | React Context                        |

---
## 📋 TODO

- [ ] Add transaction history logging per user
- [ ] Add multi-wallet support and chain switcher UI
- [ ] Integrate slippage control and custom gas simulation
- [ ] Improve error handling on bad swap routes
- [ ] Add charting or analytics for token prices over time

---

## Project Scripts

In the project directory, you can run the following:
### `cd backend`
### `npm install`
### `cd client`
### `npm install`


### `/client/.env.local` 
- NEXT_PUBLIC_API_URL=http://localhost:3001

### `/backend/.env` 

### URL to proxy external API requests (1inch)
- PROXY_URL=

### Database connection settings
- DB_USER=
- DB_HOST=
- DB_NAME=
- DB_PASSWORD=
- DB_PORT=

### JWT secret used for signing user tokens
- JWT_SECRET=


### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
