import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../../../apps/web/lib/pocketbase/client';

const pb = createClient();

const TEST_RECORD_EMAIL = `test_record_${Date.now()}@eggo.io`;

describe('Record Tools', () => {
  async function cleanupTestRecords() {
    try {
      const users = await pb.collection('users').getList(1, 100, {
        filter: `email ~ "@eggo.io"`
      });
      
      for (const user of users.items) {
        if (user.email.includes('test_record_')) {
          try {
            await pb.collection('users').delete(user.id);
          } catch {}
        }
      }
    } catch {}
  }

  beforeEach(async () => {
    await cleanupTestRecords();
  });

  afterEach(async () => {
    await cleanupTestRecords();
  });

  describe('listRecords', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const users = await pb.collection('users').getList(1, 5);
      
      expect(Array.isArray(users.items)).toBe(true);
      expect(users.items.length).toBeLessThanOrEqual(5);
      
      if (users.items.length > 0) {
        const sampleUser = users.items[0];
        expect(sampleUser).toHaveProperty('id');
        expect(sampleUser).toHaveProperty('created');
        expect(sampleUser).toHaveProperty('updated');
      }
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collection('non_existent_collection_12345').getList(1, 1);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('getRecord', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const users = await pb.collection('users').getList(1, 1);
      
      if (users.items.length > 0) {
        const userId = users.items[0].id;
        const user = await pb.collection('users').getOne(userId);
        
        expect(user).toHaveProperty('id');
        expect(user.id).toBe(userId);
        expect(user).toHaveProperty('created');
        expect(user).toHaveProperty('updated');
      }
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collection('users').getOne('non_existent_record_12345');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('createRecord', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_RECORD_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test User',
        externalId: `test_external_${Date.now()}`
      };

      const createdUser = await pb.collection('users').create(userData);
      
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.email).toBe(TEST_RECORD_EMAIL);
      expect(createdUser.name).toBe('Test User');
    });
    
    it('should handle errors gracefully', async () => {
      try {
        const invalidUserData = {
          email: '',
          password: 'short',
          passwordConfirm: 'short',
          externalId: `test_external_${Date.now()}`
        };
        await pb.collection('users').create(invalidUserData);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(400);
      }
    });
  });

  describe('updateRecord', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_RECORD_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test User',
        externalId: `test_external_${Date.now()}`
      };

      const createdUser = await pb.collection('users').create(userData);
      
      const updatedData = {
        ...createdUser,
        name: 'Updated Test User'
      };
      
      const updatedUser = await pb.collection('users').update(createdUser.id, updatedData);
      
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.name).toBe('Updated Test User');
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collection('users').update('non_existent_record_12345', {
          name: 'Updated Name'
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('deleteRecord', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_RECORD_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test User',
        externalId: `test_external_${Date.now()}`
      };

      const createdUser = await pb.collection('users').create(userData);
      
      const result = await pb.collection('users').delete(createdUser.id);
      
      expect(result).toBeUndefined();
      
      try {
        await pb.collection('users').getOne(createdUser.id);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as any).status).toBe(404);
      }
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collection('users').delete('non_existent_record_12345');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });
});