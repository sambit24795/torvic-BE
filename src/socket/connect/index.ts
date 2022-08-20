import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export default function (port: HttpServer) {
  const io = new Server(port, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`connect ${socket.id}`);
    //store.addNewUsers(socket, io);

    socket.on("disconnect", () => {
      console.log(`disconnect ${socket.id}`);
    });
  });
}
