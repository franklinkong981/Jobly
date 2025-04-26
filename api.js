import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3001";

/** This is the top-level API class for the Jobly backend that the frontend will interact with to retrieve
 * data about companies, jobs, user, etc.
 * 
 * This is a static class tying together methods used to get/send to the API. There 
 * won't be any frontend-specific stuff here, and there won't be any API-aware stuff
 * elsewhere in the frontend.
 * 
 * All React components in frontend will interact through methods in this file to retrieve information from backend.
 */

class JoblyApi {
  //Whenever a user signs up/logs in to Jobly, they'll be issued a token which they'll need to 
  //access most of the routes. This token will be stored here.

  static token;

  //The main reusable method that will be called whenever the front end wants to send a request
  // to a certain route in the backend.

  static async request(endpoint, data = {}, method = "get") {
    console.debug("API Call: ", endpoint, data, method);

    //This is one way to pass an authorization token: As part of the header.
    const url = `${BASE_URL}/${endpoint}`;
    const headers = {Authorization: `Bearer ${JoblyApi.token}`};
    const params = (method === "get") ? data : {};

    try {
      return (await axios({url, method, data, params, headers})).data;
    } catch(err) {
      console.error("API Error: ", err.response);
      let message = err.response.data.error.message;
      throw Array.isArray(message) ? message : [message];
    }
  }

  //Individual API routes

  /** Get details on a company by handle. GET request on /companies will return 
   * {company: { handle, name, description, numEmployees, logoUrl, jobs }
  *   where jobs is [{ id, title, salary, equity }} */
  
  static async getCompany(handle) {
    let res = await this.request(`companies/${handle}`);
    return res.company;
  }

  //more methods to come down here.

}

//For now, this is the test user that will be used to test the code while it is under development.
//This is the token that will be given to a user with username = "testuser", password = "password"
JoblyApi.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZ" +
"SI6InRlc3R1c2VyIiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTU5ODE1OTI1OX0." +
"FtrMwBQwe6Ue-glIFgz_Nf8XxRT2YecFCiSpYL0fCXc";