const { Op } = require("sequelize");

const getProfiles = async (req, res, next) => {
  const { Contract } = req.app.get("models");
  const { Profile } = req.app.get("models");

  const contracts = await Contract.findAll({
    include: [
      {
        model: Profile,
        required: true,
        as: "Contractor",
      },
      {
        model: Profile,
        required: true,
        as: "Client",
      },
    ],
    where: {
      status: {
        [Op.not]: "terminated",
      },
    },
  });

  if (!contracts) return res.status(401).end();
  req.contracts = contracts;
  return next();
};
module.exports = { getProfiles };
