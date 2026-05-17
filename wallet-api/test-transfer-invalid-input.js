// Test script to verify transfer endpoint returns 400 on invalid input
const express = require('express');
const request = require('supertest');
const { transferRouter } = require('./dist/routes/transfer.js');

const app = express();
app.use(express.json());
app.use('/api/wallet', transferRouter);

// Suppress console.error during tests to keep output clean
console.error = jest.fn();

describe('Transfer endpoint validation', () => {
  test('should return 400 for invalid address format', async () => {
    const response = await request(app)
      .post('/api/wallet/transfer')
      .send({
        to_address: 'invalid_address',
        amount: 10,
        user_id: 'user123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_PARAMS');
  });

  test('should return 400 for invalid amount (negative)', async () => {
    const response = await request(app)
      .post('/api/wallet/transfer')
      .send({
        to_address: '0x1234567890123456789012345678901234567890',
        amount: -10,
        user_id: 'user123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_PARAMS');
  });

  test('should return 400 for invalid user_id', async () => {
    const response = await request(app)
      .post('/api/wallet/transfer')
      .send({
        to_address: '0x1234567890123456789012345678901234567890',
        amount: 10,
        user_id: ''
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_PARAMS');
  });
});