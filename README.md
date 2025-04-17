# Jobly
A web app where users can search for and apply to jobs. Uses Node, Express, and Postgres.

DISCLAIMER: This project is still a work in progress. As of right now, only the backend is complete. In the future, a frontend for this app will be built using React, but for now, you can only test out the app with an API testing application like Insomnia or Postman.

# How to install and run the code
To replicate the code, clone this repo into your local terminal using the SSH key by going to the folder you want and doing:

```
git clone <SSH_key_here>
```

Then navigate into the new folder that was just created, which will contain the files in this repo:

```
cd Jobly
```

Next, make sure you have Node.js and PostgreSQL installed before continuing. 

The next step is to initialize an npm repo by typing into the terminal:

```
npm init --yes
```

Next, download all the required npm packages for this repo listed in the package.json file by doing:

```
npm install
```

Next, we need to set up the databases. Open up a new window in your terminal, and create the development database and testing database:

```
createdb jobly;
createdb jobly_test;
```

The last thing to do is to make sure the database connection URIs match the ones in your environment. If you go to config.js, on lines 13-17 you should see a function that determines what database the app should connect to when it first starts off. The one on line 15 corresponds to the testing database (you should see the words jobly_test at the end of it) and the one on line 16 corresponds to the production database (you should see the word jobly at the end).

Each of the URIs follow this format: postgres://<username>:<password>@127.0.0.1:5432/<database_name>. You need to change the username and password fields to the ones that you entered when setting up Postgres. Otherwise, the app won't run! Once you've done this, change the tests in config.test.js on lines 21 and 24 to change the expected database URIs to the ones you changed the actual database URIs in config.js to so that these tests continue to work.

Finally, to run the commands in jobly.sql file which will insert starter data into the jobly and jobly_test databases, in the command line do:

```
psql < jobly.sql
```

Follow the instructions (press Enter key to seed jobly database, then Enter again to seed jobly_test database).

Now you're all set! To run the app, do:

```
nodemon server.js
```

then you can open up an API testing app like Insomnia to start testing the application.

To run tests, do the following:

```
jest -i
```

This will run the tests in all the test files in order, so that there are no conflicting tests. If you don't include the -i flag, they won't work!

# How to Get Authenticated 

Most of the routes in this app right now require you to be authenticated in order for you to be able to send a request to them, which means you'll need a JSON Web Token in every one of these requests. In order to obtain your JSON Web token, you'll need to first sign up.

Once you start the app and go to your API testing application, first send a POST request to the route /auth/register. Include the following in your request body:

```
{
  username: <string, must be between 1-30 characters>,
  password: <string, must be between 5-20 characters>,
  firstName: <string, must be between 1-30 characters>,
  lastName: <string, must be between 1-30 characters>,
  email: <string, must be between 6-60 characters, must be a valid email address>
}
```

Details for JSON validation of this route are provided in the file userRegister.json in the schemas folder. Whenever you see a route in the code that references one of the schema JSON files in this folder, that means the body of the request sent to that route must follow a certain format in order for the request to be successful. Make sure to examine these schema JSON files to ensure that your request body follows the correct format.

In the response body, you should get back an attribute "_token" with a large string of characters and numbers after it. This is your JSON Web Token encrypted string. In the request header, make a new attribute with key "authorization", and copy and paste this _token string into the value field.

Now you are authenticated! With this _token string in your header, you can now send a request to any route that only requires for you to be logged in (aka the route only makes use of the ensureLoggedIn middleware function).

FINAL NOTE: If you forget your token string, just send a POST request to /auth/token with your request body being:

```
{
  username: <your_username>,
  password: <your_password>
}
```

and you'll get your _token string in the response body.

# How to get Admin Authentication

Some of the routes in this app don't just require for you to be logged in, they require you to be an admin as well. Admins currently can only be added by other admins. If you register as a new user, by default you will NOT be an admin.

There is currently no way to gain admin access without modifying the code. Here's what you can do:

The route to create a new admin can be found in the routes/users.js file. It is the POST /users route. In line 32 of that file, you'll see:

```
router.post("/", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {...})
```

The ensureLoggedIn is a middleware function that means only logged in/authenticated users can access this route. The ensureIsAdmin is another middleware function that ensures that only logged-in admins can access this route. 

What you need to do is delete the ensureIsAdmin to make it look like this instead.

```
router.post("/", ensureLoggedIn, async function (req, res, next) {...})
```

Now you can create an admin. Start the app and then in your API testing application, send a POST request to /users with the following request body:

```
{
  username: the_admin,
  password: 123456789,
  firstName: the,
  lastName: admin,
  email: the_admin@gmail.com,
  isAdmin: true
}
```

Then, once you send the request, you should get back a _token string. Copy and paste this _token string into the value field of the authorization field in your request header (if there is no authorization field in the request header, make a new field, call the key authorization, and copy-paste the _token string into the value box).

Now you are all set! You have a JSON web token string for an account that belongs to an admin in your header field. Undo the change you made in the code so that the POST /users route once again has both the ensureLoggedIn and ensureIsAdmin middleware functions, and now you can access virtually every route in the application since you have admin authorization.