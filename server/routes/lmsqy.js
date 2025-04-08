require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createCheckout, lemonSqueezySetup } = require('@lemonsqueezy/lemonsqueezy.js');

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

// Export the router
module.exports = router;
