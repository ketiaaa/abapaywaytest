# ABA PayWay Test

A sandbox test project for integrating with ABA PayWay's QR API (KHQR, ABA PAY, WeChat, Alipay).

## Setup

1. Clone this repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Run `node index.js`

## Features

- Generate dynamic QR codes for payments
- Supports KHR (ABA PAY, KHQR) and USD (ABA PAY, KHQR, WeChat, Alipay)
- HMAC SHA-512 request signing

## Environment Variables

| Variable | Description |
|---|---|
| `ABA_MERCHANT_ID` | Your merchant ID from ABA Bank |
| `ABA_API_KEY` | Your API key from ABA Bank |
| `ABA_BASE_URL` | Sandbox or production base URL |

## Reference

[ABA PayWay QR API Docs](https://developer.payway.com.kh/qr-api-14530840e0)