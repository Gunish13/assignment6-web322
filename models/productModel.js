const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { 
        type: Number, 
        required: true,
        min: 0.01,
        set: v => parseFloat(v.toFixed(2))
    },
    salePrice: { 
        type: Number,
        min: 0.01,
        set: v => v ? parseFloat(v.toFixed(2)) : null
    },
    shippingWeight: { type: Number, required: true, min: 1 },
    shippingWidth: { type: Number, required: true, min: 1 },
    shippingLength: { type: Number, required: true, min: 1 },
    shippingHeight: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, required: true },
    featured: { type: Boolean, required: true, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);