/* This is the file that tests the helper function sqlForPartialUpdate in helpers/sql.js, which is used to 
create part of the SQL query string to partially update a user, company, or job. */

const {sqlForPartialUpdate} = require("./sql");
const { BadRequestError} = require("../errors/expressError");

describe("sqlForPartialUpdate function", function() {
  test("It works", function() {
    const dataToUpdate = {
      firstName: "Franklin",
      lastName: "Kong",
      email: "franklinkong981@gmail.com"
    };
    const jsToSql = {
      firstName: "first_name",
      lastName: "last_name"
    }
    result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: `"first_name"=$1, "last_name"=$2, "email"=$3`,
      values: ["Franklin", "Kong", "franklinkong981@gmail.com"]
    });
  });
  test("It works even if jsToSql is empty", function() {
    const dataToUpdate = {
      firstName: "Franklin",
      lastName: "Kong",
      email: "franklinkong981@gmail.com"
    };
    const jsToSql = {};
    result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: `"firstName"=$1, "lastName"=$2, "email"=$3`,
      values: ["Franklin", "Kong", "franklinkong981@gmail.com"]
    });
  });
  test("Empty dataToUpdate object returns BadRequesterror", function() {
    const dataToUpdate = {};
    const jsToSql = {};
    try {
      result = sqlForPartialUpdate(dataToUpdate, jsToSql);
      fail();
    } catch(err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.status).toEqual(400);
    }
  });
});