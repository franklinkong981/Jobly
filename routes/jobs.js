"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const {BadRequestError, ExpressError} = require("../errors/expressError");
const {ensureLoggedIn, ensureIsAdmin} = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: logged in AND is an admin
 */

router.post("/", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const new_job = await Job.create(req.body);
    return res.status(201).json({ new_job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none
 */

  router.get("/", async function (req, res, next) {
    let all_jobs;
    try {
      all_jobs = await Job.findAll();
      return res.json({ all_jobs });
    } catch (err) {
      return next(err);
    }
  });

  /* router.get("/", async function (req, res, next) {
    let all_jobs;
    try {
      //if no query string, return all companies.
      if (Object.keys(req.query).length === 0) {
        companies = await Company.findAll();
      } else {
        validateCompanySearchQuery(req.query);
          
        companies = await Company.findFiltered(req.query);
      }
  
      console.log(`Got total of ${companies.length} companies!`);
      return res.json({ companies });
    } catch (err) {
      return next(err);
    }
  }); */

/** GET /[id]  =>  { job }
 *
 *  Company is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Partially updates a job's data.
 *
 * fields can be any combination of the following: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: logged in AND is an admin
 */

router.patch("/:id", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const updated_job = await Job.update(req.params.id, req.body);
    return res.json({ updated_job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: logged in AND is an admin
 */

router.delete("/:id", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

