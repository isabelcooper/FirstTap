# Getting started (for developers)

## Getting started in the codebase

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


## System architecture

![SystemArchitectureImage](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/systemArchitecture.JPG)

## Data Model

![DataStores](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/dataStores.png)

## Technical suggestions for improvement
- [BUG] style.css is returning 200 but not applying to docs/privacy

- local psql testing would be better hooked to a local DB and using some fake data (rather than inMemory), or alternatively in a docker env. If further development is needed this may be a wise addition to improve local testing. 

- app reloads slowly after release - needs investigation to avoid downtime

- worth adding front-end form field protection eg for email address, pin code length. Seems sensible to do this at the front end, though the current system would error if the pincode is too long. 

- clock is currently untested as it's almost all standard functionality, but in the interest of full coverage it would be nice to add these. 

- integrating the payment system into this backend would be a neat solution to avoid multiple calls to the api (to check if there is sufficient budget on the card before taking payment). In the meantime however, both the GET and PUT endpoints remain exposed on the /balance endpoint. 

- add DELETE endpoint to remove employees (and cascade into any linked tables)

- as the project grows it might be neater to run a separate server for the api docs so they don't interfere with traffic to the api itself.

- the api documentation is manageable at this size, but risky as the content isn't tested, only compiled. Ideally we'd introduce a generator that can be fully tested - this will become particularly useful if multiple endpoints are added. 

- the integration tests don't run in circle currently which is a risk: to make this work we'd probably want to look at running the whole release process in a docker container.

- in the process of refactoring and moving logic to different places, some tests may have been repeated across different classes - these could probably be reduced, but I have left them in preference for over-testing rather than losing coverage. This is once of the areas where I most missed having a pair partner to help me sense check. 
 
- the format of responses could be neater: a more defined body structure might be easier to parse on the front end

- the store interfaces are currently built around the very specific queries in use in this project, but in growing, it might be advisable to add a further level of abstraction for CRUD methods (ideally with an interface which both Stores could implement) and perhaps even a sql query builder. 

- session tokens are currently stored indefinitely and updated on new logins. This seems an unnecessary use of storage space so it may be desirable to wip old session tokens on a recurring basis (for example with a cron job) or possible add a 'current tokens' view that allows faster querying of the valid tokens.

- there's a lot of repetition between the login/sign up handlers - seems likely they could be merged into one.

## Quick look at tech stack 
- CircleCI 
- Google AppEngine & Psql Cloud Storage
- http4js server framework
- postgrator runs pg migrations
- mocha/chai testing frameworks
- raml/html generates documentation
- uuid generates unique identifiers as session tokens
For full dependency list, see [package.json](https://github.com/makersacademy/isabel-cooper-sp/blob/master/package.json)
