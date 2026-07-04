const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pinoHttp = require("pino-http");
const router = require("./routes");
const { logger } = require("./lib/logger");

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET must be set. Did you forget to provision it?",
  );
}

const isProduction = process.env.NODE_ENV === "production";

const app = express();

// The app sits behind Replit's shared reverse proxy, so trust its
// X-Forwarded-* headers when deciding whether a request is secure
// (needed for secure cookies to work correctly in production).
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/api", router);

module.exports = app;
