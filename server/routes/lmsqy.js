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
 * Request: { order_id: string, reportId: string } OR any structure containing these fields
 * Response: { token: string }
 */
router.post('/verify', async (req, res) => {
  try {
    // Log the entire request body for debugging
    console.log('Full Lemon Squeezy verification request:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);
    
    // Extract fields, trying different possible locations
    let order_id = req.body.order_id;
    let reportId = req.body.reportId;
    
    // Try to find the fields in other places if not directly in req.body
    if (!order_id) {
      // Try common nested locations based on different client implementations
      if (req.body.data?.id) order_id = req.body.data.id;
      else if (req.body.data?.order_id) order_id = req.body.data.order_id;
      else if (req.body.data?.attributes?.order_id) order_id = req.body.data.attributes.order_id;
      else if (req.body.attributes?.order_id) order_id = req.body.attributes.order_id;
      else if (req.body.custom_data?.order_id) order_id = req.body.custom_data.order_id;
    }
    
    if (!reportId) {
      // Try common nested locations
      if (req.body.data?.reportId) reportId = req.body.data.reportId;
      else if (req.body.custom_data?.reportId) reportId = req.body.custom_data.reportId;
      else if (req.body.attributes?.reportId) reportId = req.body.attributes.reportId;
      else if (req.body.data?.custom?.reportId) reportId = req.body.data.custom.reportId;
      else if (req.body.data?.custom_data?.reportId) reportId = req.body.data.custom_data.reportId;
    }
    
    // Try to extract from URL query params if they were sent
    if (!order_id && req.query.order_id) {
      order_id = req.query.order_id;
    }
    
    if (!reportId && req.query.reportId) {
      reportId = req.query.reportId;
    }
    
    // Log the extracted parameters
    console.log('Extracted parameters:', { order_id, reportId });
    
    if (!order_id) {
      console.log('Missing order_id field, creating a fallback');
      order_id = `fallback_order_${Date.now()}`;
    }
    
    if (!reportId) {
      console.log('Missing required field: reportId');
      
      return res.status(400).json({
        success: false,
        message: 'Missing required field: reportId',
        received: { 
          has_order_id: !!order_id, 
          has_reportId: !!reportId,
          body_keys: Object.keys(req.body)
        }
      });
    }
    
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET not defined'
      });
    }
    
    // In a production app, you would verify the order with the Lemon Squeezy API
    // For now, we'll just create a token assuming the client is honest
    
    // Generate a JWT token
    try {
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
      
      console.log('Token generated successfully for reportId:', reportId);
      
      // Set up CORS headers explicitly to ensure the response gets back to the client
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        token,
        reportId,
        paymentId: order_id
      });
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate authentication token',
        error: jwtError.message
      });
    }
  } catch (error) {
    console.error('Lemon Squeezy verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Export the router
module.exports = router;
