const { hashpassword, compare } = require('../helper/authHelper');
const expressasynchandler = require("express-async-handler");
const User = require('../models/UserModel');
const JWT = require('jsonwebtoken');
const OrderModel = require('../models/OrderModel');

const registerController = expressasynchandler(async (req, res) => {
    try {
        const { name, email, password, phone, address, question } = req.body;

        // Check fields
        if (!name) {
            return res.status(400).send({ error: "Name is required" });
        }
        if (!email) {
            return res.status(400).send({ error: "Email is required" });
        }
        if (!password) {
            return res.status(400).send({ error: "Password is required" });
        }
        if (!phone) {
            return res.status(400).send({ error: "Phone is required" });
        }
        if (!address) {
            return res.status(400).send({ error: "Address is required" });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({
                success: false,
                message: "Already registered, Please Login",
            });
        }

        // Register User
        const hashedPassword = await hashpassword(password);
        const newUser = await new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            question
        }).save();

        const token = await JWT.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).cookie('token', token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Cookie expires in 7 days
            httpOnly: true,
        }).send({
            success: true,
            message: "Registration Successful",
            user: {
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                role: newUser.role
            },
            token
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in registration",
            error
        });
    }
});


const loginController = expressasynchandler(async(req,res) => {
    try{
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(404).send({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        //check email and password
        const ExistUser = await User.findOne({email});
        if(!ExistUser){
            return res.status(200).send({
                success: false,
                message: "Email is not registered",
            })
        }
        const match = await compare(password,ExistUser.password);
        if(!match){
            return res.status(200).send({
                success: false,
                message: "Invalid Password",
            })
        }

        //token generate
        const token = await JWT.sign({_id:ExistUser._id},process.env.JWT_SECRET,{expiresIn: "7d"});
        res.status(200).cookie('token', token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        }).send({
            success: true,
            message: "Login Successful",
            user:{
                name: ExistUser.name,
                email: ExistUser.email,
                phone: ExistUser.phone,
                address: ExistUser.address,
                role: ExistUser.role
            },
            token
        })

    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "error in login",
            error
        });
    }
});

const forgotPasswordController = async(req,res) => {
    try{
        const {email,question,newPassword} = req.body;
        if(!email){
            res.status(500).send({
                success: false,
                message: "Email wrong",
                error
            });
        }
        if(!question){
            res.status(500).send({
                success: false,
                message: "question wrong",
                error
            });
        }
        if(!newPassword){
            res.status(500).send({
                success: false,
                message: "newPassword wrong",
                error
            });
        }

        const user1 = await User.findOne({email,question})

        if(!user1){
            res.status(500).send({
                success: false,
                message: "wrong email or question",
                error
            });
        }
        const hashed = await hashpassword(newPassword);
        await User.findByIdAndUpdate(user1._id,{password: hashed});
        res.status(200).send({
            success: true,
            message: "Password reset successfully",
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "something went wrong",
            error
        });
    }
}

const UpdateProfile = async (req, res) => {
    try {
        const { name, email, password, phone, address, question } = req.body;
        const user = await User.findById(req.user._id);

        // Check if password is provided and its length is less than 6
        // if (password && password.length < 6) {
        //     return res.status(400).send({
        //         success: false,
        //         message: "Password must be at least 6 characters long",
        //     });
        // }

        // Hash the password if provided
        const HashedPassword = password ? await hashpassword(password) : undefined;

        // Update user details
        const UpdatedUser = await User.findByIdAndUpdate(req.user._id, {
            name: name || user.name,
            email: email || user.email, // Ensure email is updated if provided
            password: HashedPassword || user.password,
            phone: phone || user.phone,
            address: address || user.address,
            question: question || user.question,
        }, { new: true });
        console.log('yes')
        res.status(200).send({
            success: true,
            message: "Profile updated successfully",
            UpdatedUser
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Something went wrong while updating profile",
            error: error.message // Provide a more descriptive error message
        });
    }
};


const GetOrders = async(req,res) => {
    try{
        const orders = await OrderModel.find({buyer: req.user._id}).populate('products').populate("buyer","name").sort({createdAt: -1});
        res.json(orders);
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching orders",
            error
        });
    }
}

const GetOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch order with populated fields
        const order = await OrderModel.findById(orderId)
            .populate({
                path: 'products',
                select: 'name photo price quantity',  // Adjust fields as needed
            })
            .populate({
                path: 'buyer',
                select: 'name address',  // Adjust fields as needed
            })
            .exec();  // Use exec() for better error handling

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Error while fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error while fetching order',
            error: error.message,  // Send error message for clarity
        });
    }
};




const GetAllOrders = async(req,res) => {
    try{
        const orders = await OrderModel.find({}).populate('products').populate("buyer","name").sort({createdAt: -1});
        res.json(orders);
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching all orders",
            error
        });
    }
}

const UpdateOrderStatus = async(req,res) => {
    try{
        const { orderId } = req.params;
        const { status } = req.body;

        const orders = await OrderModel.findByIdAndUpdate(orderId,{status:status},{new: true});
        res.json(orders);
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error changing status",
            error
        });
    }
}

module.exports = {registerController,loginController,forgotPasswordController,UpdateProfile,GetOrders,GetOrder,GetAllOrders,UpdateOrderStatus};