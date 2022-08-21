import express, { Request, Response } from "express";
import { socketStore } from "../../socket";

const router = express.Router();

router.post("/invite-user", async (req: Request, res: Response) => {
  const { username, friend } = req.body;

  if (username === friend) {
    res.send({ message: "you cannot be your own friend", type: "error" });
    return;
  }

  /* const isFriend = socketStore.isAlreadyFriend(username, friend);
  if (isFriend) {
    res.send({ message: `${friend} is already a friend`, type: "error" });
    return;
  } */

  if (!socketStore.checkIfUserIsOnline(friend)) {
    res.send({ message: "user is not available", type: "error" });
    return;
  }

  const userinvitations = socketStore.setUserInvitations(username, friend);
  console.log({ userinvitations });
  res.status(201).json({
    message: "you have added a friend",
    data: userinvitations,
    type: "success",
  });
});

export { router as inviteUser };
