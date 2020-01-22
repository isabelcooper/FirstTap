## Limitations
- [ ] local psql testing would be better hooked to a local DB and using some fake data (rather than inMemory), or alternatively in a docker env. If further development is needed this may be a wise addition to improve local testing. 
- [ ] app reloads slowly after release - needs investigation to avoid downtime
- [ ] worth adding front-end form field protection eg for email address, pin code length. Seems sensible to do this at the front end, though the current system should handle any attempt to input invalid data into the DB by raising an error. 
- [ ] e2e tests
- [ ] mig process 
- [ ] Employee balance has max 8 digits - in a world where they can top up beyond this, it would need to be expanded.
- [ ] clock is currently untested as it's almost all standard functionality, but in the interest of full coverage it would be nice to add these. 
