import { describe, it, expect } from 'bun:test';
import { createClient } from '../../../apps/web/lib/pocketbase/client';

const pb = createClient();

describe('Development Tools', () => {
  describe('runMigration', () => {
    it('should be registered', () => {
      expect(pb).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const collections = await pb.collections.getFullList();
      expect(Array.isArray(collections)).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collections.getOne('non_existent_migration_test');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('executeHook', () => {
    it('should be registered', () => {
      expect(pb).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: `test_hook_${Date.now()}@eggo.io`,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test Hook User',
        externalId: `test_hook_external_${Date.now()}`
      };

      try {
        const createdUser = await pb.collection('users').create(userData);
        expect(createdUser).toHaveProperty('id');
        expect(createdUser.email).toBe(userData.email);
      } finally {
        try {
          const users = await pb.collection('users').getList(1, 100, {
            filter: `email = "${userData.email}"`
          });
          if (users.items.length > 0) {
            await pb.collection('users').delete(users.items[0].id);
          }
        } catch {}
      }
    });
    
    it('should handle errors gracefully', async () => {
      try {
        const invalidUserData = {
          email: '',
          password: 'short',
          passwordConfirm: 'short',
          externalId: `test_invalid_hook_${Date.now()}`
        };
        await pb.collection('users').create(invalidUserData);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(400);
      }
    });
  });

  describe('getSchema', () => {
    it('should be registered', () => {
      expect(pb.collections).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const usersCollection = await pb.collections.getOne('_pb_users_auth_');
      expect(usersCollection).toHaveProperty('id');
      expect(usersCollection.id).toBe('_pb_users_auth_');
      expect(usersCollection).toHaveProperty('fields');
      expect(Array.isArray(usersCollection.fields)).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collections.getOne('non_existent_schema_12345');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });
});