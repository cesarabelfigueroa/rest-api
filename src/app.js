const express = require("express");
const { Op } = require("sequelize");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

/**
 *
 * @returns contract by profile id
 */
app.get("/contracts/:id", getProfile, async (req, res) => {
  if (req.profile.dataValues.id) {
    const { Contract } = req.app.get("models");
    const id = req.profile.dataValues.id;
    const contract = await Contract.findOne({
      where: { [Op.or]: [{ ContractorId: id }, { ClientId: id }] },
    });
    if (!contract) return res.status(404).end();
    return res.json(contract.dataValues);
  } else {
    return res.status(404).end();
  }
});

/**
 *
 * @returns contract without profile id
 */
app.get("/contracts/", getProfile, async (req, res) => {
  console.log(sequelize.op);
});

module.exports = app;
