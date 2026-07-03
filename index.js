require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

const MERCHANT_ID = process.env.ABA_MERCHANT_ID;
const API_KEY = process.env.ABA_API_KEY;
const BASE_URL = process.env.ABA_BASE_URL || 'https://checkout-sandbox.payway.com.kh';

function getReqTime() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function base64Encode(str) {
  return Buffer.from(str).toString('base64');
}

function generateHash(params, apiKey) {
  const {
    req_time, merchant_id, tran_id, amount, items = '', first_name = '',
    last_name = '', email = '', phone = '', purchase_type = '',
    payment_option, callback_url = '', return_deeplink = '',
    currency, custom_fields = '', return_params = '', payout = '',
    lifetime, qr_image_template
  } = params;

  const b4hash =
    req_time + merchant_id + tran_id + amount + items + first_name +
    last_name + email + phone + purchase_type + payment_option +
    callback_url + return_deeplink + currency + custom_fields +
    return_params + payout + lifetime + qr_image_template;

  return crypto.createHmac('sha512', apiKey).update(b4hash).digest('base64');
}

async function generateQr({
  tranId,
  amount,
  currency = 'USD',
  paymentOption = 'abapay_khqr',
  firstName = '',
  lastName = '',
  email = '',
  phone = '',
  purchaseType = 'purchase',
  items = [],
  callbackUrl = '',
  lifetime = 30,
  qrImageTemplate = 'template1_color'
}) {
  if (!MERCHANT_ID || !API_KEY) {
    throw new Error('Missing ABA_MERCHANT_ID or ABA_API_KEY in .env');
  }

  const req_time = getReqTime();

  const params = {
    req_time,
    merchant_id: MERCHANT_ID,
    tran_id: tranId,
    amount,
    items: items.length ? base64Encode(JSON.stringify(items)) : '',
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    purchase_type: purchaseType,
    payment_option: paymentOption,
    callback_url: callbackUrl ? base64Encode(callbackUrl) : '',
    return_deeplink: '',
    currency,
    custom_fields: '',
    return_params: '',
    payout: '',
    lifetime,
    qr_image_template: qrImageTemplate
  };

  const hash = generateHash(params, API_KEY);
  const body = { ...params, hash };

  try {
    const response = await axios.post(
      `${BASE_URL}/api/payment-gateway/v1/payments/generate-qr`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error('ABA API Error:', err.response.status, err.response.data);
      throw new Error(`ABA API request failed: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

async function main() {
  try {
    const result = await generateQr({
      tranId: 'TEST-' + Date.now(),
      amount: 1.00,
      currency: 'USD',
      paymentOption: 'abapay_khqr',
      firstName: 'Ketia',
      email: 'ketia@example.com',
      items: [{ name: 'Test Item', quantity: 1, price: 1.00 }],
      lifetime: 10
    });

    console.log('QR Generated Successfully:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed to generate QR:', err.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateQr, generateHash, getReqTime, base64Encode };