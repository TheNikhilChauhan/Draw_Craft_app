import express from "express";
import { middleware } from "./middleware";
import {
  createUserSchema,
  roomSchema,
  signinSchema,
} from "@repo/zod-common/types";
import { prismaClient } from "@repo/db/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config({
  path: "../../.env",
});

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = createUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    console.log(parsedData.error);
    res.json({
      message: "Incorrect inputs",
    });
    return;
  }

  const password = parsedData.data.password;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data?.username,
        password: hashedPassword,
        name: parsedData.data?.name,
      },
    });
    res.json({
      userId: user.id,
    });
  } catch (error) {
    res.status(411).json({
      message: "User already exists with this username",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = signinSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }
  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.username,
    },
  });

  if (!user) {
    res.status(403).json({
      message: "Not Authorized",
    });
    return;
  }

  //password hashing
  const userPassword = parsedData.data.password;
  const isPasswordValid = await bcrypt.compare(userPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign(
    {
      userId: user?.id,
    },
    process.env.JWT_SECRET || ""
  );

  res.json({
    token,
  });
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = roomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(403).json({
      message: "Incorrct Input",
    });
    return;
  }
  // @ts-ignorets
  const userId = req.userId;

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.roomName,
        adminId: userId,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (error) {
    res.status(411).json({
      message: "Room already exists with this name",
    });
  }
});

app.listen(3005, () => {
  console.log("The server is running at port: 3005");
});
