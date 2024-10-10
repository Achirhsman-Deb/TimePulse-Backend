const express = require("express");
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const authRouter = require("./routes/authRoutes");
const catagoryRouter = require("./routes/catagoryRoutes");
const productRouter = require("./routes/productRoutes");
const reviewRouter = require("./routes/reviewRoute");
const imageRouter = require("./routes/imageRoutes");
const cors = require("cors");
const path = require("path");


const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cookieParser());
//app.use(express.static(path.join(__dirname,'./dist')));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


const mongoDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("Connected to DB");
    } catch (error) {
      console.error("Connection error", error);
    }
};
mongoDB();

app.use('/user',authRouter)
app.use('/catagory',catagoryRouter);
app.use('/product',productRouter);
app.use('/review',reviewRouter);
app.use('/image',imageRouter);

//app.get('/',(req,res)=>{
//    res.send({
//         message: "welcome",
//    })
//});

//app.get('*', (req,res) =>{
  //res.sendFile(path.resolve(__dirname,`./dist/index.html`));
//});

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
});
