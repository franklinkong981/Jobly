"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../errors/expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 * 
 * NOTE: In order to be authorized, user must either do sign up via POST /auth/register
 * OR admins create a new user through POST /users. Either of these return a token string. Then, in all future requests,
 * include in the header the attribute "authorization" with value = Bearer encrypted_token_string.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const encryptedToken = authHeader.replace(/^[Bb]earer /, "").trim();
      const decryptedTokenPayload = jwt.verify(encryptedToken, SECRET_KEY);
      res.locals.user = decryptedTokenPayload;
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError("You must be logged in to access this!");
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be an admin.
 * 
 * If not, raises Unauthorized.
 */

function ensureIsAdmin(req, res, next){
  try{
    if ((!res.locals.user) || (!res.locals.user.isAdmin)) throw new UnauthorizedError("You must be a logged in admin to access this!");
    return next();
  } catch(err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin
};
