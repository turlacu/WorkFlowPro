import { Client } from 'minio';
import { randomUUID } from 'node:crypto';

let minioClient: Client | undefined;

function getMinioClient(): Client {
  if (minioClient) return minioClient;

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint || !accessKey || !secretKey) {
    throw new Error('MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY are required');
  }

  const [endPoint, portValue] = endpoint.split(':');
  const port = Number(portValue || (process.env.MINIO_USE_SSL === 'true' ? 443 : 9000));
  if (!endPoint || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('MINIO_ENDPOINT must be in hostname:port format');
  }

  minioClient = new Client({
    endPoint,
    port,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey,
    secretKey,
  });
  return minioClient;
}

export const bucketName = process.env.MINIO_BUCKET_NAME || 'workflowpro-storage';

export async function isStorageHealthy(): Promise<boolean> {
  await getMinioClient().listBuckets();
  return true;
}

export async function ensureBucketExists() {
  const client = getMinioClient();
  const exists = await client.bucketExists(bucketName);
  if (!exists) {
    await client.makeBucket(bucketName);
  }
}

export async function uploadFile(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    await ensureBucketExists();
    
    const extension = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || '';
    const objectName = `schedules/${randomUUID()}${extension}`;
    
    await getMinioClient().putObject(bucketName, objectName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    });
    
    return objectName;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function putObject(objectName: string, data: Buffer, contentType: string): Promise<void> {
  await ensureBucketExists();
  await getMinioClient().putObject(bucketName, objectName, data, data.length, { 'Content-Type': contentType });
}

export async function listObjects(prefix: string): Promise<Array<{ name: string; size: number; lastModified: Date }>> {
  await ensureBucketExists();
  return new Promise((resolve, reject) => {
    const objects: Array<{ name: string; size: number; lastModified: Date }> = [];
    const stream = getMinioClient().listObjectsV2(bucketName, prefix, true);
    stream.on('data', (item) => {
      if (item.name) {
        objects.push({
          name: item.name,
          size: item.size,
          lastModified: item.lastModified || new Date(0),
        });
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(objects));
  });
}

export async function getFile(objectName: string) {
  const [stream, stat] = await Promise.all([
    getMinioClient().getObject(bucketName, objectName),
    getMinioClient().statObject(bucketName, objectName),
  ]);
  return { stream, stat };
}

export async function getFileUrl(objectName: string): Promise<string> {
  try {
    return await getMinioClient().presignedGetObject(bucketName, objectName, 24 * 60 * 60); // 24 hours
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
}

export async function deleteFile(objectName: string): Promise<void> {
  try {
    await getMinioClient().removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}
