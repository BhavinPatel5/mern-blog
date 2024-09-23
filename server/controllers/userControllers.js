const User = require("../models/userModel");
const HttpError = require("../models/errorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const { randomUUID } = require("crypto");
const {v4:uuid} =require('uuid')


// ======================== REGISTER A NEW USER
// POST : api/users/register
// UNPROTECTED

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return next(new HttpError("Please fill in all fields.", 422));
    }

    const newEmail = email.toLowerCase();
    const emailExists = await User.findOne({ email: newEmail });

    if (emailExists) {
      return next(new HttpError("Email Already Exists.", 422));
    }
    if (password.trim().length < 6) {
      return next(
        new HttpError("Password must be at least 6 characters.", 422)
      );
    }
    if (password !== confirmPassword) {
      return next(new HttpError("Passwords do not match.", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
    });

    res.status(201).json(`New user ${newUser.email} registered`);
  } catch (error) {
    return next(new HttpError("User Registration Failed.", 422));
  }
};

// ======================== LOGIN A REGISTERED USER
// POST : api/users/login
// UNPROTECTED

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Fill in all fields.", 422));
    }
    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return next(new HttpError("User Does Not Exist.", 422));
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(new HttpError("Password Incorrect.", 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({id,name},process.env.JWT_SECRET,{expiresIn:"1d"})

    res.status(200).json({
    
      token,id,name
    });


  } catch (error) {
    return next(
      new HttpError("Login Failed. Please Check Your Credentials.", 422)
    );
  }
};

// ======================== USER PROFILE
// POST : api/users/:id
// PROTECTED

const getUser = async (req, res, next) => {
  try {
    const {id} = req.params;
    const user = await User.findById(id).select('-password');
    if(!user){
      return next (new HttpError ("User Not Found. ", 404))
    }
    res.status(200).json(user)
  } catch (error) {
    return next(
      new HttpError(error))
  }
};

// ======================== CHANGE USER AVATAR (Profile Picture)
// POST : api/users/change-avatar
// PROTECTED

const changeAvatar = async (req, res, next) => {
  try {
    if(!req.files.avatar){
      return next(new HttpError ("Please choose an image.",422))
    }

    // find user from databse 

   const user = await User.findById(req.user.id)

   //delete old avatar if it exists

   if(user.avatar){
    fs.unlink(path.join(__dirname,'..','uploads',user.avatar),(err)=>{
      if(err){
        return next(
          new HttpError(error))
      }
    })
   }
   const {avatar} =req.files;

   // check the file size;
   if(avatar.size>500000){
    return next(
      new HttpError("Profile Picture too big.Should be less than 500kb"),422)
   }
   let fileName;
   fileName = avatar.name;
   let splittedFileName = fileName.split('.')
   let newFileName = splittedFileName[0] + uuid() + "."+ splittedFileName[splittedFileName.length - 1]
   avatar.mv(path.join(__dirname,'..','uploads',newFileName),async(err)=>{
    if(err){
      return next(
        new HttpError(err)
      )
    }
    const updateAvatar = await user.findByIdAndUpdate(req.user.id,{avatar:newFileName},{new:true})
    if(!updateAvatar){
      return next(
        new HttpError("Profile can't be changed."),422)

    }
    res.status(200).json(updateAvatar)
   })

  } catch (error) {
    return next(
      new HttpError(error))
  }
};

// ======================== EDIT USER DETAILS (From Profile)
// POST : api/users/edit-user
// PROTECTED

const editUser = async (req, res, next) => {
  res.json("Edit User details");
};

// ======================== GET AUTHORS
// POST : api/users/authors
// UNPROTECTED

const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select('-password');
  
    if(!authors){
      return next (new HttpError ("No Author Exists. ", 404))
    }
    res.json(authors)
  } catch (error) {
    return next(
      new HttpError(error))
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getAuthors,
};
