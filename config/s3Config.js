const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer = require('multer');

// AWS S3 Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for S3 upload
const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const folder = req.body.folder || 'uploads';
            const fileName = `${folder}/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        }
    }),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
        // Accept images, PDFs, and videos
        if (
            file.mimetype.startsWith('image/') || 
            file.mimetype === 'application/pdf' ||
            file.mimetype.startsWith('video/')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
        }
    }
});

// Helper function to delete file from S3
const deleteFromS3 = async (key) => {
    try {
        await s3Client.send({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });
        return true;
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return false;
    }
};

// Helper function to get signed URL
const getSignedUrl = async (key, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return null;
    }
};

module.exports = {
    s3Client,
    upload,
    deleteFromS3,
    getSignedUrl
}; 