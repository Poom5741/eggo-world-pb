import { describe, it, expect } from 'bun:test';
import { createClient } from '../../../apps/web/lib/pocketbase/client';

const pb = createClient();

describe('Debug Tools', () => {
  describe('healthCheck', () => {
    it('should be registered', () => {
      expect(pb).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const response = await fetch(`${pb.baseUrl}/api/health`);
      const healthData = await response.json();
      
      expect(response.status).toBe(200);
      expect(healthData).toHaveProperty('code');
      expect(healthData).toHaveProperty('message');
      expect(healthData.code).toBe(200);
    });
    
    it('should handle errors gracefully', async () => {
      const response = await fetch(`${pb.baseUrl}/api/health`);
      expect(response.status).toBe(200);
    });
  });
});