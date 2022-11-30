const User = require("../models/User");
const Note = require("../models/Note");

const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();

  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  // Confirming incoming data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: "All field are required" });
  }
  // Check duplicate in Db
  const duplicate = await User.findOne({ username }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate of the username" });
  }

  // salt passes passwords in the Db
  const hashedPwd = await bcrypt.hash(password, 10);

  const userObject = { username, password: hashedPwd, roles };

  // Create and store new User

  const user = await User.create(userObject);

  if (user) {
    res.status(201).json({ message: `New user ${username} has been created` });
  } else {
    res.status(400).json({ message: "Invalid userdata provided" });
  }
});

// @desc Update user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, password, roles, active } = req.body;

  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "No user found" });
  }

  // Check for duplicate

  const duplicate = await User.findOne({ username }).lean().exec();

  // Allow updates to orig user

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash pwd
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated!` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const note = await Note.findOne({ userId: id }).lean().exec();

  if (note) {
    return res.status(400).json({ message: "User has assigned notes!" });
  }

  const user = User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found!" });
  }

  const result = await (await user).deleteOne();

  const reply = `User with ${result.username} with ID ${result._id} been deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  createNewUser,
};
