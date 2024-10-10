const express = require("express");
const { requireSignin, isAdmin } = require("../middleware/AuthMiddleware");
const { CreateCatagory, UpdateCatagory, GetCategory, DeleteCatagory, GetCategories } = require("../controller/catagoryController");
const formidable = require('express-formidable');

const Router = express.Router();

Router.post("/create-catagory",requireSignin,isAdmin,formidable(),CreateCatagory);

Router.put("/update-catagory/:id",requireSignin,isAdmin,UpdateCatagory);

Router.get("/get-category/:slug",GetCategory);

Router.get("/get-categories",GetCategories);

Router.delete("/delete-catagory/:id",requireSignin,isAdmin,DeleteCatagory);

module.exports= Router;