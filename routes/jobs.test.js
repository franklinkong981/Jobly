"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New job",
    salary: 500,
    equity: 0.4,
    companyHandle: 'c1'
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      newJob: {id: 5, ...newJob, equity: "0.4"}
    });
  });

  test("not ok for logged in non-admins", async function() {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not ok for logged out users", async function() {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "New job",
          salary: 500,
          equity: 0.4
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "500"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("invalid salary", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: -1
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("invalid equity", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: 1.1
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      allJobs:
          [
            {
              id: 1,
              title: 'j1',
              salary: 100,
              equity: "0.6",
              companyHandle: 'c1'
            },
            {
              id: 2,
              title: 'j2',
              salary: 150,
              equity: "0.5",
              companyHandle: 'c2'
            },
            {
              id: 3,
              title: 'j3',
              salary: 200,
              equity: "0",
              companyHandle: 'c3'
            },
            {
              id: 4,
              title: 'j4',
              salary: 50,
              equity: "0",
              companyHandle: 'c1'
            },
          ]
    });
  });

  test("ok for anon with filtering", async function() {
    const resp = await request(app).get("/jobs?title=J&minSalary=150&hasEquity=true");
    expect(resp.body).toEqual({
      allJobs: [
        {
          id: 2,
          title: 'j2',
          salary: 150,
          equity: "0.5",
          companyHandle: 'c2'
        }
      ]
    });
  });

  test("FAILS: Query string contains invalid parameters", async function() {
    const resp = await request(app).get("/jobs?title=j1&minSalary=100&ceo=franklin");
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual("The query string must only contain the following properties: title, minSalary, hasEquity");
  });

  test("FAILS: minSalary is not a number", async function() {
    const resp = await request(app).get("/jobs?title=j1&minSalary=abc");
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual("minSalary parameter in the query string must be a number");
  });

  test("FAILS: hasEquity isn't either true or false", async function() {
    const resp = await request(app).get("/jobs?title=j1&minSalary=100&hasEquity=amazing");
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual("hasEquity parameter in the query string must be either true or false");
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: 'j1',
        salary: 100,
        equity: "0.6",
        companyHandle: 'c1'
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/100`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "New job",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      updatedJob: {
        id: 1,
        title: 'New job',
        salary: 100,
        equity: "0.6",
        companyHandle: 'c1'
      },
    });
  });

  test("doesn't work for logged in non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "New job",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("doesn't work for logged out user", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "New job",
        })
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/1000`)
        .send({
          title: "New job",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          companyHandle: 'c2'
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          salary: "500"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("change salary to invalid value", async function () {
    const resp = await request(app)
        .patch("/jobs/1")
        .send({
          salary: -1
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("change equity to invalid value", async function () {
    const resp = await request(app)
        .patch("/jobs/1")
        .send({
          equity: 1.1
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "Job with id 1, title j1" });
  });

  test("doesn't work for logged in non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("doesn't work for logged out user", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/1000`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
