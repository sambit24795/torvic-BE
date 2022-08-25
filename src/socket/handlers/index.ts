import { Server, Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { SocketData } from "../../types";
import socketStore from "../store";
import storedSocketInstances from "../socketInstances";

const newConnectionHandler = async (
  socket: Socket & SocketData,
  io: Server
) => {
  if (!socketStore.checkUsernameValidity(socket.user.username)) {
    io.to(socket.id).emit("error", {
      message: "This username is already taken",
    });
    socket.disconnect();
    return;
  }

  storedSocketInstances.setAllStoredInstances(socket.user.username, socket);
  socketStore.addNewUsers({
    socketId: socket.id,
    username: socket?.user?.username,
  });
  io.to(socket.id).emit("add-user", { user: socket.user });
};

const attachUser = (
  socket: Socket,
  next: (err?: ExtendedError | undefined) => void
) => {
  const socketUser = socket.handshake.auth.user;

  if (!socketUser.username) {
    next(new Error("Username already exists"));
    return;
  }

  (socket as Socket & SocketData).user = socketUser;
  next();
};

const deleteUser = (socket: Socket) => {
  socketStore.removeExistingUser(socket.id);
};

export { newConnectionHandler, attachUser, deleteUser };
