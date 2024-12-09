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

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});