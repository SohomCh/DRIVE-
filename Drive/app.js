const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const connectToDb = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Database connection
connectToDb();

// Middleware configurations
app.use(cookieParser()); // Parse cookies
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Set view engine to EJS for rendering dynamic pages
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set views directory

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Import route modules
const userRouter = require('./routes/user.routes');
const indexRouter = require('./routes/index.routes');

// Route middleware
app.use('/user', userRouter);
app.use('/', indexRouter);

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
