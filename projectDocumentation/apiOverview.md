# Api Overview

## Possible use cases
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

## Api Limitations 
- The current session token timeout is 5 minutes, based on a loose assumption. Should this be too narrow, it can be altered using the constant TIME_TO_TOKEN_EXPIRY in src/userAuthtoken/TokenManager.ts

- Employee balance has max 8 digits - in a world where they can top up beyond this, it would need to be expanded.

- There is currently no capability for resetting pin codes (which would seem a useful addition given an employee cannot create more than 1 account).

- The API does not account for multiple currencies as there is no indication that the client is international in nature. Indeed currency is not stored at all (though could sensibly be added in a transaction table (see below). 

- The Privacy Policy is currently sketchy: better justification is needed for storing contact details in this 3rd party given they are currently unused. Ideally these would be made optional. There is also currently no mechanism for 'forgetting' employees (eg when they leave the company) which is not GDPR compliant. 

- Email addresses and mobile numbers are currently stored as strings so can include symbols (eg +44 or @), but could also be invalid. It would seem simplest to implement protection for this at the front end, or it could be added to the Handler to return an appropriate error. 

- The api docs are accessed using the same basic auth credentials as the rest of the Api. This means the kiosks technically have access which they don't need and a third party might be able to access them if they can gain access to the kiosk. This doesn't seem high risk given the documentation isn't highly sensitive (a breach of a kiosk security would have more concerning implications for employee data security), however it would be possible to separate the auth processes so non-engineers don't have unnecessary privileges. 

- [BUG] The jump links oon the documentation page aren't working - could be a bug with the html generator plugin. Worth investigating if the page becomes unwieldy with the addition of more endpoints! 


- There is currently no concept of transaction history nor are any of the details of an individual transaction stored. If desirable, this information could be stored in a 'transaction' table in the database, joined to the existing employee table on employeeId. This could be done from the TransactionManager.

- There is no endpoint for analysis of user activity (which of course would be reliant on the above).

## Assumptions 
- 5 mins is an acceptable session expiry time

- employeeId is a reliable identifier and already being validated against the existing database before requesting access to the TapFirst API.

- existing portals have their own UI - the goal here is simply to provide the api to store changes to balance

- Payments will be sent to the api as a float with max 2 decimal places - if this is not the case, the system will currently round, store and return as such. 

- Niceties of error handling/ posting messages to the UI will be handled by the front end. Required data is returned (eg the username on the login endpoint), but not stylised.
