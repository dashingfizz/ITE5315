/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: { 
      type: String,
      trim: true,
      default: "",
    },
    lastName: { 
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Helper method to set password (hashing)
UserSchema.methods.setPassword = async function (password) {
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(password, saltRounds);
};

// Helper method to validate password on login
UserSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", UserSchema);
