const express = require("express");
const { Op } = require("sequelize");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile, getProfileHandler } = require("./middleware/profiles");
const { getContracts } = require("./middleware/contracts");
const { getUnpaidJobs, getJob, pay } = require("./middleware/jobs");

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

/**
 *
 * @returns Pay for a job, a client can only pay if his balance >= the amount to pay. The amount should be moved from the client's balance to the contractor balance.
 */
app.post("/jobs/:job_id/pay", getJob, async (req, res) => {
  const job = req.job;
  const contract = job.Contract;
  const contractor = await getProfileHandler(contract.ContractorId);
  const customer = await getProfileHandler(contract.ClientId);
  const params = {
    contractor,
    customer,
    app,
    contract,
    job,
  };
  const payment = await pay(params);
  let result = {
    errors: payment.errors,
    sucess: payment.errors.length === 0,
  };
  return res.json(result);
});

module.exports = app;
