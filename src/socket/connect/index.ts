import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { attachUser, deleteUser, newConnectionHandler } from "../handlers";
import { SocketData } from "../../types";
import socketStore from "../store";

export default function (port: HttpServer) {
  const io = new Server(port, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  io.use(attachUser);

  io.on("connection", (socket: Socket) => {
    console.log(`connect ${socket.id}`);
    newConnectionHandler(socket as Socket & SocketData, io);
    socketStore.ioInstance = io;
    socketStore.socketInstance = socket;
    console.log("Instance created");

    socket.on("send-message", (data) => {
      console.log("sent message", { data });
      socketStore.sendReceivedMessage(data);
    });

    socket.on("send-room", (data) => {
      console.log("room name", data);
      socketStore.createRoom(data.roomname, data.friends, data.username);
    });

    socket.on("disconnect", () => {
      console.log(`disconnect ${socket.id}`);
      deleteUser(socket);
    });
  });
}
