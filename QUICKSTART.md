# Quick Start

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Run

### Start Backend

```bash
cd backend
python app.py
```

Server starts at `http://localhost:8000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Dashboard opens at `http://localhost:5173`

## Access

- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Default Pairs

- BTC/USDT
- ETH/USDT
- BNB/USDT
- SOL/USDT

Data starts streaming immediately from Binance WebSocket. Historical candles load on startup so analytics are available right away.
