const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const bcrypt = require('bcryptjs');

// Home Page
router.get('/', async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true });
        res.render('home', { featuredProducts, user: req.session.user });
    } catch (err) {
        console.error('Error fetching featured products:', err);
        res.status(500).render('500', { message: 'Error loading home page' });
    }
});

// Sign-Up Page
router.get('/sign-up', (req, res) => {
    res.render('sign-up', { errors: null, firstName: '', lastName: '', email: '', password: '' });
});

// Sign-Up Form Handling
router.post('/sign-up', async (req, res) => {
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

    try {
        // Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('sign-up', { 
                errors: ['Email already registered'], 
                firstName, 
                lastName, 
                email, 
                password 
            });
        }

        // Create new user
        const newUser = new User({ firstName, lastName, email, password, role: 'customer' });
        await newUser.save();

        // Send welcome email (your existing Mailgun code)
        // ...

        // Redirect to welcome
        res.redirect('/welcome');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('sign-up', { 
            errors: ['Registration failed. Please try again.'], 
            firstName, 
            lastName, 
            email, 
            password 
        });
    }
});

// Log-In Page
router.get('/log-in', (req, res) => {
    res.render('log-in', { error: null, email: '' });
});

// Log-In Form Handling
router.post('/log-in', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.render('log-in', { error: 'Please enter both email and password', email });
    }

    try {
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('log-in', { 
                error: 'Invalid email or password', 
                email 
            });
        }

        // Check role
        if (role === 'clerk' && user.role !== 'clerk') {
            return res.render('log-in', { 
                error: 'You are not authorized as a data entry clerk', 
                email 
            });
        }

        // Set session
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            email: user.email,
            role: user.role
        };

        // Redirect based on role
        if (user.role === 'clerk') {
            res.redirect('/inventory/list');
        } else {
            res.redirect('/cart');
        }
    } catch (err) {
        console.error('Login error:', err);
        res.render('log-in', { 
            error: 'Login failed. Please try again.', 
            email 
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Session destruction error:', err);
        res.redirect('/log-in');
    });
});

// Welcome Page
router.get('/welcome', (req, res) => {
    res.render('welcome');
});

// Cart Page (protected)
router.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }
    if (req.session.user.role !== 'customer') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }
    
    try {
        const cart = await Cart.findOne({ userId: req.session.user.id }).populate('items.productId');
        res.render('cart', { 
            user: req.session.user,
            cart: cart || { items: [] },
            order: req.query.order
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).render('500', { message: 'Error loading cart' });
    }
});

module.exports = router;