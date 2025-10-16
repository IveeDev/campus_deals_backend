import { signUp, signIn, signOut } from "#src/controllers/auth.controller.js";
import express from "express";

const router = express.Router();

router.post("/sign-up", signUp);

router.post("/sign-in", signIn);

router.post("/sign-out", signOut);

router.post("/refresh-token", (req, res) => {
  // Logic for refreshing token
  res.send("Token refreshed");
});

export default router;
