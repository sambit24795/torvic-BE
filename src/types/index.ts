export interface SocketUser {
  username: string;
}

export interface SocketData {
  user: SocketUser;
}

export type UserInvitation = SocketUser & { invites: Array<string> };

export interface ReceivedMessage {
  from: string;
  to: string;
  message: string;
  token: string;
}

export type FriendshipValue = {
  friends: Array<string>;
  token: string;
};

export type FriendshipKey = string; 
