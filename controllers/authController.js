const User = require("../models/User");
const bcrypt = require("bcrypt");
const SignTokens = require("../helpers/SignTokens");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

// @desc
// @route
// access

// @desc Login
// @route POST /auth
// access Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const isMatch = bcrypt.compare(password, foundUser.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const accessToken = SignTokens.SignAccessToken(
    foundUser.username,
    foundUser.roles
  );

  const refreshToken = SignTokens.SignRefreshToken(foundUser.username);

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry, matches RefreshToken
  });

  res.json({ accessToken });
});

// @desc Refresh
// @route GET /auth/refresh
// access Public - AccessToken expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const foundUser = await User.findOne({ username: decoded.username });

      if (!foundUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const accessToken = SignTokens.SignAccessToken(
        foundUser.username,
        foundUser.roles
      );

      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// access Public - clearing cookie
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Successful logout!" });
};

module.exports = {
  login,
  refresh,
  logout,
};
