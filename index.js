require("dotenv").config();
const { app, cronHandler } = require("./app");
const cron = require("node-cron");

// as a rate limit is daily we reset the wordCounts everyday at midnight
const CRON = "0 0 * * *";
cron.schedule(CRON, cronHandler, {
  scheduled: true,
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
