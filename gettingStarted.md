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



## Technical suggestions for improvement
- [BUG] style.css is returning 200 but not applying to docs/privacy

- local psql testing would be better hooked to a local DB and using some fake data (rather than inMemory), or alternatively in a docker env. If further development is needed this may be a wise addition to improve local testing. 

- app reloads slowly after release - needs investigation to avoid downtime

- worth adding front-end form field protection eg for email address, pin code length. Seems sensible to do this at the front end, though the current system should handle any attempt to input invalid data into the DB by raising an error. 

- clock is currently untested as it's almost all standard functionality, but in the interest of full coverage it would be nice to add these. 

- integrating the payment system into this backend would be a neat solution to avoid multiple calls to the api (to check if there is sufficient budget on the card before taking payment). In the meantime however, both the GET and PUT endpoints remain exposed on the /balance endpoint. 

- add DELETE endpoint to remove employees (and cascade into any linked tables)

- as the project grows it might be neater to run a separate server for the api docs so they don't interfere with traffic to the api itself.

- the api documentation is manageable at this size, but risky as the content isn't tested, only compiled. Ideally we'd introduce a generator that can be fully tested - this will become particularly useful if multiple endpoints are added. 

## Quick look at tech stack 
- CircleCI 
- Google AppEngine & Psql Cloud Storage
- http4js server framework
- postgrator runs pg migrations
- mocha/chai testing frameworks
- raml/html generates documentation
- uuid generates unique identifiers as session tokens
For full dependency list, see [package.json](https://github.com/makersacademy/isabel-cooper-sp/blob/master/package.json)
