import express, { Request, Response } from "express";
import { socketStore } from "../../socket";

const router = express();

const inviteGroup = router.post(
  "/invite-group",
  (req: Request, res: Response) => {
    const { username, invitedUsers, groupname } = req.body;

    console.log({ exists: socketStore.isGroupnameExists(groupname) });

    if (!groupname || !username) {
      res.send({
        type: "error",
        message: "username or groupname cannot be empty",
      });
      return;
    }

    if (socketStore.isGroupnameExists(groupname)) {
      res.send({ type: "error", message: "groupname already exists" });
      return;
    }

    socketStore.setGroupInvitations(username, groupname, invitedUsers);
    res.status(200).json({ type: "success" });
  }
);

const addGroup = router.post("/add-group", (req: Request, res: Response) => {
  const { action } = req.query;
  const { username, groupname } = req.body;

  if (action === "accept") {
    socketStore.addUsersToGroup(groupname, username);
    res
      .status(200)
      .json({ type: "success", message: "user added to the group" });
  } else if (action === "reject") {
    socketStore.removeUsersFromGroup(groupname, username);
    res
      .status(200)
      .json({ type: "success", message: "user deleted from the group" });
  }
});

export { inviteGroup, addGroup };
