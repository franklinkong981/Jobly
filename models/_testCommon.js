const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  //gets rid of all existing data in Jobs table and resets auto-incrementing ids to 1.
  await db.query("DELETE FROM jobs");
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`INSERT INTO users(username, password, first_name, last_name, email, is_admin)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com', TRUE),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com', FALSE)
        RETURNING username`,
      [await bcrypt.hash("password1", BCRYPT_WORK_FACTOR), await bcrypt.hash("password2", BCRYPT_WORK_FACTOR)]);
  
  await db.query(`INSERT INTO jobs(title, salary, equity, company_handle)
        VALUES('j1', 100, 0.6, 'c1'),
              ('j2', 150, 0.5, 'c2'),
              ('j3', 200, 0, 'c3'),
              ('j4', 50, 0, 'c1')`);
  
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};