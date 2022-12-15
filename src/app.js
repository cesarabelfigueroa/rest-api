const express = require("express");
const { Op } = require("sequelize");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const { getContracts } = require("./middleware/getContracts");
const { getUnpaidJobs } = require("./middleware/getUnpaidJobs");

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
 * @returns contracts without profile id
 */
app.get("/contracts", getContracts, async (req, res) => {
  return res.json(req.contracts);
});

/**
 *
 * @returns Get all unpaid jobs for a user (either a client or contractor), for active contracts only.
 */
app.get("/jobs/unpaid", getUnpaidJobs, async (req, res) => {
  return res.json(req.jobs);
});

module.exports = app;
