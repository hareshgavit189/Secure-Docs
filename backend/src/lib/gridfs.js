import mongoose from 'mongoose';

let bucket = null;

/**
 * Returns the MongoDB GridFS Bucket for streaming large file storage (>16MB up to multi-GB).
 */
export function getGridFSBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected yet for GridFS storage.');
  }
  
  if (!bucket || bucket.s?.db !== mongoose.connection.db) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'evidence_files',
      chunkSizeBytes: 255 * 1024, // 255 KB per chunk standard
    });
  }

  return bucket;
}
