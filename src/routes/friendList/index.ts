import express, { Request, Response } from "express";
import { socketStore } from "../../socket";

const router = express.Router();

router.post("/add-friend", async (req: Request, res: Response) => {
  const { username, friend } = req.body;
  const { action } = req.query;

  console.log({ username, friend, action });

  if (!username || !friend || !action) {
    res.send({ message: "no proper parameters", type: "error" });
    return;
  }

  if (action === "accept") {
    socketStore.addFriend(username, friend);
    res.status(200).json({ message: "You have got a friend", type: "success" });
  } else if (action === "reject") {
    socketStore.removeFriend(friend, username);
    res.status(200).json({ message: "You rejected", type: "success" });
  }
});

export { router as friendList };
