import express from "express";
import http from "http";
import cors from "cors";

import { connectSocket } from "./socket";
import { inviteUserRouter, friendListRouter } from "./routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", inviteUserRouter);
app.use("/api", friendListRouter);

const server = http.createServer(app);
connectSocket(server);

server.listen(4000, () => {
  console.log("App is running");
});
