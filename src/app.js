const express = require("express");
const { Op } = require("sequelize");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const { getProfiles } = require("./middleware/getProfiles");
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
    const id = req.profile.id;
    const contract = await Contract.findOne({
      where: { [Op.or]: [{ ContractorId: id }, { ClientId: id }] },
    });
    if (!contract) return res.status(404).end();
    return res.json(contract);
  } else {
    return res.status(404).end();
  }
});

/**
 *
 * @returns contract without profile id
 */
app.get("/contracts", getProfiles, async (req, res) => {
  return res.json(req.contracts);
});

module.exports = app;
