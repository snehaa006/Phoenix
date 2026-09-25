import jwt from "jsonwebtoken";

//function to generate token for a user
export const generateToken = (userId)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
}

//strip the password hash before a user document is sent to the client
export const toPublicUser = (user)=>{
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
}
