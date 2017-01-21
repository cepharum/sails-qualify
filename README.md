# sails-qualify

simple but extensible tools for switching setup of your sailsjs project.


## Motivation

Since starting to use sailsjs for development we repeatedly had issues with 
using our favourite techniques in a freshly created sailsjs project. We've
started with a patch but this approach isn't working out for long and renders
inappropriate when trying to use parts of what is done by that patch, only.

### Why not create a sails-generator?

Sails generators are obviously design to create folders and write files from
templates. That's completely improper for what these tools are made for.

### Why not use yeoman?

These tools are considered to work after scaffolding sailsjs project using the
generators that come with sailsjs itself. yeoman is a scaffolding tool on its
own. It's waste of resources to have another scaffolding framework installed to
complete the work of some other framework scaffolding stuff before.


## Important Notes

These tools without any warranty. You should use them after having backed up
your project, only. Use some version control system!

Tools are basically tested on freshly created sailsjs projects. They might fail
on mature projects having survived several manual revisions of build files etc.

## Installation

* `npm install -g sails-qualify`

## Usage

* `sails-qualify bower`

This qualifier adds bower for managing client side assets.

* `sails-qualify sass`

This qualifier is trying to switch your existing sailsjs project to work with
SASS instead of LESS.

* `sails-qualify pug`

This qualifier switches views to be written in pug (fka jade) instead of ejs.

* `sails-qualify angular2`

This qualifier is setting up support for angular2 based client side application
compile using ahead-of-time compiler `ngc`.

## Extending

This tool is supporting extensions implicitly whenever user tries to enter some 
command that isn't part of core implementation. E.g. on trying to enter command
`mymodifier` which isn't part of core the tool is trying to require dependency
module named `sails-qualify-mymodifier`. This module is considered to export a
function to be invoked with three arguments:

1. instance of Vorpal used to manage CLI interactions
2. all libraries of core implementation incl. tools for managing files and 
   folders
3. provided set of qualified arguments

The method might return promise on starting some asynchronous process.

> Any such module must be installed using npm prior to invoking it as described.
