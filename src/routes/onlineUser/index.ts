import express, { Request, Response } from "express";
import { socketStore } from "../../socket";

const router = express();

router.get("/online-user", (req: Request, res: Response) => {
  res.status(200).json({ data: socketStore.onlineUsers, type: "success" });
});

export { router as onlineUser };
