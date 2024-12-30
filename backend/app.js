require("dotenv").config();
const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");

const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.get("/", async (req, res, next) => {
  res.send({ message: "Awesome it works 🐻" });
});

app.use("/api/member", require("./routes/api.mem.route"));
app.use("/api/account", require("./routes/api.ac.route"));
app.use("/api/trans", require("./routes/api.trans.route"));
app.use("/api/transDesc", require("./routes/api.transDesc"));
app.use("/api/reports", require("./routes/api.reports.routes"));

app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
