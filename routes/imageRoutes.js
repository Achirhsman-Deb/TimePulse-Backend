const express = require("express");
const { newImage, getImage, delImage } = require('../controller/imageController');
const { isAdmin, requireSignin } = require('../middleware/AuthMiddleware');
const formidable = require('express-formidable');

const Router = express.Router();

Router.post('/new-image',requireSignin,isAdmin,formidable(),newImage);

Router.get('/get-image',getImage);

Router.delete('/del-image/:id',requireSignin,isAdmin,delImage);

module.exports= Router;