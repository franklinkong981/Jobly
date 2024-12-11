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

    const newJob = await Job.create(req.body);
    return res.status(201).json({ newJob });
  } catch (err) {
    return next(err);
  }
});

/* Validates the query string in a job filtered search. 
query = object containing properties and values of the query string passed in the request.

The query can only contain up to 3 parameters (and no other ones): title, minSalary, and hasEquity.
minSalary must be a number and hasEquity can only be either "true" or "false".*/
function validateJobSearchQuery(query) {
  for (const key of Object.keys(query)) {
    if (key !== "title" && key != "minSalary" && key != "hasEquity") {
      throw new BadRequestError("The query string must only contain the following properties: title, minSalary, hasEquity");
    }
  }

  //make sure minSalary parameter is a number.
  if (Object.hasOwn(query, "minSalary") && isNaN(parseInt(query.minSalary))) {
    throw new BadRequestError("minSalary parameter in the query string must be a number");
  }
  //make sure hasEquity is either true or false, thus can be converted to a boolean.
  if (Object.hasOwn(query, "hasEquity") && query.hasEquity !== "true" && query.hasEquity !== "false") {
    throw new BadRequestError("hasEquity parameter in the query string must be either true or false");
  }
}

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none
 */

  router.get("/", async function (req, res, next) {
    let allJobs;
    try {
      //if no query string, return all companies.
      if (Object.keys(req.query).length === 0) {
        allJobs = await Job.findAll();
      } else {
        validateJobSearchQuery(req.query);

        allJobs = await Job.findFiltered(req.query);
      }

      console.log(`Got total of ${allJobs.length} jobs!`);
      return res.json({ allJobs });
    } catch (err) {
      return next(err);
    }
  });

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

    const updatedJob = await Job.update(req.params.id, req.body);
    return res.json({ updatedJob });
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
    const deleted_job = await Job.remove(req.params.id);
    return res.json({ deleted: `Job with id ${deleted_job.id}, title ${deleted_job.title}` });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

