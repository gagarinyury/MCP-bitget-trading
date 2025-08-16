# 📋 Bitget API v2 - Complete Reference

Comprehensive documentation for Bitget API v2 endpoints. This API was released in October 2023 and offers improved functionality compared to v1.

## 📚 Table of Contents

- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Rate Limits](#rate-limits)
- [Public Endpoints](#public-endpoints)
- [Spot Trading](#spot-trading)
- [Futures Trading](#futures-trading)
- [Margin Trading](#margin-trading)
- [Additional Services](#additional-services)
- [Error Codes](#error-codes)

## 🔐 Authentication

### Headers Required for Private Endpoints
```
ACCESS-KEY: Your API Key
ACCESS-SIGN: Request signature
ACCESS-TIMESTAMP: Request timestamp
ACCESS-PASSPHRASE: Your passphrase
paptrading: 1 (for demo trading)
```

### Signature Generation
```
sign = base64(hmac-sha256(secretkey, timestamp + method + requestPath + body))
```

## 🌐 Base URLs

- **Production**: `https://api.bitget.com`
- **Demo Trading**: Same URL with `paptrading: 1` header

## ⚡ Rate Limits

- **Public Endpoints**: 20 requests/second
- **Private Trading**: 10 requests/second  
- **Account Management**: 5 requests/second

---

## 🌍 Public Endpoints

### Server Information
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/public/time` | Get server time |
| `GET` | `/api/v2/public/announcements` | Get platform announcements |
| `GET` | `/api/v2/common/trade-rate` | Get trading fees |

---

## 💰 Spot Trading (`/api/v2/spot/`)

### 📊 Market Data

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/spot/market/tickers` | ❌ | Get all spot tickers |
| `GET` | `/api/v2/spot/market/ticker` | ❌ | Get single ticker |
| `GET` | `/api/v2/spot/market/candles` | ❌ | Get spot candles/klines |
| `GET` | `/api/v2/spot/market/fills` | ❌ | Get recent trades |
| `GET` | `/api/v2/spot/market/orderbook` | ❌ | Get order book |
| `GET` | `/api/v2/spot/market/merge-depth` | ❌ | Get merged depth |
| `GET` | `/api/v2/spot/market/support-symbols` | ❌ | Get supported symbols |
| `GET` | `/api/v2/spot/market/fund-net-flow` | ❌ | Get fund net flow data |

#### Example: Get Spot Candles
```http
GET /api/v2/spot/market/candles?symbol=BTCUSDT&granularity=15min&limit=100
```

### 🏦 Account Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/spot/account/info` | ✅ | Get account information |
| `GET` | `/api/v2/spot/account/assets` | ✅ | Get account assets |
| `GET` | `/api/v2/spot/account/subaccount-assets` | ✅ | Get subaccount assets |
| `POST` | `/api/v2/spot/account/upgrade` | ✅ | Upgrade to unified account |
| `GET` | `/api/v2/spot/account/upgrade-status` | ✅ | Get upgrade status |
| `GET` | `/api/v2/spot/account/bills` | ✅ | Get account bills history |

#### Example: Get Account Assets
```http
GET /api/v2/spot/account/assets?coin=USDT
```

### 📈 Spot Trading

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/spot/trade/place-order` | ✅ | Place spot order |
| `POST` | `/api/v2/spot/trade/batch-orders` | ✅ | Place multiple orders |
| `POST` | `/api/v2/spot/trade/cancel-order` | ✅ | Cancel order |
| `POST` | `/api/v2/spot/trade/cancel-symbol-order` | ✅ | Cancel orders by symbol |
| `POST` | `/api/v2/spot/trade/batch-cancel-order` | ✅ | Cancel multiple orders |
| `GET` | `/api/v2/spot/trade/orderInfo` | ✅ | Get order details |
| `GET` | `/api/v2/spot/trade/unfilled-orders` | ✅ | Get open orders |
| `GET` | `/api/v2/spot/trade/history-orders` | ✅ | Get order history |
| `GET` | `/api/v2/spot/trade/fills` | ✅ | Get trade fills |

#### Example: Place Spot Order
```json
POST /api/v2/spot/trade/place-order
{
  "symbol": "BTCUSDT",
  "side": "buy",
  "orderType": "limit",
  "size": "0.001",
  "price": "50000",
  "force": "GTC"
}
```

### 🎯 Plan Orders (Conditional Orders)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/spot/trade/plan/place-order` | ✅ | Place conditional order |
| `POST` | `/api/v2/spot/trade/plan/modify-order` | ✅ | Modify conditional order |
| `POST` | `/api/v2/spot/trade/plan/cancel-order` | ✅ | Cancel conditional order |
| `GET` | `/api/v2/spot/trade/plan/current-plan` | ✅ | Get current plan orders |
| `GET` | `/api/v2/spot/trade/plan/history-plan` | ✅ | Get plan order history |

---

## 🚀 Futures Trading (`/api/v2/mix/`)

### 📊 Market Data

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/mix/market/ticker` | ❌ | Get futures ticker |
| `GET` | `/api/v2/mix/market/tickers` | ❌ | Get all futures tickers |
| `GET` | `/api/v2/mix/market/candles` | ❌ | Get futures candles |
| `GET` | `/api/v2/mix/market/fills` | ❌ | Get recent futures trades |
| `GET` | `/api/v2/mix/market/depth` | ❌ | Get futures order book |
| `GET` | `/api/v2/mix/market/support-symbols` | ❌ | Get supported symbols |
| `GET` | `/api/v2/mix/market/contracts` | ❌ | Get contract information |
| `GET` | `/api/v2/mix/market/funding-time` | ❌ | Get funding time |
| `GET` | `/api/v2/mix/market/history-fund-rate` | ❌ | Get funding rate history |
| `GET` | `/api/v2/mix/market/current-fund-rate` | ❌ | Get current funding rate |
| `GET` | `/api/v2/mix/market/open-interest` | ❌ | Get open interest |
| `GET` | `/api/v2/mix/market/vip-fee-rate` | ❌ | Get VIP fee rates |
| `GET` | `/api/v2/mix/market/long-short` | ❌ | Get long/short ratio data |
| `GET` | `/api/v2/mix/market/account-long-short` | ❌ | Get account long/short data |
| `GET` | `/api/v2/mix/market/oi-limit` | ❌ | Get OI position limits |

#### Example: Get Futures Candles
```http
GET /api/v2/mix/market/candles?symbol=BTCUSDT&productType=USDT-FUTURES&granularity=15m&limit=100
```

### 🏦 Account Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/mix/account/accounts` | ✅ | Get futures accounts |
| `GET` | `/api/v2/mix/account/account` | ✅ | Get specific account |
| `POST` | `/api/v2/mix/account/set-leverage` | ✅ | Set leverage |
| `POST` | `/api/v2/mix/account/set-margin-mode` | ✅ | Set margin mode |
| `POST` | `/api/v2/mix/account/set-position-mode` | ✅ | Set position mode |
| `GET` | `/api/v2/mix/account/bills` | ✅ | Get account bills |

#### Example: Set Leverage
```json
POST /api/v2/mix/account/set-leverage
{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginCoin": "USDT",
  "leverage": "10",
  "holdSide": "long"
}
```

### 📍 Position Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/mix/position/all-position` | ✅ | Get all positions |
| `GET` | `/api/v2/mix/position/single-position` | ✅ | Get single position |
| `GET` | `/api/v2/mix/position/history-position` | ✅ | Get position history |
| `POST` | `/api/v2/mix/position/change-margin` | ✅ | Adjust position margin |
| `GET` | `/api/v2/mix/position/adlRank` | ✅ | Get ADL ranking |

### 📈 Futures Trading

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/mix/order/place-order` | ✅ | Place futures order |
| `POST` | `/api/v2/mix/order/batch-place-order` | ✅ | Place multiple orders |
| `POST` | `/api/v2/mix/order/cancel-order` | ✅ | Cancel order |
| `POST` | `/api/v2/mix/order/batch-cancel-orders` | ✅ | Cancel multiple orders |
| `POST` | `/api/v2/mix/order/modify-order` | ✅ | Modify order |
| `GET` | `/api/v2/mix/order/detail` | ✅ | Get order details |
| `GET` | `/api/v2/mix/order/orders-pending` | ✅ | Get pending orders |
| `GET` | `/api/v2/mix/order/orders-history` | ✅ | Get order history |
| `GET` | `/api/v2/mix/order/fills` | ✅ | Get trade fills |

#### Example: Place Futures Order
```json
POST /api/v2/mix/order/place-order
{
  "symbol": "BTCUSDT",
  "productType": "USDT-FUTURES",
  "marginCoin": "USDT",
  "marginMode": "crossed",
  "side": "buy",
  "orderType": "limit",
  "size": "0.01",
  "price": "50000",
  "timeInForceValue": "GTC"
}
```

### 🎯 Plan Orders (Conditional)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/mix/order/plan/place-order` | ✅ | Place conditional order |
| `POST` | `/api/v2/mix/order/plan/modify-order` | ✅ | Modify conditional order |
| `POST` | `/api/v2/mix/order/plan/cancel-order` | ✅ | Cancel conditional order |
| `GET` | `/api/v2/mix/order/plan/orders-pending` | ✅ | Get pending plan orders |
| `GET` | `/api/v2/mix/order/plan/orders-history` | ✅ | Get plan order history |

---

## 💸 Margin Trading (`/api/v2/margin/`)

### Cross Margin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/margin/cross/place-order` | ✅ | Place cross margin order |
| `POST` | `/api/v2/margin/cross/batch-place-order` | ✅ | Place multiple orders |
| `POST` | `/api/v2/margin/cross/cancel-order` | ✅ | Cancel order |
| `POST` | `/api/v2/margin/cross/batch-cancel-order` | ✅ | Cancel multiple orders |
| `GET` | `/api/v2/margin/cross/open-orders` | ✅ | Get open orders |
| `GET` | `/api/v2/margin/cross/history-orders` | ✅ | Get order history |
| `GET` | `/api/v2/margin/cross/fills` | ✅ | Get trade fills |
| `GET` | `/api/v2/margin/cross/account/assets` | ✅ | Get cross margin assets |
| `POST` | `/api/v2/margin/cross/account/borrow` | ✅ | Borrow funds |
| `POST` | `/api/v2/margin/cross/account/repay` | ✅ | Repay loan |
| `GET` | `/api/v2/margin/cross/account/borrow-history` | ✅ | Get borrow history |
| `GET` | `/api/v2/margin/cross/account/repay-history` | ✅ | Get repay history |
| `GET` | `/api/v2/margin/cross/account/interest-history` | ✅ | Get interest history |
| `GET` | `/api/v2/margin/cross/account/liquidation-order` | ✅ | Get liquidation orders |
| `GET` | `/api/v2/margin/cross/account/financial-records` | ✅ | Get financial records |

### Isolated Margin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/margin/isolated/place-order` | ✅ | Place isolated margin order |
| `POST` | `/api/v2/margin/isolated/batch-place-order` | ✅ | Place multiple orders |
| `POST` | `/api/v2/margin/isolated/cancel-order` | ✅ | Cancel order |
| `POST` | `/api/v2/margin/isolated/batch-cancel-order` | ✅ | Cancel multiple orders |
| `GET` | `/api/v2/margin/isolated/open-orders` | ✅ | Get open orders |
| `GET` | `/api/v2/margin/isolated/history-orders` | ✅ | Get order history |
| `GET` | `/api/v2/margin/isolated/fills` | ✅ | Get trade fills |
| `GET` | `/api/v2/margin/isolated/account/assets` | ✅ | Get isolated margin assets |
| `POST` | `/api/v2/margin/isolated/account/borrow` | ✅ | Borrow funds |
| `POST` | `/api/v2/margin/isolated/account/repay` | ✅ | Repay loan |
| `GET` | `/api/v2/margin/isolated/account/borrow-history` | ✅ | Get borrow history |
| `GET` | `/api/v2/margin/isolated/account/repay-history` | ✅ | Get repay history |
| `GET` | `/api/v2/margin/isolated/account/interest-history` | ✅ | Get interest history |
| `GET` | `/api/v2/margin/isolated/account/liquidation-order` | ✅ | Get liquidation orders |
| `GET` | `/api/v2/margin/isolated/account/financial-records` | ✅ | Get financial records |

### Common Margin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/margin/interest-rate-record` | ✅ | Get interest rate records |

---

## 🔧 Additional Services

### Copy Trading (`/api/v2/copy/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/copy/mix-follower/copy-settings` | ✅ | Get copy trading settings |
| `POST` | `/api/v2/copy/mix-trader/create-copy-api` | ✅ | Create copy trading API |

### Earn Products (`/api/v2/earn/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/earn/loan/public/hour-interest` | ❌ | Get hourly interest rates |
| `POST` | `/api/v2/earn/loan/borrow` | ✅ | Borrow funds |
| `POST` | `/api/v2/earn/loan/repay` | ✅ | Repay loan |

### Broker Management (`/api/v2/broker/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/broker/manage/modify-subaccount-apikey` | ✅ | Modify subaccount API key |
| `GET` | `/api/v2/broker/all-sub-deposit-withdrawal` | ✅ | Get all sub deposits/withdrawals |
| `GET` | `/api/v2/broker/subaccount-deposit` | ✅ | Get subaccount deposits |

### User Management (`/api/v2/user/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v2/user/create-virtual-subaccount` | ✅ | Create virtual subaccount |
| `POST` | `/api/v2/user/create-virtual-subaccount-apikey` | ✅ | Create subaccount API key |
| `POST` | `/api/v2/user/modify-virtual-subaccount-apikey` | ✅ | Modify subaccount API key |
| `GET` | `/api/v2/user/virtual-subaccount-apikey-list` | ✅ | Get API key list |

### Tax Records (`/api/v2/tax/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v2/tax/future-record` | ✅ | Get futures tax records |

---

## ❌ Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `00000` | Success | Request successful |
| `40001` | Invalid request | Request format error |
| `40009` | Sign signature error | Authentication failed |
| `40099` | Exchange environment incorrect | Demo/Live mode mismatch |
| `40404` | Request URL NOT FOUND | Endpoint not found |
| `40762` | The order amount exceeds the balance | Insufficient balance |
| `40764` | Position does not exist | Position not found |
| `43012` | Insufficient balance | Not enough funds |
| `45110` | Less than the minimum amount | Below minimum order size |
| `400171` | Parameter verification failed | Invalid parameters |

---

## 📝 Important Notes

### Symbol Formats
- **Spot**: `BTCUSDT`, `ETHUSDT`
- **Futures**: `BTCUSDT` (without `_UMCBL` suffix in v2)
- **Product Types**: `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES`

### Interval Formats
- **Spot**: `1min`, `5min`, `15min`, `30min`, `1h`, `4h`, `1day`, `1week`
- **Futures**: `1m`, `3m`, `5m`, `15m`, `30m`, `1H`, `4H`, `1D`, `1W`

### Order Types
- **Market**: `market`
- **Limit**: `limit`
- **Post Only**: `post_only`
- **Fill or Kill**: `fok`
- **Immediate or Cancel**: `ioc`

### Time in Force
- **GTC**: Good Till Cancelled
- **IOC**: Immediate or Cancel
- **FOK**: Fill or Kill
- **PO**: Post Only

---

## 🔗 Resources

- **Official Documentation**: https://www.bitget.com/api-doc/
- **API Status**: https://www.bitget.com/support/articles/12560603798900
- **Changelog**: https://www.bitget.com/api-doc/common/changelog
- **SDK Support**: Node.js, Python, Java, C#

---

**⚠️ Disclaimer**: This documentation is for reference purposes. Always refer to the official Bitget API documentation for the most up-to-date information and implementation details.

---

**Last Updated**: August 2025  
**API Version**: v2  
**Status**: Active