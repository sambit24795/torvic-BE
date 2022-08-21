import { Server, Socket } from "socket.io";
import { SocketUser } from "../../types";

class SocketStore {
  private connectedUsers: Map<string, SocketUser>;
  private userInvitations: Map<string, Array<string>>;
  private friendsList: Map<string, Array<string>>;
  private userMapping: Map<string, string>;
  private io: Server | null;
  private socket: Socket | null;

  constructor() {
    this.connectedUsers = new Map();
    this.userInvitations = new Map();
    this.friendsList = new Map();
    this.userMapping = new Map();
    this.io = null;
    this.socket = null;
  }

  get ioInstance() {
    return this.io!;
  }

  get socketInstace() {
    return this.socket;
  }

  set ioInstance(io: Server) {
    this.io = io;
  }

  set socketInstance(socket: Socket) {
    this.socket = socket;
  }

  public addNewUsers({
    socketId,
    username,
  }: {
    socketId: string;
    username: string;
  }) {
    //console.log("socket and user", socketId, username);
    if (!username) {
      return;
    }

    this.connectedUsers.set(socketId, { username });
    this.userInvitations.set(socketId, []);
    this.friendsList.set(username, []);
    this.userMapping.set(username, socketId);

    /* console.log("add user", {
      friend: this.friendsList,
      invite: this.userInvitations,
      mapping: this.userMapping,
      connected: this.connectedUsers,
    }); */
  }

  public removeExistingUser(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    const username = user?.username;

    if (this.connectedUsers.has(socketId)) {
      this.connectedUsers.delete(socketId);
    }

    if (!username) {
      return;
    }

    if (this.friendsList.has(username)) {
      this.friendsList.delete(username);
    }

    if (this.userInvitations.has(socketId)) {
      this.userInvitations.delete(socketId);
    }

    if (this.userMapping.has(username)) {
      this.userMapping.delete(username);
    }

    /*  console.log("deleted user", {
      friend: this.friendsList,
      invite: this.userInvitations,
      mapping: this.userMapping,
      connected: this.connectedUsers,
    }); */
  }

  public setFriendList(friends: Array<string>, socketId: string) {
    const user = this.connectedUsers.get(socketId);

    if (user?.username) {
      this.friendsList.set(user.username, friends);
    }
  }

  public checkUsernameValidity(username: string) {
    if (this.friendsList.has(username)) {
      return false;
    }

    return true;
  }

  public setUserInvitations(username: string, friend: string) {
    const socketId = this.userMapping.get(friend);

    if (!socketId) {
      return;
    }

    if (this.userInvitations.has(socketId)) {
      this.userInvitations.get(socketId)?.push(username);
    } else {
      this.userInvitations.set(socketId, [username]);
    }

    //console.log({ socketId, mapping: this.userMapping });

    this.sendInvitationEvent(socketId);
    return this.userInvitations.get(socketId!);
  }

  public checkIfUserIsOnline(name: string) {
    return this.friendsList.has(name);
  }

  public isAlreadyFriend(username: string, friend: string) {
    return this.friendsList.get(username)!.indexOf(friend);
  }

  public addFriend(username: string, friend: string) {
    const friendSocketId = this.userMapping.get(friend);
    const socketId = this.userMapping.get(username);

    if (friendSocketId) {
      this.userInvitations.delete(friendSocketId);
    }
    this.friendsList.get(username)?.push(friend);
    this.friendsList.get(friend)?.push(username);

    this.sendFriendEvent(socketId!, username);
    this.sendFriendEvent(friendSocketId!, friend);
    this.removeUserFromUserInvitations(username, friend);
  }

  public removeFriend(friend: string, username: string) {
    const friendSocketId = this.userMapping.get(friend);
    this.removeUserFromUserInvitations(username, friend);
    this.sendFriendEvent(friendSocketId!, friend);

    /* console.log({ socketId, friendSocketId });

    console.log("remove ", {
      friend: this.friendsList,
      invite: this.userInvitations,
      mapping: this.userMapping,
      connected: this.connectedUsers,
    }); */
  }

  private sendInvitationEvent(socketId: string) {
    this.io?.to(socketId!).emit("invite-user", {
      userInvitations: this.userInvitations.get(socketId!),
    });
  }

  private sendFriendEvent(friendSocketId: string, friend: string) {
    this.io
      ?.to(friendSocketId!)
      .emit("add-friend", { friends: this.friendsList.get(friend) });
  }

  private removeUserFromUserInvitations(username: string, friend: string) {
    const socketId = this.userMapping.get(username);
    if (!socketId) {
      return;
    }
    const allInvitations = this.userInvitations.get(socketId);
    const filteredInvitations =
      allInvitations?.filter((invitation) => invitation !== friend) ?? [];
    this.userInvitations.set(socketId, filteredInvitations);
    this.sendInvitationEvent(socketId);
  }
}

const socketStore = new SocketStore();

export default socketStore;
