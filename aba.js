const crypto = require('crypto');
const axios = require('axios');

const MERCHANT_ID = process.env.ABA_MERCHANT_ID;
const API_KEY = process.env.ABA_API_KEY;
const BASE_URL = process.env.ABA_BASE_URL || 'https://checkout-sandbox.payway.com.kh';

function getReqTime() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return d.getUTCFullYear().toString() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
    pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds());
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

  const b4hash = req_time + merchant_id + tran_id + amount + items + first_name +
    last_name + email + phone + purchase_type + payment_option + callback_url +
    return_deeplink + currency + custom_fields + return_params + payout +
    lifetime + qr_image_template;

  return crypto.createHmac('sha512', apiKey).update(b4hash).digest('base64');
}

async function generateQr({ tranId, amount, currency = 'USD', paymentOption = 'abapay_khqr',
  firstName = '', email = '', items = [], callbackUrl = '', lifetime = 10,
  qrImageTemplate = 'template1_color' }) {

  if (!MERCHANT_ID || !API_KEY) throw new Error('Missing ABA_MERCHANT_ID or ABA_API_KEY in .env');

  const req_time = getReqTime();
  const params = {
    req_time, merchant_id: MERCHANT_ID, tran_id: tranId, amount,
    items: items.length ? base64Encode(JSON.stringify(items)) : '',
    first_name: firstName, last_name: '', email, phone: '',
    purchase_type: 'purchase', payment_option: paymentOption,
    callback_url: callbackUrl ? base64Encode(callbackUrl) : '',
    return_deeplink: '', currency, custom_fields: '', return_params: '',
    payout: '', lifetime, qr_image_template: qrImageTemplate
  };

  const hash = generateHash(params, API_KEY);
  const { data } = await axios.post(
    `${BASE_URL}/api/payment-gateway/v1/payments/generate-qr`,
    { ...params, hash },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

async function checkTransaction(tranId) {
  const req_time = getReqTime();
  const b4hash = req_time + MERCHANT_ID + tranId;
  const hash = crypto.createHmac('sha512', API_KEY).update(b4hash).digest('base64');

  const { data } = await axios.post(
    `${BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2`,
    { req_time, merchant_id: MERCHANT_ID, tran_id: tranId, hash },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

module.exports = { generateQr, checkTransaction };