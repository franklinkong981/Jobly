"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../errors/expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
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

/* Validates the query string in a company filtered search. 
query = object containing properties and values of the query string passed in the request.*/
function validateCompanySearchQuery(query) {
  for (const key of Object.keys(query)) {
    if (key !== "name" && key != "minEmployees" && key != "maxEmployees") {
      throw new BadRequestError("The query string must only containg the following properties: name, minEmployees, and maxEmployees");
    }
  }
  if (Object.hasOwn(query, "minEmployees") && Object.hasOwn(query, "maxEmployees") && query.minEmployees > query.maxEmployees) {
    throw new BadRequestError("The minEmployees cannot be greater than maxEmployees");
  }
}

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters in the query string:
 * - minEmployees
 * - maxEmployees
 * - name (will find case-insensitive LIKE matches, partial matches)
 * 
 * The query string can ONLY contain the parameters name, minEmployees, and/or maxEmployees.
 * minEmployees CANNOT be greater than maxEmployees.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  let companies;
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
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
