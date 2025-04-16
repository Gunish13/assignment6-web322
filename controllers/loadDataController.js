const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');

// Load products data
router.get('/products', async (req, res) => {
    try {
        // Check if user is authorized (data clerk)
        if (!req.session.user || req.session.user.role !== 'clerk') {
            return res.status(403).render('load-data', { 
                message: 'You are not authorized to add products',
                layout: 'main'
            });
        }

        // Check if products already exist
        const productCount = await Product.countDocuments();
        if (productCount > 0) {
            return res.render('load-data', { 
                message: 'Products have already been added to the database',
                layout: 'main'
            });
        }

        // Sample products data
        const products = [
            {
                title: "Luxury Sofa",
                description: "A plush sofa perfect for your living room.",
                category: "Living Room Furniture",
                price: 599.99,
                salePrice: 499.99,
                shippingWeight: 40,
                shippingWidth: 200,
                shippingLength: 100,
                shippingHeight: 80,
                imageUrl: "/images/product1.jpg",
                featured: true
            },
            {
                title: "Wooden Table",
                description: "A sturdy table for dining or work.",
                category: "Living Room Furniture",
                price: 299.99,
                shippingWeight: 25,
                shippingWidth: 150,
                shippingLength: 80,
                shippingHeight: 75,
                imageUrl: "/images/product2.jpg",
                featured: true
            },
            {
                title: "Modern Chair",
                description: "Sleek chair with contemporary design.",
                category: "Living Room Furniture",
                price: 199.99,
                salePrice: 149.99,
                shippingWeight: 15,
                shippingWidth: 60,
                shippingLength: 60,
                shippingHeight: 90,
                imageUrl: "/images/product3.jpg",
                featured: true
            },
            {
                title: "Leather Recliner",
                description: "Comfortable recliner for relaxation.",
                category: "Living Room Furniture",
                price: 799.99,
                shippingWeight: 50,
                shippingWidth: 100,
                shippingLength: 100,
                shippingHeight: 100,
                imageUrl: "/images/recliner.jpg",
                featured: false
            },
            {
                title: "Oak Bed Frame",
                description: "Solid oak bed for a cozy bedroom.",
                category: "Bedroom Furniture",
                price: 699.99,
                salePrice: 599.99,
                shippingWeight: 60,
                shippingWidth: 200,
                shippingLength: 150,
                shippingHeight: 30,
                imageUrl: "/images/bed.jpg",
                featured: true
            },
            {
                title: "Nightstand",
                description: "Simple nightstand with storage.",
                category: "Bedroom Furniture",
                price: 129.99,
                shippingWeight: 10,
                shippingWidth: 50,
                shippingLength: 50,
                shippingHeight: 60,
                imageUrl: "/images/nightstand.jpg",
                featured: false
            }
        ];

        // Insert products
        await Product.insertMany(products);

        res.render('load-data', { 
            message: 'Added products to the database',
            layout: 'main'
        });
    } catch (err) {
        console.error('Error loading products:', err);
        res.status(500).render('load-data', { 
            message: 'Error loading products',
            layout: 'main'
        });
    }
});

module.exports = router;