require('dotenv').config();
console.log("Mailgun API Key:", process.env.MAILGUN_API_KEY);
console.log("Mailgun Domain:", process.env.MAILGUN_DOMAIN);
console.log("MongoDB URI:", process.env.MONGODB_URI ? "Configured" : "Missing");

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const productUtil = require('./modules/product-util');
const formData = require('form-data'); 
const Mailgun = require('mailgun.js');

// **Added imports**
const fileUpload = require('express-fileupload');
const path = require('path');

// Initialize Express app
const app = express();

// Mailgun Setup
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api', 
    key: process.env.MAILGUN_API_KEY 
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// **Added middleware for file upload**
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// View engine setup
app.set('view engine', 'ejs');
app.set('layout', 'main');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to make user data available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.mg = mg; // Make Mailgun client available to views if needed
    next();
});

// Import controllers
const generalController = require('./controllers/generalController');
const inventoryController = require('./controllers/inventoryController');
const loadDataController = require('./controllers/loadDataController');
const cartController = require('./controllers/cartController'); // Added cart controller

// Home Page Route (kept here temporarily for reference, but should move to controller)
app.get('/', (req, res) => {
    const featuredProducts = productUtil.getFeaturedProducts();
    res.render('home', { featuredProducts, user: req.session.user });
});

// Inventory Page Route (kept here temporarily for reference, but should move to controller)
app.get('/inventory', (req, res) => {
    const products = productUtil.getAllProducts();
    const categorizedProducts = productUtil.getProductsByCategory(products);
    res.render('inventory', { categorizedProducts, user: req.session.user });
});

// Use controllers
app.use('/', generalController);
app.use('/inventory', inventoryController);
app.use('/load-data', loadDataController);
app.use('/cart', cartController); // Added cart controller routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', { 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { 
        message: 'Page not found' 
    });
});

// Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN}`);
    console.log(`Database: ${process.env.MONGODB_URI ? "Connected" : "Not configured"}`);
});