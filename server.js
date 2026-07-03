require('dotenv').config();
const express = require('express');
const path = require('path');
const { generateQr, checkTransaction } = require('./aba');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const transactions = {};

app.post('/api/create-qr', async (req, res) => {
  try {
    const { amount, currency, paymentOption } = req.body;
    const tranId = 'TXN-' + Date.now();

    const result = await generateQr({
      tranId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      paymentOption: paymentOption || 'abapay_khqr',
      firstName: 'Ketia',
      email: 'test@abapaywaytest.com',
      items: [{ name: 'Test Payment', quantity: 1, price: parseFloat(amount) }],
      callbackUrl: `${process.env.PUBLIC_URL}/api/callback`,
      lifetime: 10
    });

    transactions[tranId] = { status: 'PENDING', ...result };
    res.json({ ...result, tranId });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post('/api/callback', (req, res) => {
  console.log('Callback received:', req.body);
  const { tran_id, status } = req.body;
  if (transactions[tran_id]) {
    transactions[tran_id].status = status === '0' ? 'PAID' : 'FAILED';
  }
  res.status(200).send('OK');
});

app.get('/api/status/:tranId', async (req, res) => {
  try {
    const result = await checkTransaction(req.params.tranId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));