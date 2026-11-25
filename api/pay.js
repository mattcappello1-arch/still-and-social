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

  const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
  const LOCATION_ID = 'LYWEP6QX2PFZN';
  const SQUARE_VERSION = '2024-01-18';

  if (!SQUARE_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Square not configured' });
  }

  try {
    const { token, giftCardToken, items, shipping, total } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'No payment token provided' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    if (!shipping || !shipping.name || !shipping.email || !shipping.address || !shipping.city || !shipping.state || !shipping.postcode) {
      return res.status(400).json({ error: 'Shipping details incomplete' });
    }

    const totalCents = parseInt(total, 10);
    if (!totalCents || totalCents <= 0) {
      return res.status(400).json({ error: 'Invalid total' });
    }

    const headers = {
      'Square-Version': SQUARE_VERSION,
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    /* ---------- 1. Create Square Order ---------- */
    const lineItems = items.map(item => {
      const li = {
        name: String(item.name),
        quantity: String(item.quantity || 1),
        base_price_money: {
          amount: parseInt(item.price, 10),
          currency: 'AUD'
        }
      };
      if (item.catalog_object_id) {
        li.catalog_object_id = item.catalog_object_id;
      }
      return li;
    });

    const orderBody = {
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: LOCATION_ID,
        line_items: lineItems,
        fulfillments: [{
          type: 'SHIPMENT',
          state: 'PROPOSED',
          shipment_details: {
            recipient: {
              display_name: shipping.name,
              email_address: shipping.email,
              address: {
                address_line_1: shipping.address,
                locality: shipping.city,
                administrative_district_level_1: shipping.state,
                postal_code: shipping.postcode,
                country: 'AU'
              }
            }
          }
        }]
      }
    };

    const orderRes = await fetch('https://connect.squareup.com/v2/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderBody)
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error('Square Order error:', JSON.stringify(orderData));
      const detail = orderData.errors ? orderData.errors.map(e => e.detail).join('; ') : 'Order creation failed';
      return res.status(orderRes.status).json({ error: detail });
    }

    const orderId = orderData.order.id;
    const orderTotal = orderData.order.total_money.amount;

    /* ---------- 2. Create Payment (card) ---------- */
    const paymentBody = {
      source_id: token,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: orderTotal,
        currency: 'AUD'
      },
      order_id: orderId,
      location_id: LOCATION_ID,
      buyer_email_address: shipping.email,
      shipping_address: {
        address_line_1: shipping.address,
        locality: shipping.city,
        administrative_district_level_1: shipping.state,
        postal_code: shipping.postcode,
        country: 'AU',
        first_name: shipping.name.split(' ')[0],
        last_name: shipping.name.split(' ').slice(1).join(' ') || shipping.name
      }
    };

    const payRes = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentBody)
    });

    const payData = await payRes.json();

    if (!payRes.ok) {
      console.error('Square Payment error:', JSON.stringify(payData));
      const detail = payData.errors ? payData.errors.map(e => e.detail).join('; ') : 'Payment failed';
      return res.status(payRes.status).json({ error: detail });
    }

    /* ---------- 3. Gift card payment (optional) ---------- */
    if (giftCardToken) {
      const gcPaymentBody = {
        source_id: giftCardToken,
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount: orderTotal,
          currency: 'AUD'
        },
        order_id: orderId,
        location_id: LOCATION_ID
      };

      const gcRes = await fetch('https://connect.squareup.com/v2/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(gcPaymentBody)
      });

      const gcData = await gcRes.json();
      if (!gcRes.ok) {
        console.error('Square Gift Card Payment error:', JSON.stringify(gcData));
        /* Card payment already succeeded — don't fail the whole order */
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderId,
      paymentId: payData.payment.id
    });

  } catch (err) {
    console.error('Pay error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
