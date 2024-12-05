const { BadRequestError } = require("../errors/expressError");

/* Helper function that is used to create part of the SQL query string that will be used to update part of a User, Company, or Job.

PARAMETERS:
datatoUpdate: An object where keys = JavaScript names of all attributes in the User/Company/Job class that you want to update, 
values = new values to update to.
jsToSql: Because the names of the attributes in .js files in the models folder are in cameCast (ex. firstName, lastName) while the
names of the corresponding data columns in the database are separated by underscores (ex. first_name, last_name), jsToSql is another object
where the key = the name of the attribute in JavaScript and the value = the name of the attribute in SQL.
NOTE: jsToSql only contains the key-value pairs of attributes that are different between JS and SQL.

RETURN VALUES:
Function returns an object that contains 2 attributes:
setCols: A string that will be plugged into the SQL query after the SET keyword. It contains the SQL name of each attribute to update
in the database followed by the parametrized marking. Ex. first_name = $1, last_name = $2  
values: The array of new values you want to update each attribute to, the order of values correspond to the order they appear in the
setCols string.

EXAMPLE:
If dataToUpdate = {"firstName": "Franklin", "lastName": "Kong", "email": franklinkong981@gmail.com},
jsToSql = {"firstName": "first_name", "lastName": "last_name"} NOTE that email isn't included because it's the same in JS and SQL.
Then sqlForPartialUpdate(dataToUpdate, jsToSql) -->
{
  setCols: '"first_name"=$1, "last_name"=$2, "email"=$3'
  values: ["Franklin", "Kong", "franklinkong981@gmail.com"]. NOTE: "Franklin" is first value because first_name is $1, etc.
}
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
