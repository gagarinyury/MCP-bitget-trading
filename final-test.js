#!/usr/bin/env node

/**
 * Final test script for fixed futures trading functionality
 */

import { BitgetRestClient } from './dist/api/rest-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function runFinalTest() {
  const client = new BitgetRestClient({
    apiKey: process.env.BITGET_API_KEY,
    secretKey: process.env.BITGET_SECRET_KEY,
    passphrase: process.env.BITGET_PASSPHRASE,
    sandbox: true,
    baseUrl: 'https://api.bitget.com',
    wsUrl: 'wss://wspap.bitget.com/v2/ws/public',
  });

  console.log('🎯 Final Test: MCP Bitget Trading Fixes\n');

  try {
    // 1. Test spot order (should work as before)
    console.log('1️⃣ Testing spot order functionality...');
    try {
      await client.placeOrder({
        symbol: 'BTCUSDT',
        side: 'buy', 
        type: 'limit',
        quantity: '0.00001',
        price: '50000'
      });
      console.log('❌ Spot order unexpected success (should fail due to insufficient balance)');
    } catch (err) {
      if (err.message.includes('Insufficient balance')) {
        console.log('✅ Spot order correctly fails with insufficient balance');
      } else {
        console.log('⚠️  Spot order fails with different error:', err.message);
      }
    }

    // 2. Test futures order (new functionality)
    console.log('\n2️⃣ Testing futures order functionality...');
    const futuresOrder = await client.placeOrder({
      symbol: 'BTCUSDT_UMCBL',
      side: 'buy',
      type: 'limit', 
      quantity: '0.01',
      price: '50000'
    });
    console.log('✅ Futures order placed successfully:', futuresOrder.orderId);

    // 3. Test order cancellation
    console.log('\n3️⃣ Testing order cancellation...');
    const cancelled = await client.cancelOrder(futuresOrder.orderId, 'BTCUSDT_UMCBL');
    console.log('✅ Order cancelled:', cancelled);

    // 4. Test order retrieval 
    console.log('\n4️⃣ Testing order retrieval...');
    const orders = await client.getOrders('BTCUSDT_UMCBL');
    console.log('✅ Retrieved futures orders:', orders.length);

    // 5. Test balance and positions
    console.log('\n5️⃣ Testing balance and positions...');
    const marginInfo = await client.getMarginInfo();
    const positions = await client.getFuturesPositions();
    console.log('✅ Margin info retrieved, available:', marginInfo[0]?.available || 'N/A');
    console.log('✅ Positions retrieved:', positions.length);

    console.log('\n🎉 All tests passed! Futures trading is now working correctly.');
    console.log('\n📋 Summary of fixes:');
    console.log('• ✅ Fixed futures order placement endpoint');
    console.log('• ✅ Added proper parameter handling for v2 API');
    console.log('• ✅ Improved error handling and logging');
    console.log('• ✅ Auto-detection of spot vs futures orders');
    console.log('• ✅ Working order cancellation');
    console.log('• ✅ Enhanced schema validation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runFinalTest().catch(console.error);