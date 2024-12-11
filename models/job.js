"use strict";

const db = require("../db");
const {BadRequestError, NotFoundError} = require("../errors/expressError");
const {sqlForPartialUpdate} = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const doesCompanyExistCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [companyHandle]);

    if (doesCompanyExistCheck.rows.length === 0)
      throw new BadRequestError(`Company with handle of ${companyHandle} does not exist`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, companyHandle]
    );
    const new_job = result.rows[0];

    return new_job;
  }

  /** Find all filtered jobs whose names or part of their names match the query.title parameter (if provided) and has a salary of at least
   * query.minSalary (if provided). In addition, it only returns jobs with a non-zero equity if the query.hasEquity parameter (if provided)
   * is set to true.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findFiltered(query) {
    //builds the string to be used after the WHERE clause
    let numParts = 0;
    let filteringString = "";
    if (Object.hasOwn(query, "title")) {
      filteringString += `title ILIKE '%${query.title}%'`;
      numParts++;
    }
    if (Object.hasOwn(query, "minSalary")) {
      if (numParts > 0) filteringString += " AND ";
      filteringString += `salary >= ${query.minSalary}`;
      numParts++;
    }
    if (Object.hasOwn(query, "hasEquity") && query.hasEquity) {
      if (numParts > 0) filteringString += " AND ";
      filteringString += `equity > 0`;
    }

    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE
        ${filteringString}
        ORDER BY title`
    );
    return jobsRes.rows;
  }

  /** Find and return all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const allJobsRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return allJobsRes.rows;
  }

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id= $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`Job with id of ${id} not found`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job with id of ${id} not found.`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE FROM jobs
           WHERE id = $1
           RETURNING id, title`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job with id of ${id} not found.`);

    return job;
  }
}

module.exports = Job;