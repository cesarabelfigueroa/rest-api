const { sequelize } = require("../model");

const getProfile = async (req, res, next) => {
  const id = req.params.id;
  const profile = await getProfileHandler(id);
  if (!profile) return res.status(401).end();
  req.profile = profile;
  if (next) {
    return next();
  } else {
    return profile;
  }
};

const getProfileHandler = async (id) => {
  const { Profile } = sequelize.models;
  const profile = await Profile.findOne({ where: { id: id || 0 } });
  return profile;
};

const updateProfile = async (params) => {
  const { Profile } = sequelize.models;
  const profile = await Profile.update(
    {
      balance: params.balance,
    },
    { where: { id: params.id }, transaction: params.t }
  );
  return profile;
};

module.exports = { getProfile, getProfileHandler, updateProfile };
