const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    products: [{
        type: mongoose.ObjectId,
        ref: "Product"
    }],
    payment: {},
    buyer: {
        type: mongoose.ObjectId,
        ref: "User"
    },
    address:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'Not Process',
        enum: ['Not Process', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    },
    cancelReq: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
})

const OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;