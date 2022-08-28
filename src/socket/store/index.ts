import { Server, Socket } from "socket.io";
import {
  FriendshipKey,
  FriendshipValue,
  SocketUser,
  ReceivedMessage,
  Group,
  GroupChat,
} from "../../types";

class SocketStore {
  private connectedUsers: Map<string, SocketUser>;
  private userInvitations: Map<string, Array<string>>;
  private friendsList: Map<string, Array<string>>;
  private userMapping: Map<string, string>;
  private chatMessages: Map<string, Array<Omit<ReceivedMessage, "token">>>;
  private friendshipMap: Map<FriendshipKey, FriendshipValue>;
  private groupInvitations: Map<string, Array<Group>>;
  private groupsList: Map<string, Array<string>>;
  private groupUsersList: Map<string, Array<string>>;
  private groupChats: Map<string, GroupChat[]>;
  private io: Server | null;
  private socket: Socket | null;

  constructor() {
    this.connectedUsers = new Map();
    this.userInvitations = new Map();
    this.friendsList = new Map();
    this.userMapping = new Map();
    this.chatMessages = new Map();
    this.friendshipMap = new Map();
    this.groupInvitations = new Map();
    this.groupsList = new Map();
    this.groupUsersList = new Map();
    this.groupChats = new Map();
    this.io = null;
    this.socket = null;
  }

  get ioInstance() {
    return this.io!;
  }

  get socketInstace() {
    return this.socket;
  }

  get onlineUsers() {
    return Array.from(this.userMapping.keys());
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

    if (this.friendshipMap.has(username)) {
      const token = this.friendshipMap.get(username)?.token;
      this.chatMessages.delete(token!);
      this.friendshipMap.delete(username);
    }

    if (this.groupInvitations.has(username)) {
      this.groupInvitations.delete(username);
    }

    console.log("deleted user", {
      friend: this.friendsList,
      invite: this.userInvitations,
      mapping: this.userMapping,
      connected: this.connectedUsers,
    });
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
    const friendSocketId = this.userMapping.get(friend);

    if (!friendSocketId) {
      return;
    }

    if (this.userInvitations.has(friendSocketId)) {
      this.userInvitations.get(friendSocketId)?.push(username);
    } else {
      this.userInvitations.set(friendSocketId, [username]);
    }

    //console.log({ friendSocketId, mapping: this.userMapping });

    this.sendInvitationEvent(friendSocketId);
    return this.userInvitations.get(friendSocketId!);
  }

  public setGroupInvitations(
    username: string,
    groupname: string,
    friends: Array<string>
  ) {
    this.addUserInGroupList(username, groupname);
    this.addGroupsInUserList(username, groupname);
    const allMembers = [...friends, username];

    for (let i = 0; i < friends.length; i++) {
      if (this.groupInvitations.get(friends[i])) {
        const allGroups = this.groupInvitations
          .get(friends[i])
          ?.concat({ groupname, allMembers });
        this.groupInvitations.set(friends[i], allGroups!);
      } else {
        this.groupInvitations.set(friends[i], [{ groupname, allMembers }]);
      }

      this.sendGroupInvite(friends[i]);
    }
    this.sendGroupDetails(username);
  }

  public addUsersToGroup(groupname: string, username: string) {
    this.addUserInGroupList(username, groupname);
    this.addGroupsInUserList(username, groupname);

    const allUsersInGroup = this.removeUserFromGroupInvitations(
      username,
      groupname
    );

    const invites = [...allUsersInGroup, username];
    console.log("all invites", invites);
    invites?.forEach((user) => {
      //console.log("user", { user });
      this.sendGroupInvite(user);
      this.sendGroupDetails(user);
    });

    /* console.log("after accept", {
      group: this.groupsList,
      invite: this.groupInvitations,
    }); */
  }

  public removeUsersFromGroup(groupname: string, username: string) {
    if (this.groupUsersList.has(username)) {
      const groups = this.groupsList.get(username);
      const index = groups?.findIndex((group) => group === groupname);
      groups?.splice(index!, 1);
    }

    if (this.groupsList.has(groupname)) {
      const groups = this.groupsList.get(groupname);
      const index = groups?.findIndex((user) => user === username);
      groups?.splice(index!, 1);
    }

    const allUsersInGroup = this.removeUserFromGroupInvitations(
      username,
      groupname
    );

    const invites = [...allUsersInGroup, username];
    invites?.forEach((user) => {
      //console.log("user", { user });
      this.sendGroupInvite(user);
      this.sendGroupDetails(user);
    });
  }

  public isGroupnameExists(groupname: string) {
    const exists = this.groupsList.get(groupname);
    return !!exists;
  }

  public checkIfUserIsOnline(name: string) {
    return this.friendsList.has(name);
  }

  public isAlreadyFriend(username: string, friend: string) {
    return !!this.friendsList
      .get(username)!
      .find((userFriend) => userFriend === friend);
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

  public checkIfInvitationSent(username: string, friend: string) {
    const friendSocketId = this.userMapping.get(friend);

    const isSent = this.userInvitations
      .get(friendSocketId!)
      ?.find((invitedUser) => invitedUser === username);
    return !!isSent;
  }

  public sendReceivedMessage(data: ReceivedMessage) {
    const friendSocketId = this.userMapping.get(data.to);
    const socketId = this.userMapping.get(data.from);
    this.storeChats(data);
    this.io
      ?.to(friendSocketId!)
      .to(socketId!)
      .emit("receive-message", {
        token: data.token,
        data: this.chatMessages.get(data.token),
      });
  }

  public sendReceiveGroupMessage(data: GroupChat & { token: string }) {
    this.storeGroupChats(data);
    const allMembers = this.groupsList.get(data.token);
    /* console.log("all group chat", {
      tokenChat: this.groupChats.get(data.token),
      all: this.groupChats,
    }); */
    allMembers?.forEach((member) => {
      this.io?.to(this.userMapping.get(member)!).emit("receive-group-message", {
        token: data.token,
        data: this.groupChats.get(data.token),
      });
    });
  }

  public checkIfInvitationPending(username: string, friend: string) {
    const socketId = this.userMapping.get(username);

    const isPending = this.userInvitations
      .get(socketId!)
      ?.find((pendingFriend) => pendingFriend === friend);
    return !!isPending;
  }

  public createRoom(room: string, friends: Array<string>, username: string) {
    const sockeId = this.userMapping.get(username);

    this.friendshipMap.set(username, { token: room, friends });
    this.chatMessages.set(room, []);

    const mappingData = {
      initiator: username,
      data: this.friendshipMap.get(username),
    };
    // send message to all the friend socket ids
    for (let i = 0; i < friends.length; i++) {
      this.io
        ?.to(this.userMapping.get(friends[i])!)
        .emit("receive-room", mappingData);
    }

    this.socket?.to(sockeId!).emit("receive-room", mappingData);

    console.log("friends map", this.friendshipMap, mappingData);
  }

  public createGroupRoom(username: string, groupname: string) {
    this.groupChats.set(groupname, []);

    this.groupsList.get(groupname)?.forEach((user, _, allUsers) => {
      this.io?.to(this.userMapping.get(user)!).emit("receive-group-room", {
        initiator: username,
        members: allUsers,
        token: groupname,
      });
    });
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

  private sendGroupInvite(user: string) {
    this.io?.to(this.userMapping.get(user)!).emit("group-invite", {
      data: this.groupInvitations.get(user),
      user: user,
    });
  }

  private sendGroupDetails(user: string) {
    this.io?.to(this.userMapping.get(user)!).emit("add-group", {
      groups: this.groupUsersList.get(user),
    });
  }

  private addGroupsInUserList(username: string, groupname: string) {
    if (this.groupUsersList.has(username)) {
      this.groupUsersList.get(username)?.push(groupname);
    } else {
      this.groupUsersList.set(username, [groupname]);
    }
  }

  private addUserInGroupList(username: string, groupname: string) {
    if (this.groupsList.has(groupname)) {
      this.groupsList.get(groupname)?.push(username);
    } else {
      this.groupsList.set(groupname, [username]);
    }
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

  private removeUserFromGroupInvitations(username: string, groupname: string) {
    let allUsersInGroup: Array<string> = [];
    const mapKeys = Array.from(this.groupInvitations.keys());
    for (let i = 0; i < mapKeys.length; i++) {
      const groups = this.groupInvitations.get(mapKeys[i]);
      if (!groups) {
        continue;
      }

      if (mapKeys[i] === username) {
        const index = groups?.findIndex((data) => data.groupname === groupname);
        groups?.splice(index!, 1);
        continue;
      }

      for (let j = 0; j < groups.length; j++) {
        if (!groups[i]) {
          continue;
        }
        //console.log("groups[i]", mapKeys[i], groups[i]);
        const index = groups[i].allMembers.findIndex(
          (member) => member === username
        );
        groups[i].allMembers.splice(index, 1);
        allUsersInGroup = [...groups[i]?.allMembers];
      }
    }

    return allUsersInGroup;
  }

  private storeChats({ from, to, message, token }: ReceivedMessage) {
    if (this.chatMessages.has(token)) {
      this.chatMessages.get(token)?.push({
        to,
        from,
        message,
      });
    } else {
      this.chatMessages.set(token, [
        {
          to,
          from,
          message,
        },
      ]);
    }
  }

  private storeGroupChats({
    token,
    from,
    message,
  }: GroupChat & { token: string }) {
    console.log('token data', this.groupChats);
    console.log('token value', this.groupChats.get(token));

    if (this.groupChats.has(token.trim())) {
      this.groupChats.get(token)?.push({
        from,
        message,
      });
    } else {
      this.groupChats.set(token.trim(), [
        {
          from,
          message,
        },
      ]);
    }
  }
}

const socketStore = new SocketStore();

export default socketStore;
