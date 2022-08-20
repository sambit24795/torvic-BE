import { Socket } from "socket.io";
import { SocketData } from "../../types";
import socketStore from "../store";

const newConnectionHandler = async (socket: Socket & SocketData) => {
  socketStore.addNewUsers({
    socketId: socket.id,
    userId: socket?.user?.userId,
  });
};

export { newConnectionHandler };
