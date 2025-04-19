"use strict";

const db = require("../db.js");
const {BadRequestError, NotFoundError} = require("../errors/expressError");
const Job = require("./job.js");
const {commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New job",
    salary: 500,
    equity: 0.333,
    companyHandle: 'c1'
  };

  const invalidJob = {
    title: "Job not found",
    salary: 400,
    equity: 0.6,
    companyHandle: "abcd"
  }

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({id: 5, title:"New job", salary: 500, equity: "0.333", companyHandle: 'c1'});

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'New job'`);
    expect(result.rows).toEqual([
      {id: 5, title: "New job", salary: 500, equity: "0.333", companyHandle: 'c1'}
    ]);
  });

  test("bad request: Company not found", async function () {
    try {
      let job = await Job.create(invalidJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: 'j1',
        salary: 100,
        equity: "0.6",
        companyHandle: 'c1',
        companyName: 'C1'
      },
      {
        id: 2,
        title: 'j2',
        salary: 150,
        equity: "0.5",
        companyHandle: 'c2',
        companyName: 'C2'
      },
      {
        id: 3,
        title: 'j3',
        salary: 200,
        equity: "0",
        companyHandle: 'c3',
        companyName: 'C3'
      },
      {
        id: 4,
        title: 'j4',
        salary: 50,
        equity: '0',
        companyHandle: 'c1',
        companyName: 'C1'
      }
    ]);
  });
});

/************************************** findAll with filter */

describe("findFiltered", function() {
  test("works: title only", async function() {
    const query = {title: "j1"};
    let filteredJobs = await Job.findAll(query);
    expect(filteredJobs).toEqual([
      {
        id: 1,
        title: 'j1',
        salary: 100,
        equity: "0.6",
        companyHandle: 'c1',
        companyName: 'C1'
      }
    ]);
  });

  test("works: minSalary only", async function() {
    const query = {minSalary: 150};
    let filteredJobs = await Job.findAll(query);
    expect(filteredJobs).toEqual([
      {
        id: 2,
        title: 'j2',
        salary: 150,
        equity: "0.5",
        companyHandle: 'c2',
        companyName: 'C2'
      },
      {
        id: 3,
        title: 'j3',
        salary: 200,
        equity: "0",
        companyHandle: 'c3',
        companyName: 'C3'
      }
    ]);
  });

  test("works: hasEquity only", async function() {
    const query = {hasEquity: "true"};
    let filteredJobs = await Job.findAll(query);
    expect(filteredJobs).toEqual([
      {
        id: 1,
        title: 'j1',
        salary: 100,
        equity: "0.6",
        companyHandle: 'c1',
        companyName: 'C1'
      },
      {
        id: 2,
        title: 'j2',
        salary: 150,
        equity: "0.5",
        companyHandle: 'c2',
        companyName: 'C2'
      }
    ]);
  });

  test("No matches", async function() {
    const query = {title: "j1", minSalary: 200, hasEquity: "false"};
    let filteredJobs = await Job.findAll(query);
    expect(filteredJobs).toEqual([]);
  });

  test("case-insensitive and LIKE works", async function() {
    const query = {title: "J"};
    let filteredJobs = await Job.findAll(query);
    expect(filteredJobs).toEqual([
      {
        id: 1,
        title: 'j1',
        salary: 100,
        equity: "0.6",
        companyHandle: 'c1',
        companyName: 'C1'
      },
      {
        id: 2,
        title: 'j2',
        salary: 150,
        equity: "0.5",
        companyHandle: 'c2',
        companyName: 'C2'
      },
      {
        id: 3,
        title: 'j3',
        salary: 200,
        equity: "0",
        companyHandle: 'c3',
        companyName: 'C3'
      },
      {
        id: 4,
        title: 'j4',
        salary: 50,
        equity: '0',
        companyHandle: 'c1',
        companyName: 'C1'
      }
    ]);
  });
});

/************************************** get */

describe("get", function() {
  test("works", async function() {
    let job1 = await Job.get(1);
    expect(job1).toEqual({
      id: 1,
      title: 'j1',
      salary: 100,
      equity: "0.6",
      company: {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: "http://c1.img"
      }
    });
  });

  test("not found if no such id", async function() {
    try {
      await Job.get(100);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Job",
    salary: 200,
    equity: 0.25
  };

  test("works", async function () {
    let updatedJob = await Job.update(1, updateData);
    expect(updatedJob).toEqual({
      id: 1,
      companyHandle: 'c1',
      title: "New Job",
      salary: 200,
      equity: "0.25"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'New Job'`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New Job",
      salary: 200,
      equity: "0.25",
      companyHandle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New Job",
      salary: null,
      equity: null
    };

    let updatedJob = await Job.update(1, updateDataSetNulls);
    expect(updatedJob).toEqual({
      id: 1,
      companyHandle: 'c1',
      ...updateDataSetNulls
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'New Job'`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New Job",
      salary: null,
      equity: null,
      companyHandle: 'c1'
    }]);
  });

  test("not found if no such id", async function () {
    try {
      await Job.update(100, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query("SELECT title FROM jobs WHERE title = 'j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such id", async function () {
    try {
      await Job.remove(100);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

