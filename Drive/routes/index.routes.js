const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const authMiddleware = require('../middlewares/auth');
const fileModel = require('../models/files.models');
const firebase = require('../config/firebase.config');

// Configure multer for file upload
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, uniqueSuffix);
        }
    }),
    fileFilter: (req, file, cb) => {
        // Validate file types if needed
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

// Home route to display user files
router.get('/home', authMiddleware, async (req, res) => {
    try {
        const userFiles = await fileModel.find({
            user: req.user.userId
        }).sort({ uploadedAt: -1 }); // Sort by most recent first

        res.render('home', {
            files: userFiles,
            user: req.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            message: 'Error retrieving files'
        });
    }
});

// File upload route
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded'
            });
        }

        // Create file record in database
        const newFile = await fileModel.create({
            path: req.file.path,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            user: req.user.userId
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            file: newFile
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Error uploading file'
        });
    }
});

// File download route
router.get('/download/:fileId', authMiddleware, async (req, res) => {
    try {
        const loggedInUserId = req.user.userId;
        const fileId = req.params.fileId;

        // Find file and verify user ownership
        const file = await fileModel.findOne({
            _id: fileId,
            user: loggedInUserId
        });

        if (!file) {
            return res.status(403).json({
                message: 'Unauthorized file access'
            });
        }

        // Generate signed URL for Firebase download
        const [signedUrl] = await firebase.storage().bucket().file(file.path).getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes expiration
        });

        res.redirect(signedUrl);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Error downloading file'
        });
    }
});

module.exports = router;