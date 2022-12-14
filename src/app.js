const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

/**
 * FIX ME!
 * @returns contract by id
 */
app.get("/contracts/:id", getProfile, async (req, res) => {
  if (req.profile.dataValues.id) {
    const { Contract } = req.app.get("models");
    const id = req.profile.dataValues.id;
    const contract = await Contract.findOne({ where: { ContractorId: id } });
    if (!contract) return res.status(404).end();
    return res.json(contract.dataValues);
  } else {
    return res.status(404).end();
  }
});
module.exports = app;
