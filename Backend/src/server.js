const app = require("./app");
const { connectDatabase } = require("./config/database");
const { port } = require("./config/env");

async function start() {
  await connectDatabase();
  app.listen(port, () => console.log(`Dairy Finder API running on port ${port}.`));
}

start().catch((error) => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
