# elections
Code for https://artofcode.co.uk/elections - shows you information about
currently running elections on Stack Exchange sites.

## Install
This project comes in two parts, which are bundled together in the same
repository for convenience. To set up a working copy, you will need to install
both parts.

Clone the repository.

```
git clone git@github.com:Charcoal-SE/elections
cd elections
```

### Frontend
Depending on whether you want a copy for development or production, you may or
may not need to do anything here.

For a **development** copy, you don't need to do anything. You can access the
frontend files directly from your local filesystem (i.e. navigate to
`file:///home/you/elections/frontend/elections.html`, or equivalent).

For a **production** copy, you will need to set up a public HTTP server to serve
the front end files directly. Refer to the documentation for your server of
choice for instructions on how to do this.

### API
The API is a Node app, and follows a fairly standard install procedure.

```
cd elections-api
npm install
```

You will need to have Redis installed and running on port 6379 to run the API
app - data is cached in Redis to cut down on the number of requests to the Stack
Exchange API.

To run, use `npm start`. You can include an optional `PORT` environment variable
to specify the port for the server to listen on; you can also specify
`DEBUG=elections-api:*` to get debugging messages.

## Contributing
Contributions are welcome; for large changes, please create an issue to discuss
before sending a PR.

Charcoal's [Code of Conduct](https://charcoal-se.org/smokey/Code-of-Conduct)
applies to this project, including to contributions and contributors.