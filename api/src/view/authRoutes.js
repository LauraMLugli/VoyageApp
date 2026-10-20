import { Router } from "express";
import * as mycontroller from "../controller/authController.js"

const endPoint = "/auth";

const router = Router();

router.post(`${endPoint}/login`,(req,res) => { mycontroller.login(req,res)});
router.post(`${endPoint}/register`,(req,res) => { mycontroller.register(req,res)});

export default router;