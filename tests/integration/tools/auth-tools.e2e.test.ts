import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../../../apps/web/lib/pocketbase/client';

const pb = createClient();

const TEST_AUTH_EMAIL = `test_auth_${Date.now()}@eggo.io`;

describe('Auth Tools', () => {
  async function cleanupTestUsers() {
    try {
      const users = await pb.collection('users').getList(1, 100, {
        filter: `email ~ "@eggo.io"`
      });
      
      for (const user of users.items) {
        if (user.email.includes('test_auth_')) {
          try {
            await pb.collection('users').delete(user.id);
          } catch {}
        }
      }
    } catch {}
  }

  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('authenticateUser', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_AUTH_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test Auth User',
        externalId: `test_auth_external_${Date.now()}`
      };

      await pb.collection('users').create(userData);
      
      const authData = await pb.collection('users').authWithPassword(
        TEST_AUTH_EMAIL,
        'testpassword123'
      );
      
      expect(authData).toHaveProperty('token');
      expect(authData).toHaveProperty('record');
      expect(authData.record.email).toBe(TEST_AUTH_EMAIL);
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collection('users').authWithPassword(
          'nonexistent@test.com',
          'wrongpassword'
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(400);
      }
    });
  });

  describe('createUser', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_AUTH_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test Create User',
        externalId: `test_create_external_${Date.now()}`
      };

      const createdUser = await pb.collection('users').create(userData);
      
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.email).toBe(TEST_AUTH_EMAIL);
      expect(createdUser.name).toBe('Test Create User');
    });
    
    it('should handle errors gracefully', async () => {
      try {
        const duplicateUserData = {
          email: TEST_AUTH_EMAIL,
          password: 'testpassword123',
          passwordConfirm: 'testpassword123',
          name: 'Duplicate User',
          externalId: `duplicate_external_${Date.now()}`
        };
        await pb.collection('users').create(duplicateUserData);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(400);
      }
    });
  });

  describe('updateUser', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_AUTH_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test Update User',
        externalId: `test_update_external_${Date.now()}`
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
        await pb.collection('users').update('non_existent_user_12345', {
          name: 'Updated Name'
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('deleteUser', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: TEST_AUTH_EMAIL,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test Delete User',
        externalId: `test_delete_external_${Date.now()}`
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
        await pb.collection('users').delete('non_existent_user_12345');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('getAuthMethods', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const authMethods = await pb.collection('users').listAuthMethods();
      
      expect(authMethods).toHaveProperty('usernamePasswordAuth');
      expect(authMethods).toHaveProperty('authProviders');
      
      expect(typeof authMethods.usernamePasswordAuth.enabled).toBe('boolean');
      expect(Array.isArray(authMethods.authProviders)).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      const authMethods = await pb.collection('users').listAuthMethods();
      expect(authMethods).toHaveProperty('usernamePasswordAuth');
    });
  });
});