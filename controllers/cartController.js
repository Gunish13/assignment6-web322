const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const mailgun = require('../config/mailgun');

// Add item to cart
router.post('/add', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'customer') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).render('404', { message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId: req.session.user.id });
        
        if (!cart) {
            cart = new Cart({
                userId: req.session.user.id,
                items: [{ productId, quantity: 1 }]
            });
        } else {
            const existingItem = cart.items.find(item => item.productId.toString() === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.items.push({ productId, quantity: 1 });
            }
        }

        await cart.save();
        res.redirect('/cart');
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).render('500', { message: 'Error adding to cart' });
    }
});

// Update cart item quantity
router.post('/update', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'customer') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const { productId, quantity } = req.body;
        const cart = await Cart.findOne({ userId: req.session.user.id });
        
        if (!cart) {
            return res.redirect('/cart');
        }

        const item = cart.items.find(item => item.productId.toString() === productId);
        
        if (item) {
            if (parseInt(quantity) <= 0) {
                cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            } else {
                item.quantity = parseInt(quantity);
            }
            
            await cart.save();
        }
        
        res.redirect('/cart');
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).render('500', { message: 'Error updating cart' });
    }
});

// Remove item from cart
router.post('/remove', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'customer') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const { productId } = req.body;
        const cart = await Cart.findOne({ userId: req.session.user.id });
        
        if (!cart) {
            return res.redirect('/cart');
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        
        res.redirect('/cart');
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).render('500', { message: 'Error removing from cart' });
    }
});

// Place order
router.post('/place-order', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'customer') {
        return res.status(401).render('401', { message: 'You are not authorized to view this page.' });
    }

    try {
        const cart = await Cart.findOne({ userId: req.session.user.id }).populate('items.productId');
        const user = await User.findById(req.session.user.id);
        
        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }

        // Calculate totals
        let subtotal = 0;
        let orderDetails = '<h2>Your Order Details</h2><table border="1"><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th></tr>';
        
        cart.items.forEach(item => {
            const product = item.productId;
            const price = product.salePrice || product.price;
            const lineTotal = price * item.quantity;
            subtotal += lineTotal;
            
            orderDetails += `<tr>
                <td>${product.title}</td>
                <td>$${price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${lineTotal.toFixed(2)}</td>
            </tr>`;
        });

        const tax = subtotal * 0.10;
        const grandTotal = subtotal + tax;
        
        orderDetails += `</table>
            <p>Subtotal: $${subtotal.toFixed(2)}</p>
            <p>Tax (10%): $${tax.toFixed(2)}</p>
            <p>Grand Total: $${grandTotal.toFixed(2)}</p>
            <p>Thank you for your order!</p>`;

        // Send email
        await mailgun.sendEmail({
            to: user.email,
            subject: 'Your Order Confirmation',
            html: orderDetails
        });

        // Clear cart
        await Cart.deleteOne({ _id: cart._id });
        
        res.redirect('/cart?order=success');
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).render('500', { message: 'Error placing order' });
    }
});

module.exports = router;