const ImageModel = require("../models/ImageModel");
const cloudinary = require("../Utils/Cloudinary");
const fs = require('fs');

const newImage = async (req, res) => {
    try {
        const { name,link } = req.fields;
        const { photo1, photo2 } = req.files; // Assuming photo1 and photo2 are separate files

        if (!name) {
            return res.status(400).send({
                success: false,
                message: "Name is required",
            });
        }

        let image1Url = '';
        let image2Url = '';

        if (photo1) {
            const result1 = await cloudinary.uploader.upload(photo1.path);
            image1Url = result1.secure_url;
        }

        if (photo2) {
            const result2 = await cloudinary.uploader.upload(photo2.path);
            image2Url = result2.secure_url;
        }

        let image = await ImageModel.findOne({ name });
        if (!image) {
            image = new ImageModel({ name,link });
        }

        image.image1 = image1Url;
        image.image2 = image2Url;
        await image.save();

        res.status(201).send({
            success: true,
            message: "Images uploaded successfully",
            image,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error uploading images",
            error: error.message,
        });
    }
};

const getImage = async (req, res) => {
    try {
        const images = await ImageModel.find({}).sort({ createdAt: -1 });

        res.status(200).send({
            success: true,
            message: "Images retrieved successfully",
            images,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error fetching images",
            error: error.message,
        });
    }
};

const delImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await ImageModel.findById(id);

        if (!image) {
            return res.status(404).send({
                success: false,
                message: "Image not found",
            });
        }

        const extractPublicId = (url) => url.split('/').pop().split('.')[0];
        const publicId1 = image.image1 ? extractPublicId(image.image1) : null;
        const publicId2 = image.image2 ? extractPublicId(image.image2) : null;

        if (publicId1) await cloudinary.uploader.destroy(publicId1);
        if (publicId2) await cloudinary.uploader.destroy(publicId2);

        await ImageModel.findByIdAndDelete(id);

        res.status(200).send({
            success: true,
            message: "Image deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error deleting image",
            error: error.message,
        });
    }
};

module.exports = {newImage,getImage,delImage};