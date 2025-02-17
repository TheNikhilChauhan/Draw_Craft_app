import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface Users {
  rooms: string[];
  ws: WebSocket;
  userId: string;
}

const users: Users[] = [];

const checkUser = (token: string): string | null => {
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET || "");

    if (typeof decode === "string") {
      return null;
    }

    if (!decode || !decode.userId) {
      return null;
    }

    return decode.userId;
  } catch (error) {
    console.log(error);
    return null;
  }
  return null;
};

wss.on("connection", function connection(ws: WebSocket, request) {
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return;
  }

  users.push({
    rooms: [],
    userId,
    ws,
  });

  ws.on("message", async function message(data) {
    let parsedData;
    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data);
    }

    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }
    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        return;
      }

      user.rooms = user?.rooms.filter((x) => x === parsedData.room);
    }

    console.log("Message received");

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await prismaClient.chat.create({
        data: {
          roomId: Number(roomId),
          userId,
          message,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });

  ws.send("Hey there buddy!");
});
