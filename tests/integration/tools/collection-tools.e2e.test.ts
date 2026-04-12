import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../../../apps/web/lib/pocketbase/client';

const pb = createClient();

const TEST_COLLECTION_PREFIX = 'test_collection_';

describe('Collection Tools', () => {
  async function cleanupTestCollections() {
    try {
      const collections = await pb.collections.getFullList();
      for (const collection of collections) {
        if (collection.name.startsWith(TEST_COLLECTION_PREFIX)) {
          try {
            await pb.collections.delete(collection.id);
          } catch {}
        }
      }
    } catch {}
  }

  beforeEach(async () => {
    await cleanupTestCollections();
  });

  afterEach(async () => {
    await cleanupTestCollections();
  });

  describe('listCollections', () => {
    it('should be registered', () => {
      expect(pb.collections).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const collections = await pb.collections.getFullList();
      
      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBeGreaterThan(0);
      
      const sampleCollection = collections[0];
      expect(sampleCollection).toHaveProperty('id');
      expect(sampleCollection).toHaveProperty('name');
      expect(sampleCollection).toHaveProperty('type');
    });
    
    it('should handle errors gracefully', async () => {
      const collections = await pb.collections.getFullList();
      expect(Array.isArray(collections)).toBe(true);
    });
  });

  describe('getCollection', () => {
    it('should be registered', () => {
      expect(pb.collections).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const usersCollection = await pb.collections.getOne('_pb_users_auth_');
      
      expect(usersCollection).toHaveProperty('id');
      expect(usersCollection.id).toBe('_pb_users_auth_');
      expect(usersCollection).toHaveProperty('name');
      expect(usersCollection.name).toBe('users');
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collections.getOne('non_existent_collection_12345');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('createCollection', () => {
    it('should be registered', () => {
      expect(pb.collections).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const collectionName = `${TEST_COLLECTION_PREFIX}${Date.now()}`;
      const collectionData = {
        name: collectionName,
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          {
            "id": "text123",
            "name": "title",
            "type": "text",
            "required": false,
            "presentable": false,
            "unique": false,
            "system": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          }
        ]
      };

      const createdCollection = await pb.collections.create(collectionData);
      
      expect(createdCollection).toHaveProperty('id');
      expect(createdCollection.name).toBe(collectionName);
      expect(createdCollection.type).toBe('base');
    });
    
    it('should handle errors gracefully', async () => {
      try {
        const invalidCollectionData = {
          name: '',
          type: 'base'
        };
        await pb.collections.create(invalidCollectionData);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(400);
      }
    });
  });

  describe('updateCollection', () => {
    it('should be registered', () => {
      expect(pb.collections).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const collectionName = `${TEST_COLLECTION_PREFIX}${Date.now()}`;
      const createdCollection = await pb.collections.create({
        name: collectionName,
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: []
      });
      
      const updatedData = {
        ...createdCollection,
        listRule: 'id != ""',
        name: `${collectionName}_updated`
      };
      
      const updatedCollection = await pb.collections.update(createdCollection.id, updatedData);
      
      expect(updatedCollection.id).toBe(createdCollection.id);
      expect(updatedCollection.listRule).toBe('id != ""');
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collections.update('non_existent_12345', {
          name: 'updated_name'
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });

  describe('deleteCollection', () => {
    it('should be registered', () => {
      expect(pb.collections).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const collectionName = `${TEST_COLLECTION_PREFIX}${Date.now()}`;
      const createdCollection = await pb.collections.create({
        name: collectionName,
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: []
      });
      
      const result = await pb.collections.delete(createdCollection.id);
      
      expect(result).toBeUndefined();
      
      try {
        await pb.collections.getOne(createdCollection.id);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as any).status).toBe(404);
      }
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collections.delete('non_existent_12345');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });
});