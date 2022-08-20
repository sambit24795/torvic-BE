import { SocketUser } from "../../types";

class SocketStore {
  private connectedUsers: Map<string, SocketUser>;

  constructor() {
    this.connectedUsers = new Map();
  }

  public addNewUsers({
    socketId,
    userId,
  }: {
    socketId: string;
    userId: string;
  }) {
    this.connectedUsers.set(socketId, { userId });
    console.log(
      "%c new connected user",
      "background: #dc2626",
      this.connectedUsers
    );
  }
}

const socketStore = new SocketStore();

export default socketStore;
