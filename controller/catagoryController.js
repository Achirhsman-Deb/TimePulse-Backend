const CatagoryModel = require("../models/CatagoryModel");
const slugify = require("slugify");
const cloudinary = require("../Utils/Cloudinary");

const CreateCatagory = async (req, res) => {
    try {
        const { name } = req.fields;
        const { image } = req.files;

        let imageUrl = '';
        if(image){
            const result = await cloudinary.uploader.upload(image.path);
            imageUrl = result.secure_url;
        }

        if (!name) {
            return res.status(500).send({
                success: false,
                message: "name is required",
                error
            });
        }
        const ExistingCatagory = await CatagoryModel.findOne({ name });
        if (ExistingCatagory) {
            return res.status(500).send({
                success: false,
                message: "Catagory already exists",
                error
            });
        }

        const catagory = await new CatagoryModel({ name, slug: slugify(name), image:imageUrl }).save();
        res.status(200).send({
            success: true,
            message: "New Catagory Created",
            catagory
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in catagory",
            error
        });
    }
}

const UpdateCatagory = async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).send({
          success: false,
          message: "Name is required",
        });
      }
  
      const { id } = req.params;
  
      const catagory = await CatagoryModel.findByIdAndUpdate(id, { name, slug: slugify(name) }, { new: true });
  
      if (!catagory) {
        return res.status(404).send({
          success: false,
          message: "Category not found",
        });
      }
  
      res.status(200).send({
        success: true,
        message: "Category updated successfully",
        catagory,
      });
  
    } catch (error) {
      console.error(error); 
      res.status(500).send({
        success: false,
        message: "Error while updating category",
        error: error.message, 
      });
    }
  }

const GetCategories = async(req,res) => {
    try{
        const catagories = await CatagoryModel.find({});
        res.status(200).send({
            success: true,
            message: "All Catagories Fetched",
            catagories
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching catagories",
            error
        });
    }
}

const GetCategory = async(req,res) => {
    try{
        const {slug} = req.params;
        const catagory = await CatagoryModel.findOne({slug});
        res.status(200).send({
            success: true,
            message: "Catagory Fetched",
            catagory
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching catagory",
            error
        });
    }
}

const DeleteCatagory = async(req,res) => {
    try{
        const {id} = req.params;
        await CatagoryModel.findByIdAndDelete(id);
        res.status(200).send({
            success: true,
            message: "Catagory Deleted",
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting catagory",
            error
        });
    }
}

module.exports = { CreateCatagory, UpdateCatagory,GetCategories,GetCategory,DeleteCatagory};