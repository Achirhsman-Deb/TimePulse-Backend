const JWT = require('jsonwebtoken');
const User = require('../models/UserModel');

const requireSignin = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const decode = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

const requireSigninForReview = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const decode = JWT.verify(token, process.env.JWT_SECRET);
    console.log(decode);

    const user = await User.findById(decode._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}

module.exports = { requireSignin, isAdmin,requireSigninForReview };
