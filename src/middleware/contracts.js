const { Op } = require("sequelize");
const { sequelize } = require("../model");

const getContracts = async (req, res, next) => {
  const { Contract } = sequelize.models;
  const { Profile } = sequelize.models;

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

const getContract = async (params) => {
  const { Contract } = sequelize.models;

  const contract = await Contract.findOne({
    where: { [Op.or]: [{ ContractorId: params.id }, { ClientId: params.id }] },
  });

  return contract;
};
module.exports = { getContract, getContracts };
