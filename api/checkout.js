const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS headers
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
    let lineItems = [];

    // Support new multi-item format: { items: [{priceId, quantity}, ...] }
    if (req.body.items && Array.isArray(req.body.items)) {
      lineItems = req.body.items.map(item => ({
        price: item.priceId,
        quantity: item.quantity || 1,
      }));
    }
    // Backward compat: single item format { priceId, quantity }
    else if (req.body.priceId) {
      lineItems = [{
        price: req.body.priceId,
        quantity: req.body.quantity || 1,
      }];
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'embedded',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['AU'],
      },
      return_url: 'https://stillandsocial.com.au/shop/success.html?session_id={CHECKOUT_SESSION_ID}',
    });

    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('Checkout session error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
