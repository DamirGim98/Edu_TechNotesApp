const jwt = require("jsonwebtoken");

const SignTokens = (username, roles) => {
  return jwt.sign(
    {
      UserInfo: {
        username,
        roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30s" }
  );
};

const SignRefreshToken = (username) => {
  return jwt.sign(
    {
      username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

module.exports = {
  SignAccessToken: SignTokens,
  SignRefreshToken,
};
