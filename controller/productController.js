const ProductModel = require("../models/ProductModel");
const CatagoryModel = require("../models/CatagoryModel");
const OrderModel = require("../models/OrderModel");
const ReviewModel = require("../models/ReviewModel");
const cloudinary = require("../Utils/Cloudinary");
const fs = require('fs');
const slugify = require("slugify");
var braintree = require("braintree");
const User = require("../models/UserModel");
const formidable = require('formidable');

var gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

const CreateProduct = (req, res) => {
    const form = new formidable.IncomingForm();
    form.multiples = true;
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error parsing the files', error: err });
        }

        const { name, slug, description, price, quantity, shipping, catagory } = fields;
        const { photo, extraPhotos } = files;

        try {
            // Upload main photo to Cloudinary
            let photoUrl = '';
            if (photo) {
                const photoResult = await cloudinary.uploader.upload(photo.path, {
                    folder: 'Product_images'
                });
                photoUrl = photoResult.secure_url;
            }

            // Upload extra photos to Cloudinary
            let extraPhotoUrls = [];
            if (extraPhotos) {
                // Check if multiple files were uploaded or just one
                const fileArray = Array.isArray(extraPhotos) ? extraPhotos : [extraPhotos];
                const uploadPromises = fileArray.map(file => 
                    cloudinary.uploader.upload(file.path, {
                        folder: 'Product_images'
                    })
                );

                // Wait for all uploads to finish
                const uploadResults = await Promise.all(uploadPromises);
                extraPhotoUrls = uploadResults.map(result => result.secure_url);
            }

            // Create product with the provided fields and the uploaded images
            const product = new ProductModel({
                ...fields,
                photo: photoUrl,
                extraPhotos: extraPhotoUrls, // Add extra photo URLs to the model
                slug: slugify(name)
            });
            
            await product.save();

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                product
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Error creating product",
                error
            });
        }
    });
};


const EditProduct = async (req, res) => {
    const form = new formidable.IncomingForm();
    form.multiples = true;
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error parsing the files', error: err.message });
        }

        const { name, description, price, quantity, shipping, category, deleteImages } = fields;
        const { photo, extraPhotos } = files;

        try {
            // Find the product by ID
            const product = await ProductModel.findById(req.params.pid);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }

            let updatedProductData = { ...fields, slug: slugify(name) };

            // Update main photo if a new one is uploaded
            if (photo) {
                // Delete old photo from Cloudinary
                if (product.photo) {
                    const publicId = product.photo.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`Product_images/${publicId}`);
                }

                // Upload new photo to Cloudinary
                const photoResult = await cloudinary.uploader.upload(photo[0].path, {
                    folder: 'Product_images'
                });
                updatedProductData.photo = photoResult.secure_url;
            }

            // Handle extra photos (upload new ones)
            let newExtraPhotos = [];
            if (extraPhotos) {
                const fileArray = Array.isArray(extraPhotos) ? extraPhotos : [extraPhotos];
                const uploadPromises = fileArray.map(file => 
                    cloudinary.uploader.upload(file.path, {
                        folder: 'Product_images/extra_images'
                    })
                );

                // Wait for all uploads to finish
                const uploadResults = await Promise.all(uploadPromises);
                newExtraPhotos = uploadResults.map(result => result.secure_url);
            }

            // Handle deletion of old extra photos
            let updatedExtraPhotos = [...product.extraPhotos];
            if (deleteImages) {
                let deleteImageIds = [];
                try {
                    deleteImageIds = JSON.parse(deleteImages);
                    if (!Array.isArray(deleteImageIds)) {
                        throw new Error('deleteImages is not an array');
                    }
                } catch (error) {
                    return res.status(400).json({ success: false, message: 'Invalid deleteImages format' });
                }

                // Delete selected images from Cloudinary
                await Promise.all(deleteImageIds.map(async (imageUrl) => {
                    const publicId = imageUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`Product_images/extra_images/${publicId}`);
                }));

                // Remove deleted images from the extraPhotos array
                updatedExtraPhotos = product.extraPhotos.filter(image => !deleteImageIds.includes(image));
            }

            // Merge new extra photos with existing ones
            updatedProductData.extraPhotos = [...updatedExtraPhotos, ...newExtraPhotos];

            // Update the product in the database
            const updatedProduct = await ProductModel.findByIdAndUpdate(req.params.pid, updatedProductData, { new: true });

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product: updatedProduct
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Error updating product",
                error: error.message
            });
        }
    });
};


const GetProducts = async (req, res) => {
    try {
        const Products = await ProductModel.find({}).populate('catagory').limit(12).sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            message: "12 Products",
            Products,
            total_count: Products.length
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching Products",
            error
        });
    }
}

const GetProduct = async (req, res) => {
    try {
        const { slug } = req.params;
        const Product = await ProductModel.findOne({ slug }).populate('catagory');
        res.status(200).send({
            success: true,
            message: "Fetched Product",
            Product,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching Product",
            error
        });
    }
}

const GetProductforsingle = async (req, res) => {
    try {
        const { slug } = req.params;
        const Product = await ProductModel.findOne({ slug: slug });
        res.status(200).send({
            success: true,
            message: "fetched Product",
            Product,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching Product",
            error
        });
    }
}

const DeleteProduct = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.pid).populate('reviews');
        if (!product) {
            return res.status(404).send({
                success: false,
                message: "Product not found",
            });
        }

        // Delete associated reviews
        if (product.reviews.length > 0) {
            await ReviewModel.deleteMany({ _id: { $in: product.reviews } });
        }

        // Delete the photo from Cloudinary if it exists
        if (product.photo) {
            const publicId = product.photo.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`Product_images/${publicId}`);
        }

        await ProductModel.findByIdAndDelete(req.params.pid);

        res.status(200).send({
            success: true,
            message: "Product and associated reviews deleted successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error deleting product",
            error: error.message
        });
    }
};


const FilterProducts = async (req, res) => {
    try {
        const { checked, radio } = req.body;
        let args = {};
        if (checked.length > 0) {
            args.catagory = checked
        };
        if (radio.length) {
            args.price = { $gte: radio[0], $lte: radio[1] }
        };
        const Products = await ProductModel.find(args);
        res.status(200).send({
            success: true,
            message: "Product found",
            Products
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error Filtering Product",
            error
        });
    }
}

const ProductsCount = async (req, res) => {
    try {
        const Total = await ProductModel.find({}).estimatedDocumentCount();
        res.status(200).send({
            success: true,
            message: "Product Counted",
            Total
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error Counting Product",
            error
        });
    }
}

const ProductsList = async (req, res) => {
    try {
        const PerPage = 12;
        const page = req.params.page ? req.params.page : 1;
        const Products = await ProductModel.find({}).skip((page - 1) * PerPage).limit(PerPage).sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            message: "Product sorted",
            Products
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in Product list",
            error
        });
    }
}

const ProductSearch = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).send({
                success: false,
                message: "Keyword is required",
            });
        }
        const results = await ProductModel.find({
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } }
            ]
        })
        res.status(200).send({
            success: true,
            message: "Product found",
            results
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in Product searching",
            error
        });
    }
};


const ProductSimilar = async (req, res) => {
    try {
        const { pid, cid } = req.params;
        const Products = await ProductModel.find({
            catagory: cid,
            _id: { $ne: pid }
        }).limit(3).populate('catagory');
        res.status(200).send({
            success: true,
            message: "Similar Product found",
            Products
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while finding similar products",
            error
        });
    }
}

const ProductCatagory = async (req, res) => {
    try {
        const catagory = await CatagoryModel.findOne({slug: req.params.slug})
        const Products = await ProductModel.find({catagory}).populate('catagory')
        res.status(200).send({
            success: true,
            message: "Similar catagory Products found",
            catagory,
            Products
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching products of a definite catagory",
            error
        });
    }
}

const BraintreeToken = async(req,res) => {
    try{
        gateway.clientToken.generate({}, function(err,response){
            if(err){
                res.status(500).send({
                    success: false,
                    err
                });
            }else{
                res.send(response);
            }
        });
    }catch(error){
        console.log(error);
    }
}

const BraintreePayment = async (req, res) => {
    try {
        const { cart, nonce } = req.body;
        let total = 0;
        
        // Calculate total price
        cart.map(i => { total += i.price });

        // Process payment through Braintree
        gateway.transaction.sale({
            amount: total,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true
            }
        }, async (error, result) => {
            if (result.success) {
                // Save the transaction and create the order
                const userId = req.user._id;
                const user = await User.findById(userId);

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                // Create the new order
                const newOrder = await new OrderModel({
                    products: cart.map(item => item._id),  // Save only product IDs
                    payment: result.transaction,  // Save transaction details
                    buyer: userId,
                    address: user.address,
                    price: total  // Ensure `address` field exists in `User`
                }).save();
                
                // await Promise.all(cart.map(async (item) => {
                //     await ReviewModel.updateMany(
                //         { product: item._id, user: req.user._id },
                //     );
                // }));

                res.json({ ok: true });
            } else {
                res.status(500).send(error);
            }
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error processing payment",
            error
        });
    }
};

const CancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id).populate('products');

        if (!order) {
            return res.status(404).send({
                success: false,
                message: "Order not found",
            });
        }

        // Check if the order status is already one that cannot be cancelled
        if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(200).send({
                success: false,
                message: "Order cannot be cancelled",
            });
        }

        // Update order status
        if (order.status === 'Not Process') {
            order.status = 'Cancelled';
        } else if (order.status === 'Processing') {
            order.cancelReq = true;
        }
        await order.save();

    
        const productIds = order.products.map(product => product._id);
        if (productIds.length > 0) {
            await ReviewModel.updateMany(
                { product: { $in: productIds } },
            );
        }

        res.status(200).send({
            success: true,
            message: "Order has been cancelled successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error cancelling order",
            error,
        });
    }
};

const getTotalSalesForCurrentMonth = async (req, res) => {
    try {
        // Get the current date
        const currentDate = new Date();
        // Get the first day of the current month
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Query the orders that were created after the first day of the current month
        const orders = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: firstDayOfMonth, // Orders from the first day of the month onwards
                    },
                    status: { 
                        $in: ['Not Process', 'Processing', 'Shipped', 'Delivered'] // Only include orders that were completed (optional)
                    }
                }
            },
            {
                $group: {
                    _id: null, // Group all orders together
                    totalSales: { $sum: "$price" } // Sum the price field
                }
            }
        ]);

        // If no sales are found, return 0
        const totalSales = orders.length > 0 ? orders[0].totalSales : 0;

        return res.status(200).json({
            success: true,
            totalSales
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate total sales',
            error: error.message
        });
    }
};

const getPendingOrdersCount = async (req, res) => {
    try {
      // Find orders where the status is 'Not Process'
      const pendingOrdersCount = await OrderModel.countDocuments({ status: 'Not Process' });
  
      // Return the count in the response
      return res.status(200).json({
        success: true,
        pendingOrdersCount,
      });
    } catch (error) {
      // Handle errors
      return res.status(500).json({
        success: false,
        message: 'Error fetching pending orders count',
        error: error.message,
      });
    }
};

const getMonthlySalesData = async (req, res) => {
    try {
      // Get the current date
      const currentDate = new Date();
      
      // Start of the current month (e.g., 1st of the current month at 00:00:00)
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // End date is the last day of the current month at 23:59:59
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
  
      // Aggregate orders by day
      const salesData = await OrderModel.aggregate([
        {
          $match: {
            status: { $in: ['Not Process', 'Processing', 'Shipped', 'Delivered'] },  // Only count completed sales
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }  // From start of month to the end of the month
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },  // Group by day of the month
            totalSales: { $sum: "$price" },  // Sum the total price for each day
            ordersCount: { $sum: 1 }  // Count the number of orders
          }
        },
        {
          $sort: { _id: 1 }  // Sort by day (ascending)
        }
      ]);
  
      // Prepare an array for each day of the month
      const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const fullMonthData = Array.from({ length: totalDays }, (_, i) => ({
        _id: i + 1,
        totalSales: 0,
        ordersCount: 0
      }));
  
      // Fill the fullMonthData with the actual sales data
      salesData.forEach(dayData => {
        fullMonthData[dayData._id - 1] = {
          _id: dayData._id,
          totalSales: dayData.totalSales,
          ordersCount: dayData.ordersCount
        };
      });
  
      res.json({
        success: true,
        data: fullMonthData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales data',
        error: error.message
      });
    }
};

const TopProduct = async (req, res) => {
    try {
      const mostSoldProduct = await OrderModel.aggregate([
        { $unwind: "$products" },
        
        // Group by product and count occurrences
        { 
          $group: { 
            _id: "$products", // Group by product ID
            count: { $sum: 1 } // Increment count for each occurrence
          } 
        },
        // Sort by count in descending order to get the most sold product
        { $sort: { count: -1 } },
        // Limit to only the top result (most sold product)
        { $limit: 1 }
      ]); 
      // If no product has been sold yet
      if (mostSoldProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No products sold yet.'
        });
      }
  
      // Populate the product details
      const product = await ProductModel.findById(mostSoldProduct[0]._id);
      return res.status(200).json({
        success: true,
        product,
        count: mostSoldProduct[0].count
      });
      
    } catch (error) {
      console.error("Error fetching most sold product:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching most sold product'
      });
    }
};
  

module.exports = { CreateProduct, GetProducts, GetProduct, DeleteProduct, EditProduct, FilterProducts, ProductsCount, ProductsList, ProductSearch, ProductSimilar, ProductCatagory,BraintreeToken,BraintreePayment,GetProductforsingle,CancelOrder,getTotalSalesForCurrentMonth,getPendingOrdersCount,getMonthlySalesData,TopProduct };