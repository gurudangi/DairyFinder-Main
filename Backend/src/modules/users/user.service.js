const User = require("./user.model");

async function getById(id) {
  return User.findById(id).select("-passwordHash").lean();
}

module.exports = { getById };
