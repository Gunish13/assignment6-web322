const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');

// Middleware for file uploads
router.use(fileUpload());

// Products Page
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        const categorizedProducts = products.reduce((acc, product) => {
            const category = acc.find(c => c.category === product.category);
            if (category) {
                category.products.push(product);
            } else {
                acc.push({ category: product.category, products: [product] });
            }
            return acc;
        }, []);
        res.render('inventory', { categorizedProducts, user: req.session.user });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).render('500', { message: 'Error fetching products' });
    }
});

// Products List (protected)
router.get('/list', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }
    if (req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }
    
    try {
        const products = await Product.find().sort({ title: 1 });
        res.render('inventory-list', { 
            products, 
            user: req.session.user 
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).render('500', { message: 'Error fetching products' });
    }
});

// Add Product - GET
router.get('/add', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }
    res.render('inventory-add', { 
        product: null,
        errors: null,
        user: req.session.user 
    });
});

// Add Product - POST
router.post('/add', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    const { title, description, category, price, salePrice, shippingWeight, 
            shippingWidth, shippingLength, shippingHeight, featured } = req.body;
    
    let errors = [];
    
    // Validation
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (!category) errors.push('Category is required');
    if (!price || isNaN(price) || parseFloat(price) <= 0) errors.push('Valid price is required');
    if (salePrice && (isNaN(salePrice) || parseFloat(salePrice) <= 0)) errors.push('Valid sale price is required');
    if (!shippingWeight || isNaN(shippingWeight) || parseInt(shippingWeight) <= 0) errors.push('Valid shipping weight is required');
    if (!shippingWidth || isNaN(shippingWidth) || parseInt(shippingWidth) <= 0) errors.push('Valid shipping width is required');
    if (!shippingLength || isNaN(shippingLength) || parseInt(shippingLength) <= 0) errors.push('Valid shipping length is required');
    if (!shippingHeight || isNaN(shippingHeight) || parseInt(shippingHeight) <= 0) errors.push('Valid shipping height is required');
    
    // File upload validation
    if (!req.files || !req.files.imageUrl) {
        errors.push('Product image is required');
    } else {
        const file = req.files.imageUrl;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            errors.push('Only JPG, PNG, or GIF images are allowed');
        }
    }

    if (errors.length > 0) {
        return res.render('inventory-add', { 
            product: req.body,
            errors,
            user: req.session.user 
        });
    }

    try {
        // Handle file upload
        const file = req.files.imageUrl;
        const uploadDir = path.join(__dirname, '../public/uploads');
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file
        await file.mv(filePath);

        // Create product
        const product = new Product({
            title,
            description,
            category,
            price: parseFloat(price).toFixed(2),
            salePrice: salePrice ? parseFloat(salePrice).toFixed(2) : null,
            shippingWeight: parseInt(shippingWeight),
            shippingWidth: parseInt(shippingWidth),
            shippingLength: parseInt(shippingLength),
            shippingHeight: parseInt(shippingHeight),
            imageUrl: `/uploads/${fileName}`,
            featured: featured === 'on'
        });

        await product.save();

        res.redirect('/inventory/list');
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).render('inventory-add', { 
            product: req.body,
            errors: ['Error adding product'],
            user: req.session.user 
        });
    }
});

// Edit Product - GET
router.get('/edit/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('404', { message: 'Product not found' });
        }
        res.render('inventory-edit', { 
            product,
            errors: null,
            user: req.session.user 
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).render('500', { message: 'Error fetching product' });
    }
});

// Edit Product - POST
router.post('/edit/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    const { title, description, category, price, salePrice, shippingWeight, 
            shippingWidth, shippingLength, shippingHeight, featured } = req.body;
    
    let errors = [];
    
    // Validation
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (!category) errors.push('Category is required');
    if (!price || isNaN(price) || parseFloat(price) <= 0) errors.push('Valid price is required');
    if (salePrice && (isNaN(salePrice) || parseFloat(salePrice) <= 0)) errors.push('Valid sale price is required');
    if (!shippingWeight || isNaN(shippingWeight) || parseInt(shippingWeight) <= 0) errors.push('Valid shipping weight is required');
    if (!shippingWidth || isNaN(shippingWidth) || parseInt(shippingWidth) <= 0) errors.push('Valid shipping width is required');
    if (!shippingLength || isNaN(shippingLength) || parseInt(shippingLength) <= 0) errors.push('Valid shipping length is required');
    if (!shippingHeight || isNaN(shippingHeight) || parseInt(shippingHeight) <= 0) errors.push('Valid shipping height is required');
    
    if (errors.length > 0) {
        return res.render('inventory-edit', { 
            product: req.body,
            errors,
            user: req.session.user 
        });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('404', { message: 'Product not found' });
        }

        let imageUrl = product.imageUrl;
        
        // Handle file upload if a new file was provided
        if (req.files && req.files.imageUrl) {
            const file = req.files.imageUrl;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            
            if (!allowedTypes.includes(file.mimetype)) {
                return res.render('inventory-edit', { 
                    product: req.body,
                    errors: ['Only JPG, PNG, or GIF images are allowed'],
                    user: req.session.user 
                });
            }

            // Delete old image
            if (product.imageUrl) {
                const oldImagePath = path.join(__dirname, '../public', product.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save new image
            const uploadDir = path.join(__dirname, '../public/uploads');
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(uploadDir, fileName);

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            await file.mv(filePath);
            imageUrl = `/uploads/${fileName}`;
        }

        // Update product
        product.title = title;
        product.description = description;
        product.category = category;
        product.price = parseFloat(price).toFixed(2);
        product.salePrice = salePrice ? parseFloat(salePrice).toFixed(2) : null;
        product.shippingWeight = parseInt(shippingWeight);
        product.shippingWidth = parseInt(shippingWidth);
        product.shippingLength = parseInt(shippingLength);
        product.shippingHeight = parseInt(shippingHeight);
        product.imageUrl = imageUrl;
        product.featured = featured === 'on';

        await product.save();

        res.redirect('/inventory/list');
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).render('inventory-edit', { 
            product: req.body,
            errors: ['Error updating product'],
            user: req.session.user 
        });
    }
});

// Remove Product - GET (confirmation)
router.get('/remove/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('404', { message: 'Product not found' });
        }
        res.render('inventory-remove', { 
            product,
            user: req.session.user 
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).render('500', { message: 'Error fetching product' });
    }
});

// Remove Product - POST
router.post('/remove/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'clerk') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('404', { message: 'Product not found' });
        }

        // Delete image file
        if (product.imageUrl) {
            const imagePath = path.join(__dirname, '../public', product.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete product
        await Product.findByIdAndDelete(req.params.id);

        res.redirect('/inventory/list');
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).render('500', { message: 'Error deleting product' });
    }
});

module.exports = router;