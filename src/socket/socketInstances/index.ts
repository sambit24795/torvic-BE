import { Socket } from "socket.io";

class StoredSocketInstances {
  private allInstances: Map<string, Socket>;

  constructor() {
    this.allInstances = new Map();
  }

  get allStoredInstances() {
    return this.allInstances;
  }

  setAllStoredInstances(username: string, socket: Socket) {
    this.allInstances.set(username, socket);
  }
}

const storedSocketInstances = new StoredSocketInstances();

export default storedSocketInstances;
