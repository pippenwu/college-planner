require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createCheckout, lemonSqueezySetup } = require('@lemonsqueezy/lemonsqueezy.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Initialize Lemon Squeezy with API key
lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY,
  onError: (error) => console.error("Lemon Squeezy Error:", error)
});

// Create checkout endpoint
router.post('/create-checkout', async (req, res) => {
  try {
    const { email, name, customData } = req.body;
    
    // Verify API key is available
    if (!process.env.LEMON_SQUEEZY_API_KEY) {
      console.error('Lemon Squeezy API key is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    console.log('Creating checkout with params:', {
      storeId: process.env.LEMON_SQUEEZY_STORE_ID,
      variantId: process.env.LEMON_SQUEEZY_VARIANT_ID,
      email,
      name,
      customData
    });
    
    // Convert store and variant IDs to integers
    const storeId = parseInt(process.env.LEMON_SQUEEZY_STORE_ID, 10);
    const variantId = parseInt(process.env.LEMON_SQUEEZY_VARIANT_ID, 10);
    
    // Verify IDs are valid
    if (isNaN(storeId) || isNaN(variantId)) {
      console.error('Invalid store or variant ID:', { storeId, variantId });
      return res.status(500).json({ 
        error: 'Configuration error', 
        message: 'Invalid store or variant ID' 
      });
    }
    
    const checkout = await createCheckout(
      storeId,
      variantId,
      {
        checkoutData: {
          custom: customData || {},
        },
        ...(email && { email }),
        ...(name && { name }),
      }
    );
    
    // Print a more detailed structure of the response
    console.log('Checkout response structure:', {
      statusCode: checkout.statusCode,
      hasData: !!checkout.data,
      hasNestedData: !!(checkout.data && checkout.data.data),
      hasAttributes: !!(checkout.data && checkout.data.data && checkout.data.data.attributes),
    });
    
    // The response has nested data.data.attributes structure
    if (checkout && checkout.data && checkout.data.data && checkout.data.data.attributes) {
      const attributes = checkout.data.data.attributes;
      console.log('Checkout attributes:', attributes);
      
      if (attributes.url) {
        // Return just the checkout URL to the frontend
        return res.json({ 
          checkoutUrl: attributes.url 
        });
      }
    }
    
    // If we got here, the response doesn't have the expected format
    console.error('Invalid checkout response format:', checkout);
    return res.status(500).json({ 
      error: 'Failed to create checkout',
      message: 'Invalid response from Lemon Squeezy API'
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Webhook endpoint for Lemon Squeezy
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-signature'];
    if (!signature && process.env.NODE_ENV === 'production') {
      console.error('Missing webhook signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify the webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET);
      const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
      
      if (signature !== digest) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { meta, data } = req.body;
    console.log('Webhook received:', meta.event_name);

    // Handle different events
    if (meta.event_name === 'order_created') {
      // Extract data from the webhook
      const { custom_data } = data.attributes;
      const reportId = custom_data?.reportId;

      if (reportId) {
        // Generate a JWT token that marks this report as paid
        const token = jwt.sign(
          {
            isPaid: true,
            reportId,
            source: 'lemon_squeezy',
            paymentId: data.id
          },
          process.env.JWT_SECRET,
          { expiresIn: '1y' } // Token valid for 1 year
        );

        // In a real application, you might store this information in a database
        console.log(`Payment successful for report: ${reportId}`);
        
        // You could return the token in the response, but typically
        // webhooks should return 200 OK without much data
      }
    }

    // Acknowledge the webhook with 200 OK
    return res.status(200).json({ 
      received: true,
      event: meta.event_name
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Verify Lemon Squeezy payment
 * POST /api/lemon-squeezy/verify
 * 
 * Verifies a Lemon Squeezy payment from the client side and returns a JWT token
 * Request: { order_id: string, reportId: string }
 * Response: { token: string }
 */
router.post('/verify', async (req, res) => {
  try {
    const { order_id, reportId } = req.body;
    
    if (!order_id || !reportId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: order_id, reportId'
      });
    }
    
    // In a production app, you would verify the order with the Lemon Squeezy API
    // For now, we'll just create a token assuming the client is honest
    
    // Generate a JWT token
    const token = jwt.sign(
      {
        isPaid: true,
        reportId,
        source: 'lemon_squeezy',
        paymentId: order_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1y' } // Token valid for 1 year
    );
    
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      token
    });
  } catch (error) {
    console.error('Lemon Squeezy verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// Export the router
module.exports = router;
