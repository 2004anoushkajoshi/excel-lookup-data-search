// server.js
// Express Backend Server with MongoDB Atlas Authentication & Centralized Shared Sheet Engine
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'mumbai2026_glancex_secret_key_default';
const MONGODB_URI = process.env.MONGODB_URI;

// AES-256-GCM Secret Encryption Key (Derived from JWT Secret & System Salt)
const ENCRYPTION_KEY = crypto.scryptSync(JWT_SECRET, 'glancex_salt_aes_2026', 32);

// AES-256-GCM Encrypt File Buffer
function encryptFileBuffer(buffer) {
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]);
    } catch (err) {
        console.error('Encryption error:', err);
        return buffer;
    }
}

// AES-256-GCM Decrypt File Buffer
function decryptFileBuffer(packedBuffer) {
    try {
        if (!Buffer.isBuffer(packedBuffer)) {
            packedBuffer = Buffer.from(packedBuffer, 'base64');
        }
        if (packedBuffer.length < 28) {
            return packedBuffer;
        }

        const iv = packedBuffer.subarray(0, 12);
        const authTag = packedBuffer.subarray(12, 28);
        const encryptedData = packedBuffer.subarray(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        
        return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (err) {
        return packedBuffer;
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-Memory Storage for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Ensure local data fallback directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const localDbPath = path.join(dataDir, 'local_db.json');

// --- MONGOOSE SCHEMAS & MODELS ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    contactNumber: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const sharedFileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    fileData: { type: Buffer, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    uploadedBy: { type: String, default: 'admin' },
    uploadedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    expiryType: { type: String, default: 'never' },
    isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);
const SharedFile = mongoose.model('SharedFile', sharedFileSchema);

let isConnectedToMongo = false;

// --- LOCAL DB FALLBACK HELPER ---
let localMemoryDb = {
    users: [],
    activeFile: null
};

function loadLocalDb() {
    try {
        if (fs.existsSync(localDbPath)) {
            const raw = fs.readFileSync(localDbPath, 'utf8');
            localMemoryDb = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Could not read local DB file, starting fresh.');
    }
}

function saveLocalDb() {
    try {
        fs.writeFileSync(localDbPath, JSON.stringify({
            users: localMemoryDb.users,
            activeFile: localMemoryDb.activeFile ? {
                ...localMemoryDb.activeFile,
                fileData: localMemoryDb.activeFile.fileData ? localMemoryDb.activeFile.fileData.toString('base64') : null
            } : null
        }, null, 2));
    } catch (e) {
        console.error('Error saving local DB:', e);
    }
}

loadLocalDb();

function initLocalAdmin() {
    const existing = localMemoryDb.users.find(u => u.username === 'admin');
    if (!existing) {
        const hashedPassword = bcrypt.hashSync('mumbai2026admin', 10);
        localMemoryDb.users.push({
            _id: 'local_admin_1',
            username: 'admin',
            password: hashedPassword,
            contactNumber: 'System Admin',
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        saveLocalDb();
        console.log('👑 Default Admin account initialized: "admin" / "mumbai2026admin"');
    }
}
initLocalAdmin();

// --- MONGOOSE CONNECTION & SEEDING ---
async function connectDB() {
    if (!MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI not provided in .env. Running in local mode.');
        return;
    }
    try {
        mongoose.set('bufferCommands', false);
        const connectPromise = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Atlas SRV timeout')), 2000));
        await Promise.race([connectPromise, timeoutPromise]);
        isConnectedToMongo = true;
        console.log('✅ Successfully connected to MongoDB Atlas database!');
        await seedDefaultAdmin();
    } catch (err) {
        console.warn('⚠️ MongoDB Atlas Connection Note:', err.message);
        console.log('ℹ️ Running smoothly on resilient local database engine.');
    }
}

async function seedDefaultAdmin() {
    try {
        const adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash('mumbai2026admin', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                contactNumber: 'System Admin',
                role: 'admin'
            });
            console.log('👑 Admin seeded in MongoDB Atlas (admin / mumbai2026admin)');
        }
    } catch (err) {
        console.error('Seed admin error:', err.message);
    }
}

connectDB();

// --- AUTHENTICATION MIDDLEWARES ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token missing.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired session token.' });
        }
        req.user = decoded;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin permissions required.' });
    }
    next();
}

// Helper for calculating Expiration date
function calculateExpirationDate(expiryType, customDateStr) {
    const now = new Date();
    if (expiryType === 'today') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (expiryType === '1_day') {
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (expiryType === '3_days') {
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else if (expiryType === '7_days') {
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (expiryType === '30_days') {
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (expiryType === 'custom' && customDateStr) {
        const customDate = new Date(customDateStr);
        return isNaN(customDate.getTime()) ? null : customDate;
    }
    return null;
}

// --- API ENDPOINTS ---

// 1. LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const cleanUsername = String(username).trim().toLowerCase();
        let user = null;

        if (isConnectedToMongo) {
            try {
                user = await User.findOne({ username: cleanUsername });
            } catch (e) {
                user = null;
            }
        }
        
        // Fallback to local store if not found or mongo offline
        if (!user) {
            user = localMemoryDb.users.find(u => u.username === cleanUsername);
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const tokenPayload = {
            id: user._id || user.id,
            username: user.username,
            role: user.role,
            contactNumber: user.contactNumber
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id || user.id,
                username: user.username,
                role: user.role,
                contactNumber: user.contactNumber
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// 2. GET CURRENT USER PROFILE
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        let user = null;
        if (isConnectedToMongo) {
            try {
                user = await User.findOne({ username: req.user.username }).select('-password');
            } catch (e) {}
        }
        if (!user) {
            user = localMemoryDb.users.find(u => u.username === req.user.username);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        const cleanUser = {
            id: user._id || user.id,
            username: user.username,
            role: user.role,
            contactNumber: user.contactNumber
        };
        res.json({ user: cleanUser });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching profile.' });
    }
});

// 3. CHANGE PASSWORD (Admin & Normal Users)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        let mongoUser = null;
        if (isConnectedToMongo) {
            try {
                mongoUser = await User.findOne({ username: req.user.username });
            } catch (e) {}
        }
        let localUser = localMemoryDb.users.find(u => u.username === req.user.username);

        const targetUser = mongoUser || localUser;
        if (!targetUser) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, targetUser.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password entered is incorrect.' });
        }

        const newHashed = await bcrypt.hash(newPassword, 10);
        
        // Synchronize password change in MongoDB Atlas
        if (isConnectedToMongo) {
            try {
                await User.findOneAndUpdate({ username: req.user.username }, { password: newHashed });
            } catch (e) {}
        }

        // Synchronize password change in Local DB
        if (localUser) {
            localUser.password = newHashed;
            saveLocalDb();
        }

        res.json({ message: 'Password updated successfully!' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

// 4. LIST USERS (Admin Only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        let mongoUsers = [];
        if (isConnectedToMongo) {
            try {
                mongoUsers = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
            } catch (e) {}
        }
        const localUsers = localMemoryDb.users.filter(u => u.role === 'user').map(u => ({
            _id: u._id,
            username: u.username,
            contactNumber: u.contactNumber,
            role: u.role,
            createdAt: u.createdAt
        }));

        const combinedMap = new Map();
        localUsers.forEach(u => combinedMap.set(u.username, u));
        mongoUsers.forEach(u => combinedMap.set(u.username, u));

        res.json({ users: Array.from(combinedMap.values()) });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user list.' });
    }
});

// 5. CREATE USER (Admin Only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password, contactNumber } = req.body;
        if (!username || !password || password.length < 6) {
            return res.status(400).json({ error: 'Username and password (min 6 chars) required.' });
        }

        const cleanUsername = String(username).trim().toLowerCase();
        
        // Check duplicate in Local DB & MongoDB Atlas
        const localExist = localMemoryDb.users.some(u => u.username.toLowerCase() === cleanUsername);
        let mongoExist = false;
        if (isConnectedToMongo) {
            try {
                mongoExist = await User.findOne({ username: cleanUsername });
            } catch (e) {}
        }

        if (localExist || mongoExist) {
            return res.status(400).json({ error: `Username "${cleanUsername}" already exists.` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newObj = {
            _id: 'usr_' + Date.now(),
            username: cleanUsername,
            password: hashedPassword,
            contactNumber: contactNumber || '',
            role: 'user',
            createdAt: new Date().toISOString()
        };

        if (isConnectedToMongo) {
            try {
                await User.create({
                    username: cleanUsername,
                    password: hashedPassword,
                    contactNumber: contactNumber || '',
                    role: 'user'
                });
            } catch (e) {}
        }

        localMemoryDb.users.push(newObj);
        saveLocalDb();

        res.status(201).json({
            message: 'User created successfully',
            user: { username: newObj.username, contactNumber: newObj.contactNumber, role: newObj.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

// 6. RESET USER PASSWORD (Admin Only - Requires Admin Verification Password)
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { adminPassword, newPassword } = req.body;
        if (!adminPassword) {
            return res.status(400).json({ error: 'Admin verification password is required.' });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New user password must be at least 6 characters.' });
        }

        // Verify Admin Password using username
        let adminUser = null;
        if (isConnectedToMongo) {
            try {
                adminUser = await User.findOne({ username: req.user.username });
            } catch (e) {}
        }
        if (!adminUser) {
            adminUser = localMemoryDb.users.find(u => u.username === req.user.username);
        }

        if (!adminUser) {
            return res.status(404).json({ error: 'Admin user account not found.' });
        }

        const isAdminPassValid = await bcrypt.compare(adminPassword, adminUser.password);
        if (!isAdminPassValid) {
            return res.status(401).json({ error: 'Admin verification password is incorrect. Permission denied.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const targetIdentifier = String(req.params.id).trim().toLowerCase();

        // Reset User Password in MongoDB Atlas
        if (isConnectedToMongo) {
            try {
                let updatedDoc = null;
                if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                    updatedDoc = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
                }
                if (!updatedDoc) {
                    await User.findOneAndUpdate(
                        { username: targetIdentifier },
                        { password: hashedPassword }
                    );
                }
            } catch (e) {
                console.error('Mongo user password update error:', e);
            }
        }

        // Reset User Password in Local Store
        const localUser = localMemoryDb.users.find(u => 
            (u._id || u.id) == req.params.id || u.username.toLowerCase() === targetIdentifier
        );
        if (localUser) {
            localUser.password = hashedPassword;
            saveLocalDb();
        }

        res.json({ message: 'User password reset successfully after Admin verification.' });
    } catch (err) {
        console.error('Reset user password error:', err);
        res.status(500).json({ error: 'Failed to reset user password.' });
    }
});

// 7. DELETE USER (Admin Only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetIdentifier = String(req.params.id).trim().toLowerCase();
        if (isConnectedToMongo) {
            try {
                let deletedDoc = null;
                if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                    deletedDoc = await User.findByIdAndDelete(req.params.id);
                }
                if (!deletedDoc) {
                    await User.findOneAndDelete({ username: targetIdentifier });
                }
            } catch (e) {}
        }

        localMemoryDb.users = localMemoryDb.users.filter(u => 
            ((u._id || u.id) != req.params.id && u.username.toLowerCase() !== targetIdentifier) || u.role === 'admin'
        );
        saveLocalDb();

        res.json({ message: 'User deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

// 8. UPLOAD SHARED FILE (Admin Only)
app.post('/api/file/upload', authenticateToken, requireAdmin, upload.single('sheetFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No Excel or CSV file uploaded.' });
        }

        const { expiryType, customDate } = req.body;
        const expiresAt = calculateExpirationDate(expiryType || 'never', customDate);

        // Encrypt file buffer with AES-256-GCM before saving to MongoDB Atlas
        const encryptedBuffer = encryptFileBuffer(req.file.buffer);

        const fileRecord = {
            fileName: req.file.originalname,
            fileData: encryptedBuffer,
            fileSize: req.file.size,
            mimeType: req.file.mimetype || 'application/octet-stream',
            uploadedBy: req.user.username,
            uploadedAt: new Date(),
            expiresAt: expiresAt,
            expiryType: expiryType || 'never',
            isActive: true
        };

        if (isConnectedToMongo) {
            try {
                await SharedFile.updateMany({ isActive: true }, { isActive: false });
                await SharedFile.create(fileRecord);
            } catch (e) {}
        }

        localMemoryDb.activeFile = fileRecord;
        saveLocalDb();

        res.status(201).json({
            message: 'Shared file uploaded, AES-256 encrypted, and synchronized to all users!',
            fileMeta: {
                fileName: fileRecord.fileName,
                fileSize: fileRecord.fileSize,
                uploadedAt: fileRecord.uploadedAt,
                expiresAt: fileRecord.expiresAt,
                expiryType: fileRecord.expiryType
            }
        });
    } catch (err) {
        console.error('Upload file error:', err);
        res.status(500).json({ error: 'Failed to upload shared sheet.' });
    }
});

// 9. SHARED FILE METADATA (Authenticated Users)
app.get('/api/file/meta', authenticateToken, async (req, res) => {
    try {
        let activeFile = null;
        if (isConnectedToMongo) {
            try {
                activeFile = await SharedFile.findOne({ isActive: true }).select('-fileData');
            } catch (e) {}
        }
        if (!activeFile) {
            activeFile = localMemoryDb.activeFile;
        }

        if (!activeFile) {
            return res.status(404).json({ message: 'No active shared sheet available.' });
        }

        if (activeFile.expiresAt && new Date(activeFile.expiresAt) < new Date()) {
            // Delete expired file from MongoDB Atlas & local store
            if (isConnectedToMongo) {
                try {
                    await SharedFile.deleteMany({ expiresAt: { $lt: new Date() } });
                } catch (e) {}
            }
            localMemoryDb.activeFile = null;
            saveLocalDb();
            return res.status(404).json({ message: 'Shared sheet has expired and was purged.', isExpired: true });
        }

        res.json({
            fileMeta: {
                fileName: activeFile.fileName,
                fileSize: activeFile.fileSize,
                uploadedBy: activeFile.uploadedBy,
                uploadedAt: activeFile.uploadedAt,
                expiresAt: activeFile.expiresAt,
                expiryType: activeFile.expiryType
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error reading file metadata.' });
    }
});

// 10. DOWNLOAD CURRENT SHARED FILE (Authenticated Users)
app.get('/api/file/current', authenticateToken, async (req, res) => {
    try {
        let activeFile = null;
        if (isConnectedToMongo) {
            try {
                activeFile = await SharedFile.findOne({ isActive: true });
            } catch (e) {}
        }
        if (!activeFile) {
            activeFile = localMemoryDb.activeFile;
        }

        if (!activeFile) {
            return res.status(404).json({ error: 'No active shared sheet uploaded by Admin.' });
        }

        if (activeFile.expiresAt && new Date(activeFile.expiresAt) < new Date()) {
            if (isConnectedToMongo) {
                try {
                    await SharedFile.deleteMany({ expiresAt: { $lt: new Date() } });
                } catch (e) {}
            }
            localMemoryDb.activeFile = null;
            saveLocalDb();
            return res.status(410).json({ error: 'The shared sheet has expired and was purged.', isExpired: true });
        }

        let bufferData = activeFile.fileData;
        if (typeof bufferData === 'string') {
            bufferData = Buffer.from(bufferData, 'base64');
        }

        // Decrypt AES-256-GCM buffer on-the-fly in RAM
        const decryptedBuffer = decryptFileBuffer(bufferData);

        res.setHeader('Content-Type', activeFile.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${activeFile.fileName}"`);
        if (activeFile.expiresAt) {
            res.setHeader('X-File-Expires-At', new Date(activeFile.expiresAt).toISOString());
        }
        res.send(decryptedBuffer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve active shared sheet.' });
    }
});

// 11. CLEAR ACTIVE FILE (Admin Only)
app.delete('/api/file/clear', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (isConnectedToMongo) {
            try {
                await SharedFile.updateMany({ isActive: true }, { isActive: false });
            } catch (e) {}
        }
        localMemoryDb.activeFile = null;
        saveLocalDb();
        res.json({ message: 'Active shared file cleared.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear active file.' });
    }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express HTTP Server
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 GlanceX Directory Engine running on http://localhost:${PORT}`);
    console.log(`🔐 MongoDB Atlas Auth & Centralized File Sharing Active`);
    console.log(`===================================================`);
});
