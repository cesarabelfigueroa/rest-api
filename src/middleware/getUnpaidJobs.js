const { Op } = require("sequelize");

const getUnpaidJobs = async (req, res, next) => {
  const { Job } = req.app.get("models");
  const { Contract } = req.app.get("models");

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
module.exports = { getUnpaidJobs };
