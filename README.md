# FirstTap
First Catering Ltd API to allow F1 company employees to top up and purchase food at their existing kiosk terminals using their current payment cards. 

### Useful links:
- [Full API documentation](https://firsttap.appspot.com/docs#)
- [Privacy Policy](https://firsttap.appspot.com/docs/privacy) _NB the FirstCatering API should be updated to cover our involvement in processing and storing this data._

## Api Overview

### Possible use cases
**"As an employee at Formula1 Performance Cars, I want to..."**

...register as a new user, storing my core details and receiving a session token and greeting to my name in return.

...login to my account using my employeeId and pincode, receiving a session token and greeting to my name in return.

...logout of my account when I want.

...logout of my account automatically if I'm inactive for over 5 minutes.

...top up my balance

...reduce my balance when I make payments

...know that only a logged in user can amend my account (ie me)

...view a privacy policy

**"As a developer at FirstCatering, I want to..."**
...see a summary of all available endpoints, how to structure requests and possible responses.

...run a full test suite so that I can ensure any change I make doesn't break existing functionality.

...read an employee's balance when they are logged in so I can prevent them paying for things they can't afford.

...know that an employee can only register once so there is no confusion between duplicate accounts or balances

### Api Limitations 
- The current session token timeout is 5 minutes, based on a loose assumption. Should this be too narrow, it can be altered using the constant TIME_TO_TOKEN_EXPIRY in src/userAuthtoken/TokenManager.ts
- Employee balance has max 8 digits - in a world where they can top up beyond this, it would need to be expanded.
- There is currently no capability for resetting pin codes (which would seem a useful addition given an employee cannot create more than 1 account).
- The API does not account for multiple currencies as there is no indication that the client is international in nature. Indeed currency is not stored at all (though could sensibly be added in a transaction table (see below). 
- The Privacy Policy is currently sketchy: better justification is needed for storing contact details in this 3rd party given they are currently unused. Ideally these would be made optional. There is also currently no mechanism for 'forgetting' employees (eg when they leave the company) which is not GDPR compliant. 

- There is currently no concept of transaction history nor are any of the details of an individual transaction stored. If desirable, this information could be stored in a 'transaction' table in the database, joined to the existing employee table on employeeId. This could be done from the TransactionManager.
- There is no endpoint for analysis of user activity (which of course would be reliant on the above).

### Assumptions 
- 5 mins is an acceptable session expiry time
- employeeId is a reliable identifier and already being validated against the existing database before requesting access to the TapFirst API.
- existing portals have their own UI - the goal here is simply to provide the api to store changes to balance
- Payments will be sent to the api as a float with max 2 decimal places - if this is not the case, the system will currently round, store and return as such. 
- Niceties of error handling/ posting messages to the UI will be handled by the front end. Required data is returned (eg the username on the login endpoint), but not stylised.

### Getting started in the codebase
From your terminal you can run: 
`./run version_check` checks you're on the correct version of node

`./run` installs npm packages and runs all tests (exits early if unit tests fail) 

`./run start:local` generates the html for the API documentation and launches the app locally, outputting the relevant port
NB: you'll need a .env to connect to stores for int tests. The following values should have been provided in your handover.
```
POSTGRES_PASSWORD
FIRSTTAP_CLIENT_USERNAME
FIRSTTAP_CLIENT_PASSWORD
```

Committing to master runs the ci script, regenerating the api docs and deploying to production if all the tests pass. 

The main entrypoint for the file is ./main.ts, which constructs the server (./server/server.ts)

### Technical suggestions for improvement
- [ ] local psql testing would be better hooked to a local DB and using some fake data (rather than inMemory), or alternatively in a docker env. If further development is needed this may be a wise addition to improve local testing. 
- [ ] app reloads slowly after release - needs investigation to avoid downtime
- [ ] worth adding front-end form field protection eg for email address, pin code length. Seems sensible to do this at the front end, though the current system should handle any attempt to input invalid data into the DB by raising an error. 
- [ ] clock is currently untested as it's almost all standard functionality, but in the interest of full coverage it would be nice to add these. 
- [ ] integrating the payment system into this backend would be a neat solution to avoid multiple calls to the api (to check if there is sufficient budget on the card before taking payment). In the meantime however, both the GET and PUT endpoints remain exposed on the /balance endpoint. 
- [ ] add DELETE endpoint to remove employees (and cascade into any linked tables)

### Quick look at tech stack 
- CircleCI 
- Google AppEngine & Psql Cloud Storage
- http4js server framework
- postgrator runs pg migrations
- mocha/chai testing frameworks
- raml/html generates documentation
- uuid generates unique identifiers as session tokens
For full dependency list, see [package.json](https://github.com/makersacademy/isabel-cooper-sp/blob/master/package.json)

