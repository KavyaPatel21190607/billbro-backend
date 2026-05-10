const fs = require('fs');
const path = require('path');
const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

async function uploadPdfToCloud({ buffer, fileName }) {
  const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
  const client = getS3Client();
  
  if (!client || !bucketName) {
    return saveLocally(buffer, fileName);
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `invoices/${fileName}`,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    );

    return {
      url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/invoices/${fileName}`,
      provider: 's3',
    };
  } catch (error) {
    console.error('AWS S3 Upload Failed, falling back to local storage:', error.message);
    return saveLocally(buffer, fileName);
  }
}

function saveLocally(buffer, fileName) {
  const localPath = path.join(process.cwd(), 'backend', 'uploads', 'cloud', fileName);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, buffer);
  return {
    url: `/uploads/cloud/${fileName}`,
    provider: 'local',
  };
}

async function getPdfStreamFromCloud(fileName) {
  const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
  const client = getS3Client();
  
  if (!client || !bucketName) return null;

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: `invoices/${fileName}`,
      })
    );
    return response.Body;
  } catch (error) {
    console.error('AWS S3 Fetch Failed:', error.message);
    return null;
  }
}

module.exports = { uploadPdfToCloud, getPdfStreamFromCloud };