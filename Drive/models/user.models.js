const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define user schema with validation
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [3, "Username must be at least 3 characters long"]
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    }, 
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true,
        minlength: [5, "Password must be at least 5 characters long"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Pre-save middleware to hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;