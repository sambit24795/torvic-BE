export interface SocketUser {
  username: string;
}

export interface SocketData {
  user: SocketUser;
}

export type UserInvitation = SocketUser & { invites: Array<string> };
