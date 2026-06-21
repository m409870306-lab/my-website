import { Router } from "express";
import { dresses } from "../data/dresses.js";

export const dressesRouter = Router();

dressesRouter.get("/", (req, res) => {
  res.json({
    dresses: dresses.filter((dress) => dress.isActive),
  });
});
