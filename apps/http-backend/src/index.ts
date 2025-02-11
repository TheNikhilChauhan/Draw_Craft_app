import express from "express";

const app = express();

app.listen(3005, () => {
  console.log("The server is running at port: 3005");
});
