import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws: WebSocket, request) {
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const decode = jwt.verify(token, process.env.JWT_SECRET || "");

  if (!decode || !(decode as JwtPayload).userId) {
    ws.close();
    return;
  }

  ws.on("message", function message(data) {
    console.log(data.toString());
  });

  ws.send("Hey there buddy!");
});
