const { Op } = require("sequelize");
const { sequelize } = require("../model");
const { updateProfile } = require("./profiles");

const getUnpaidJobs = async (req, res, next) => {
  const { Job } = sequelize.models;
  const { Contract } = sequelize.models;

  const jobs = await Job.findAll({
    include: [
      {
        model: Contract,
        required: true,
        where: {
          status: {
            [Op.not]: "terminated",
          },
        },
      },
    ],
    where: {
      paid: { [Op.not]: true },
    },
  });
  if (!jobs) return res.status(401).end();
  req.jobs = jobs;
  return next();
};

const getJob = async (req, res, next) => {
  const { Job } = sequelize.models;
  const { Contract } = sequelize.models;

  const job = await Job.findOne({
    include: [
      {
        model: Contract,
        required: true,
        where: {
          status: {
            [Op.not]: "terminated",
          },
        },
      },
    ],
    where: {
      id: req.params.job_id,
    },
  });
  if (!job) return res.status(401).end();
  req.job = job;
  return next();
};

const pay = async (params) => {
  const { contractor, customer, app, contract, job } = params;
  if (customer.balance >= job.price) {
    let customerBalance = customer.balance - job.price;
    let contractorBalance = contractor.balance + job.price;
    const t = await sequelize.transaction();
    try {
      await updateProfile({
        balance: customerBalance,
        id: customer.id,
        t: t,
      });
      await updateProfile({
        balance: contractorBalance,
        id: contractor.id,
        t: t,
      });
      let payedJob = await payJob({ id: job.id, t });
      await t.commit();
      return { errors: [], data: payedJob };
    } catch (e) {
      await t.rollback();
      return {
        errors: [e],
        data: [],
      };
    }
  } else {
    return {
      errors: [
        {
          description: "The customer doesn't have enough money",
        },
      ],
    };
  }
};

const payJob = async (params) => {
  const { Job } = sequelize.models;
  const job = await Job.update(
    {
      paid: true,
    },
    { where: { id: params.id }, transaction: params.t }
  );

  return job;
};

module.exports = { getUnpaidJobs, getJob, pay };
