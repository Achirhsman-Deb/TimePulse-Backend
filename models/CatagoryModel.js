const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        lowercase: true,
        unique: true
    },
    image: {
        type: String
    }
});

const CategoryModel = mongoose.model("Catagory", categorySchema);
module.exports = CategoryModel;
