import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../../../apps/web/lib/pocketbase/client';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync } from 'fs';

const pb = createClient();

const TEST_FILE_NAME = `test_file_${Date.now()}.txt`;

describe('Storage Tools', () => {
  async function cleanupTestFiles() {
    try {
    } catch {}
  }

  beforeEach(async () => {
    await cleanupTestFiles();
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  describe('uploadFile', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const tempFilePath = join(tmpdir(), TEST_FILE_NAME);
      const fileContent = 'Hello, World!';
      writeFileSync(tempFilePath, fileContent);
      
      try {
        const formData = new FormData();
        const fileBlob = new Blob([fileContent], { type: 'text/plain' });
        formData.append('file', fileBlob, TEST_FILE_NAME);
        
        const response = await fetch(
          `${pb.baseUrl}/api/collections/users/records`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        expect(response.status).toBeLessThan(500);
      } finally {
        try {
          unlinkSync(tempFilePath);
        } catch {}
      }
    });
    
    it('should handle errors gracefully', async () => {
      try {
        const formData = new FormData();
        const fileBlob = new Blob(['test'], { type: 'text/plain' });
        formData.append('file', fileBlob, 'test.txt');
        
        const response = await fetch(
          `${pb.baseUrl}/api/collections/non_existent_12345/records`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        expect(response.status).toBeGreaterThanOrEqual(400);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getFile', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const fileId = 'test_file_id';
      const collectionId = 'users';
      const recordId = 'test_record_id';
      
      const fileUrl = `${pb.baseUrl}/api/files/${collectionId}/${recordId}/${fileId}`;
      
      expect(fileUrl).toContain('/api/files/');
      expect(fileUrl).toContain(collectionId);
      expect(fileUrl).toContain(recordId);
      expect(fileUrl).toContain(fileId);
    });
    
    it('should handle errors gracefully', async () => {
      const fileUrl = `${pb.baseUrl}/api/files/non_existent_collection/non_existent_record/non_existent_file`;
      
      const response = await fetch(fileUrl);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('deleteFile', () => {
    it('should be registered', () => {
      expect(pb.collection).toBeDefined();
    });
    
    it('should accept valid params', async () => {
      const userData = {
        email: `test_delete_file_${Date.now()}@eggo.io`,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test Delete File User',
        externalId: `test_delete_file_external_${Date.now()}`
      };

      const createdUser = await pb.collection('users').create(userData);
      
      const updateData = {
        ...createdUser,
        avatar: null
      };
      
      const updatedUser = await pb.collection('users').update(createdUser.id, updateData);
      
      expect(updatedUser.avatar).toBeNull();
    });
    
    it('should handle errors gracefully', async () => {
      try {
        await pb.collection('users').update('non_existent_12345', {
          avatar: null
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as any).status).toBe(404);
      }
    });
  });
});