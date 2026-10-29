const express = require("express");
const cors = require("./config/cors");
const routes = require("./routes");
const notFound = require("./middlewares/not-found.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();
app.use(cors);
app.use(express.json());
app.get("/", (req, res) => res.json({ success: true, message: "Dairy Finder API is running." }));
app.use("/api", routes);
app.use(notFound);
app.use(errorMiddleware);

module.exports = app;
