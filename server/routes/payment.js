const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { createPaymentIntent, verifyPayment, validateWebhookSignature } = require('../utils/kryptogoUtils');
const { verifyToken } = require('../middleware/authMiddleware');

// In-memory storage for payment records (replace with DB in production)
const paymentRecords = [];

/**
 * Initialize payment
 * POST /api/payment/initialize
 * 
 * Initializes a payment intent with KryptoGO
 * Request: { amount: string, currency: string, reportId: string }
 * Response: { paymentId: string, paymentUrl: string }
 */
router.post('/initialize', async (req, res) => {
  try {
    const { amount, currency, reportId } = req.body;
    
    if (!amount || !currency || !reportId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, currency, reportId'
      });
    }
    
    // Generate a unique payment ID
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a payment record - in production would be stored in DB
    const paymentRecord = {
      id: paymentId,
      reportId,
      amount,
      currency,
      status: 'initiated',
      createdAt: new Date().toISOString()
    };
    
    // Save payment record (in memory for now)
    paymentRecords.push(paymentRecord);
    
    // Create payment intent with KryptoGO
    const kryptoGoResponse = await createPaymentIntent({
      amount,
      currency,
      paymentId,
      reportId
    });
    
    return res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        paymentId,
        paymentUrl: kryptoGoResponse.paymentUrl
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment'
    });
  }
});

/**
 * Verify payment
 * POST /api/payment/verify
 * 
 * Verifies a payment with KryptoGO
 * Request: { paymentId: string, txHash: string }
 * Response: JWT token if payment is verified
 */
router.post('/verify', async (req, res) => {
  try {
    const { paymentId, txHash } = req.body;
    
    if (!paymentId || !txHash) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentId, txHash'
      });
    }
    
    // Find payment record
    const paymentRecord = paymentRecords.find(record => record.id === paymentId);
    
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    // Verify payment with KryptoGO
    const verificationResult = await verifyPayment({ paymentId, txHash });
    
    // Check verification result
    if (!verificationResult.success || verificationResult.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: verificationResult.status
      });
    }
    
    // Update payment record
    paymentRecord.status = 'completed';
    paymentRecord.txHash = txHash;
    paymentRecord.completedAt = new Date().toISOString();
    
    // Create a JWT token
    const token = jwt.sign(
      {
        isPaid: true,
        source: 'payment',
        reportId: paymentRecord.reportId,
        paymentId: paymentRecord.id,
        issuedAt: new Date().toISOString()
      },
      process.env.JWT_SECRET,
      { expiresIn: '1y' } // Paid access lasts 1 year
    );
    
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      token,
      reportId: paymentRecord.reportId
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

/**
 * KryptoGO webhook handler
 * POST /api/payment/webhook
 * 
 * Handles KryptoGO payment status webhooks
 * This would be configured in the KryptoGO dashboard
 */
router.post('/webhook', (req, res) => {
  try {
    // Get signature from headers
    const signature = req.headers['x-kryptogo-signature'];
    
    // Validate webhook signature
    if (!validateWebhookSignature(req.body, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { 
      payment_intent_id,
      status,
      tx_hash
    } = req.body;
    
    // Find payment record
    const paymentRecord = paymentRecords.find(record => record.id === payment_intent_id);
    
    if (!paymentRecord) {
      console.error(`Webhook: Payment record not found for ID ${payment_intent_id}`);
      return res.status(200).end(); // Always return 200 for webhooks
    }
    
    // Update payment record
    paymentRecord.status = status;
    if (tx_hash) paymentRecord.txHash = tx_hash;
    paymentRecord.updatedAt = new Date().toISOString();
    
    // Log webhook receipt
    console.log(`Payment webhook received: ID=${payment_intent_id}, Status=${status}`);
    
    // Return 200 to acknowledge receipt
    return res.status(200).end();
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to acknowledge receipt
    return res.status(200).end();
  }
});

/**
 * Verify Payment Status
 * GET /api/payment/verify-status
 * 
 * Verifies if the user has a valid payment token for the specified report
 * Requires authorization header with bearer token
 * Query param: reportId - The current report ID to check against
 */
router.get('/verify-status', verifyToken, (req, res) => {
  try {
    // If we got here, the token is valid (verified by middleware)
    
    // Get the current report ID from query params
    const currentReportId = req.query.reportId;
    
    // Check if the user has paid
    const isPaid = req.user && req.user.isPaid === true;
    
    // Check if the report ID in the token matches the current report ID
    // Only consider the user paid if they paid for this specific report
    const isReportPaid = isPaid && req.user.reportId && currentReportId && 
                        req.user.reportId === currentReportId;
    
    return res.status(200).json({
      success: true,
      isPaid: isReportPaid,
      tokenReportId: req.user ? req.user.reportId : null,
      currentReportId: currentReportId || null
    });
  } catch (error) {
    console.error('Payment status verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment status',
      error: error.message
    });
  }
});

/**
 * Get payment status
 * GET /api/payment/:paymentId
 * 
 * Gets the status of a payment
 */
router.get('/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  
  // Find payment record
  const paymentRecord = paymentRecords.find(record => record.id === paymentId);
  
  if (!paymentRecord) {
    return res.status(404).json({
      success: false,
      message: 'Payment record not found'
    });
  }
  
  // Return payment status
  return res.status(200).json({
    success: true,
    data: {
      id: paymentRecord.id,
      status: paymentRecord.status,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      createdAt: paymentRecord.createdAt,
      completedAt: paymentRecord.completedAt
    }
  });
});

module.exports = router; 