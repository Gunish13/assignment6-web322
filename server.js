require('dotenv').config();
console.log("Mailgun API Key:", process.env.MAILGUN_API_KEY);
console.log("Mailgun Domain:", process.env.MAILGUN_DOMAIN);

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const productUtil = require('./modules/product-util');


// Mailgun Setup
const formData = require('form-data'); 
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api', 
    key: process.env.MAILGUN_API_KEY 
});

app.set('view engine', 'ejs');
app.set('layout', 'main');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Home Page Route
app.get('/', (req, res) => {
    const featuredProducts = productUtil.getFeaturedProducts();
    res.render('home', { featuredProducts });
});

// Inventory Page Route
app.get('/inventory', (req, res) => {
    const products = productUtil.getAllProducts();
    const categorizedProducts = productUtil.getProductsByCategory(products);
    res.render('inventory', { categorizedProducts });
});

// Sign-Up Page Route
app.get('/sign-up', (req, res) => res.render('sign-up', { errors: null, firstName: '', lastName: '', email: '', password: '' }));

// Sign-Up Form Handling
app.post('/sign-up', (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    let errors = [];

    // Validation
    if (!firstName) errors.push('First Name is required');
    if (!lastName) errors.push('Last Name is required');
    if (!email) errors.push('Email is required');
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) errors.push('Invalid email format');
    if (!password) errors.push('Password is required');
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/.test(password)) errors.push('Password must be 8-12 characters with a lowercase, uppercase, number, and symbol');

    if (errors.length > 0) {
        return res.render('sign-up', { errors, firstName, lastName, email, password });
    }

    // Sending Welcome Email via Mailgun
    const data = {
        from: 'Gunish Sharma <gsharma110@myseneca.ca>',
        to: email,
        subject: 'Welcome to WoodWorks',
        text: `Hello ${firstName} ${lastName},\n\nWelcome to WoodWorks! I’m Gunish Sharma. Enjoy shopping for high-quality furniture!\n\nBest,\nGunish`
    };

    mg.messages.create(process.env.MAILGUN_DOMAIN, data)
        .then(body => {
            console.log('Email sent:', body);
            res.redirect('/welcome');
        })
        .catch(error => {
            console.error('Mailgun error:', error);
            return res.render('sign-up', { errors: ['Failed to send welcome email'], firstName, lastName, email, password });
        });
});

// Log-In Page Route
app.get('/log-in', (req, res) => res.render('log-in', { error: null, email: '' }));

// Log-In Form Handling
app.post('/log-in', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('log-in', { error: 'Please enter both email and password', email });
    }

    // Placeholder for future authentication (Assignment #4)
    res.redirect('/');
});

// Welcome Page Route
app.get('/welcome', (req, res) => res.render('welcome'));

// Server Start
const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
