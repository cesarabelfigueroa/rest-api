const { Op } = require("sequelize");
const { sequelize } = require("../model");
const { updateProfile } = require("./profiles");
const _PERCENT_AVALIABLE_TO_BALANCE_ = 0.25;

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
  const { contractor, customer, job } = params;
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
      paymentDate: new Date(),
    },
    { where: { id: params.id }, transaction: params.t }
  );

  return job;
};

const postBalance = async (req, res, next) => {
  const money = req.body.money;
  let balance = await getTotalMoneyUnpaidJobs({ id: req.params.userId });
  if (
    money <
    balance.dataValues.total_balance * _PERCENT_AVALIABLE_TO_BALANCE_
  ) {
    let contrator = balance.Contract.Contractor;
    let userBalance = contrator.balance;
    try {
      const t = await sequelize.transaction();
      let profile = await updateProfile({
        id: req.params.userId,
        balance: userBalance + money,
        t: t,
      });

      await t.commit();
      req.balance = profile;
    } catch (error) {
      await t.rollback();

      req.balance = {
        errors: [e],
        data: [],
      };
    }
  } else {
    req.balance = {
      errors: [
        {
          description: "The client doesn't have funds to receive money.",
        },
      ],
    };
  }

  return next();
};

const getTotalMoneyUnpaidJobs = async (params) => {
  const { Job, Contract, Profile } = sequelize.models;
  let { id } = params;

  const job = await Job.findOne({
    attributes: [
      "Contract.ContractorId",
      [sequelize.fn("sum", sequelize.col("price")), "total_balance"],
    ],
    include: [
      {
        model: Contract,
        required: true,
        include: [
          {
            model: Profile,
            as: "Contractor",
            required: true,
          },
        ],
        where: {
          status: {
            [Op.not]: "terminated",
          },
          ClientId: id,
        },
      },
    ],
    group: ["Contract.ContractorId"],
    where: {
      paid: { [Op.not]: true },
    },
  });

  return job;
};

const getBestProfesion = async (req, res, next) => {
  let start = req.query.start;
  let end = req.query.end;
  let result = {};

  const { Job, Contract, Profile } = sequelize.models;

  const jobs = await Job.findAll({
    attributes: [
      "Contract.ContractorId",
      [sequelize.fn("sum", sequelize.col("price")), "benefits"],
    ],
    include: [
      {
        model: Contract,
        required: true,
        include: [
          {
            model: Profile,
            as: "Contractor",
            required: true,
          },
        ],
      },
    ],
    group: ["Contract.ContractorId", "description"],
    where: {
      paid: { [Op.eq]: true },
      createdAt: { [Op.gte]: new Date(start) },
      paymentDate: { [Op.lte]: new Date(end) },
    },
  });

  jobs.forEach((element) => {
    if (!result[element.Contract.ContractorId]) {
      result[element.Contract.ContractorId] = element;
    } else {
      if (result[element.Contract.ContractorId].benefits < element.benefits) {
        result[element.Contract.ContractorId] = element;
      }
    }
  });
  req.result =  Object.values(result);
  return next();
};
module.exports = {
  getUnpaidJobs,
  getJob,
  pay,
  getTotalMoneyUnpaidJobs,
  postBalance,
  getBestProfesion,
};
