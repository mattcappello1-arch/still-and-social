module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const LOCATION_ID = 'LYWEP6QX2PFZN';

    if (!SQUARE_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Square not configured' });
    }

    const lineItems = items.map(item => {
      if (item.catalog_object_id) {
        const li = {
          catalog_object_id: String(item.catalog_object_id),
          quantity: String(item.quantity || 1)
        };
        if (item.modifiers && item.modifiers.length > 0) {
          li.modifiers = item.modifiers.map(m => ({ catalog_object_id: String(m.catalog_object_id) }));
        }
        return li;
      }
      return {
        name: String(item.name),
        quantity: String(item.quantity || 1),
        base_price_money: {
          amount: parseInt(item.price, 10),
          currency: 'AUD'
        }
      };
    });

    const idempotencyKey = crypto.randomUUID();

    const response = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        order: {
          location_id: LOCATION_ID,
          line_items: lineItems
        },
        checkout_options: {
          redirect_url: 'https://stillandsocial.com.au/shop/success.html',
          ask_for_shipping_address: true
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square API error:', JSON.stringify(data));
      return res.status(response.status).json({
        error: 'Checkout failed',
        details: data.errors ? data.errors.map(e => e.detail).join('; ') : 'Unknown error'
      });
    }

    return res.status(200).json({ url: data.payment_link.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
