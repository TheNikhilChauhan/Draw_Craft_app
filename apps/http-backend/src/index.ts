import express from "express";
import { middleware } from "./middleware";

const app = express();
app.use(express.json());

app.post("/signup", (req, res) => {});
app.post("/signin", (req, res) => {});
app.post("/room", middleware, (req, res) => {});

app.listen(3005, () => {
  console.log("The server is running at port: 3005");
});
