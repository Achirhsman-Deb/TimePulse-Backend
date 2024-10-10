const express = require("express");
const { registerController, loginController, forgotPasswordController, UpdateProfile, GetOrders, GetAllOrders, UpdateOrderStatus, GetOrder } = require("../controller/authController");
const { requireSignin, isAdmin } = require("../middleware/AuthMiddleware");
const Router = express.Router();

Router.post('/register',registerController);

Router.post('/login',loginController);

Router.post('/forgotPassword',forgotPasswordController);

Router.get('/user-auth', requireSignin, (req,res)=>{ res.status(200).send({ok: true}) } );

Router.post('/update-auth', requireSignin, UpdateProfile);

Router.get('/admin-auth', requireSignin,isAdmin, (req,res)=>{ res.status(200).send({ok: true}) } );

Router.get('/orders', requireSignin, GetOrders);

Router.get('/order/:orderId', requireSignin, GetOrder);

Router.get('/all-orders', requireSignin , isAdmin, GetAllOrders);

Router.put('/change-status/:orderId', requireSignin , isAdmin, UpdateOrderStatus);

module.exports= Router;