# Lemon Squeezy Integration Guide

This guide explains how to set up Lemon Squeezy for payment processing in your application.

## 1. Initial Setup

1. Create an account at [Lemon Squeezy](https://www.lemonsqueezy.com/)
2. Create a store
3. Create a product and variant for your report

## 2. API Key Setup

1. In your Lemon Squeezy dashboard, go to **Settings > API**
2. Create a new API key
3. Copy the API key to your `.env` file:
   ```
   LEMON_SQUEEZY_API_KEY=your_api_key_here
   ```

## 3. Store and Product Information

Get the following IDs from your Lemon Squeezy dashboard:

1. **Store ID**: Go to your store and look for the ID in the URL
2. **Product ID**: Go to your product and look for the ID in the URL
3. **Variant ID**: Go to your product variants and look for the ID

Add these to your `.env` file:
```
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_PRODUCT_ID=your_product_id
LEMON_SQUEEZY_VARIANT_ID=your_variant_id
```

## 4. Webhook Setup

To receive payment notifications:

1. In your Lemon Squeezy dashboard, go to **Settings > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/webhook` (for local testing, you might need a service like ngrok)
4. Generate a secret and add it to your `.env` file:
   ```
   LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
   ```
5. Select at least the following events:
   - Order Created
   - Subscription Created (if applicable)
   - Subscription Updated (if applicable)

## 5. Testing

1. Start your application
2. Navigate to a page with the payment button
3. Click the payment button to test the checkout flow
4. Use Lemon Squeezy's test mode to simulate payments

## 6. Customizing the Checkout

You can customize the appearance of your checkout page in the Lemon Squeezy dashboard:

1. Go to **Settings > Checkout**
2. Customize colors, logo, and other settings

## Troubleshooting

- **Webhook not being received**: Check that your server is publicly accessible and that the webhook URL is correct
- **Payment not being processed**: Check the browser console for errors and verify your API keys
- **Custom data not appearing**: Make sure you're sending the correct custom data format in the checkout creation 