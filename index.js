const bodyParser = require("body-parser");
const express = require("express");
const formidable = require("express-formidable");
const uid2 = require("uid2");
const cron = require("node-cron");
const app = express();

const RATE_LIMIT = 80000;
const CRON = "0 0 * * *"; // Midnight every day
const JUSTIFY_SIZE = 80;

const users = {};
const wordCounts = {};

// healthcheck route
app.get("/", (req, res) => {
  res.json({ message: "Hello" });
});

// token route
app.post("/api/token", formidable(), (req, res) => {
  // check if email is provided
  if (req.fields.email) {
    const email = req.fields.email;
    // check if this user had already generate a token
    // yes => give it the same token / no => generate a new one
    if (!users[email]) {
      const token = uid2(16);
      users[email] = token;
      wordCounts[token] = 0;
    }
    res.json({ token: users[email] });
  } else {
    res.status(400).json("Please provide an email");
  }
});

// justify route
app.post("/api/justify", bodyParser.text(), (req, res) => {
  // check format and presence of a token
  if (!req.headers.authorization.startsWith("Bearer ")) {
    res.status(401).json({ message: "token is missing or invalid" });
  } else {
    // remove the "Bearer " prefix from the header
    const token = req.headers.authorization.replace("Bearer ", "");

    // as we initialize wordCounts for a specific token to 0 on generation
    // if it's undefined, the token is unknown
    if (wordCounts[token] !== undefined) {
      const text = req.body;
      if (text) {
        // count words
        const nbWords = text.split(" ").length;
        wordCounts[token] += nbWords;

        if (wordCounts[token] >= RATE_LIMIT) {
          res.status(402).json({ message: "Payment required" });
        } else {
          let newStr = "";
          // insert a newline character every JUSTIFY_SIZE chars
          for (let i = 0; i < text.length; i++) {
            if (i % JUSTIFY_SIZE === 0 && i !== 0) {
              newStr += "\n";
            }

            newStr += text[i];
          }

          res.end(newStr);
        }
      } else {
        res.status(400).json("Please provide a text");
      }
    } else {
      res.status(401).json({ message: "token is missing or invalid" });
    }
  }
});

// as a rate limit is daily we reset the wordCounts everyday at midnight
cron.schedule(
  CRON,
  () => {
    console.log("Reset rate limit");
    const tokens = Object.keys(wordCounts);
    for (const token of tokens) {
      wordCounts[token] = 0;
    }
  },
  {
    scheduled: true,
  }
);

app.listen(3000, () => {
  console.log("Server has started");
});
