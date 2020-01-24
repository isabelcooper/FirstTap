# Project process

## Overview
- Sprint planning of upcoming tasks based on rough user stories. 

- Key tasks stored on kanban board and updated over the course of the week with checkin on progress against goal each morning (quasi stand up)

- I normally work in a pair so a week alone has been an odd experience. On the whole not problematic, however I missed having someone to play out architecture ideas and refactoring of tests with. 

_NB I would normally work on a whiteboard which is a little more visually obvious than the spreadsheet - if I were to repeat it, I'd bring a massive piece of paper and postits!_


## Testing
 
**Mocha/chai**
I use a full tests suite of unit tests (which are isolated to their class by stubbing using InMemory instances of other classes), plus an end to end set of tests on the server. 
 
**Localhost**
`./run start:local` serves the app on localhost so I can view the docs in the browser or send requests locally for problemshooting.

**Postman**
I tested all the endpoints by following my own documentation files and running the requests in Postman (an app to send requests and show responses in a more user friendly way than curl)

**CircleCI**
I commit small changes to master so before each commit I run my test suite (`./run`). This catches any surprises I've missed while I'm working, but because human error happens, I've also wired in Circle CI to run unit tests on each commit to master so any issues and exist before the deployment if anything fails. 


## Daily kanban screenshots:

**Day 1** 
![Day1](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/Day1.png)

**Day 2** 
![Day2](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/Day2.png)

**Day 3** 
![Day3](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/Day3.png)

**Day 4** 
![Day4](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/Day4.png)

**Day 5** 
![Day5](https://github.com/makersacademy/isabel-cooper-sp/blob/master/projectDocumentation/images/Day5.png)
