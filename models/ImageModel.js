const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    image1: {
        type: String,
        required: false, // Not required if you want to allow one image initially
    },
    image2: {
        type: String,
        required: false, // Not required if you want to allow one image initially
    },
    link:{
        type:String,
    }
}, {
    timestamps: true
});

// Optional: Add an index if you query by name frequently
imageSchema.index({ name: 1 });

const ImageModel = mongoose.model("Image", imageSchema);
module.exports = ImageModel;
