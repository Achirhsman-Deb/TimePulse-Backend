const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name:{
        type: String,
        require: true,
    },
    slug:{
        type: String,
        lowercase: true
    },
    description:{
        type: String,
        require: true,
    },
    price:{
        type: Number,
        require: true,
    },
    quantity:{
        type: Number,
        require: true,
    },
    photo:{
        type: String,
    },
    extraPhotos: [{
        type: String,
    }],
    shipping:{
        type: Boolean,
    },
    catagory:{
        type: mongoose.ObjectId,
        ref: 'Catagory',
        require: true
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    reviews: [{
        type: mongoose.ObjectId,
        ref: 'Review'
    }]
},{timestamps: true})

const ProductModel = mongoose.model("Product",ProductSchema);
module.exports = ProductModel;