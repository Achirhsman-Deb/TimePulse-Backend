const express = require("express");
const { requireSignin, isAdmin } = require("../middleware/AuthMiddleware");
const { CreateProduct, GetProducts, GetProduct, DeleteProduct, EditProduct, FilterProducts, ProductsCount, ProductsList, ProductSearch, ProductSimilar, ProductCatagory, BraintreeToken, BraintreePayment, GetProductforsingle, CancelOrder, getTotalSalesForCurrentMonth, getPendingOrdersCount, getMonthlySalesData, TopProduct } = require("../controller/productController");

const Router = express.Router();

Router.post("/create-product",requireSignin,isAdmin,CreateProduct);

Router.put("/edit-product/:pid",requireSignin,isAdmin,EditProduct);

Router.get('/get-products', GetProducts);

Router.get('/get-product/:slug', GetProduct);

Router.get('/get-productsingle/:slug', GetProductforsingle);

Router.delete('/delete-product/:pid', DeleteProduct);

Router.post('/filter-products', FilterProducts);

Router.get('/product-count', ProductsCount);

Router.get('/product-list/:page', ProductsList);

Router.get('/product-search', ProductSearch);

Router.get('/product-similar/:pid/:cid', ProductSimilar);

Router.get('/product-catagory/:slug', ProductCatagory);

Router.get('/braintree/token', BraintreeToken);

Router.post('/braintree/payment',requireSignin, BraintreePayment);

Router.post('/cancelOrder/:id', CancelOrder);

Router.get('/sales-price-month', requireSignin, isAdmin, getTotalSalesForCurrentMonth);

Router.get('/pending-orders', requireSignin, isAdmin, getPendingOrdersCount);

Router.get('/sales-data', requireSignin, isAdmin, getMonthlySalesData);

Router.get('/top-selling', requireSignin, isAdmin, TopProduct);

module.exports= Router;