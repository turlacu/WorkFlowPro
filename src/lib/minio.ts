import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
  port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const bucketName = process.env.MINIO_BUCKET_NAME || 'workflowpro-storage';

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.log(`Created bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
  }
}

export async function uploadFile(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    await ensureBucketExists();
    
    const objectName = `uploads/${Date.now()}-${fileName}`;
    
    await minioClient.putObject(bucketName, objectName, fileBuffer, {
      'Content-Type': contentType,
    });
    
    return objectName;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function getFileUrl(objectName: string): Promise<string> {
  try {
    return await minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60); // 24 hours
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
}

export async function deleteFile(objectName: string): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

export default minioClient;