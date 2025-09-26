// AWS S3 Service - Enterprise Grade
import AWS from 'aws-sdk'
import { nanoid } from 'nanoid'

export class S3Service {
  private s3: AWS.S3
  private bucketName: string

  constructor(config: any) {
    this.s3 = new AWS.S3({
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
      region: config.awsRegion,
    })
    this.bucketName = config.awsS3Bucket
  }

  /**
   * Upload a base64 image to S3
   * @param base64Data Base64 encoded image data (with data:image/... prefix)
   * @param key S3 object key/path
   * @returns S3 object URL
   */
  async uploadBase64Image(base64Data: string, key: string): Promise<string> {
    try {
      // Extract image data and format
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
      if (!matches) {
        throw new Error('Invalid base64 image format')
      }

      const [, imageFormat, imageData] = matches
      const buffer = Buffer.from(imageData, 'base64')

      // Generate unique key if not provided
      const finalKey = key || `uploads/${nanoid()}.${imageFormat}`

      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: finalKey,
        Body: buffer,
        ContentType: `image/${imageFormat}`,
        ContentEncoding: 'base64',
        ACL: 'public-read', // Make images publicly accessible
      }

      const result = await this.s3.upload(params).promise()
      return result.Location

    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload image to S3')
    }
  }

  /**
   * Upload a file buffer to S3
   * @param buffer File buffer
   * @param key S3 object key/path
   * @param contentType MIME type
   * @returns S3 object URL
   */
  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      }

      const result = await this.s3.upload(params).promise()
      return result.Location

    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload file to S3')
    }
  }

  /**
   * Delete an object from S3
   * @param key S3 object key/path
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      }

      await this.s3.deleteObject(params).promise()

    } catch (error) {
      console.error('S3 delete error:', error)
      throw new Error('Failed to delete file from S3')
    }
  }

  /**
   * Delete multiple objects from S3
   * @param keys Array of S3 object keys/paths
   */
  async deleteObjects(keys: string[]): Promise<void> {
    try {
      if (keys.length === 0) return

      const params: AWS.S3.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
        },
      }

      await this.s3.deleteObjects(params).promise()

    } catch (error) {
      console.error('S3 bulk delete error:', error)
      throw new Error('Failed to delete files from S3')
    }
  }

  /**
   * Generate a presigned URL for temporary access
   * @param key S3 object key/path
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      }

      return this.s3.getSignedUrl('getObject', params)

    } catch (error) {
      console.error('S3 presigned URL error:', error)
      throw new Error('Failed to generate presigned URL')
    }
  }

  /**
   * Check if an object exists in S3
   * @param key S3 object key/path
   * @returns Boolean indicating existence
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()
      return true

    } catch (error) {
      if ((error as AWS.AWSError).statusCode === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Get object metadata
   * @param key S3 object key/path
   * @returns Object metadata
   */
  async getObjectMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      return await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()

    } catch (error) {
      console.error('S3 metadata error:', error)
      throw new Error('Failed to get object metadata')
    }
  }

  /**
   * Delete all objects in a user folder
   * @param userFolderPrefix User folder prefix (e.g., "users/userId/")
   */
  async deleteUserFolder(userFolderPrefix: string): Promise<void> {
    try {
      // List all objects with the prefix
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        Prefix: userFolderPrefix,
      }

      const listedObjects = await this.s3.listObjectsV2(listParams).promise()

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        return // No objects to delete
      }

      // Delete all objects
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: listedObjects.Contents.map(object => ({ Key: object.Key! })),
        },
      }

      await this.s3.deleteObjects(deleteParams).promise()

      // If there are more objects (truncated response), recursively delete
      if (listedObjects.IsTruncated) {
        await this.deleteUserFolder(userFolderPrefix)
      }

    } catch (error) {
      console.error('S3 folder delete error:', error)
      throw new Error('Failed to delete user folder from S3')
    }
  }
}
