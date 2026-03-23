import jwt from "jsonwebtoken";
import User from "../models/User.js";


// Middleware to authenticate user using JWT token: 

export const protect = async (req, res, next) => {

    try {
        const token = req.headers.token;  // Reads Token from request header that coming from FrontEnd

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify the token using JWT_SECRET and decode the userId from the token

        const user = await User.findById(decoded.userId).select("-password"); // Find the userId in the database with the help of findById method if it is match then return the user data without password field and assign it to req.user

        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        req.user = user; 
        next(); // Move to the next function
    }
    catch (error){
        console.log(error.message);
        return res.json({success: false, message: error.message});
    }
}