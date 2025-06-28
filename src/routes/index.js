import { Router } from "express";  
import {userController} from "../controllers/userController.js";
import { LoginController } from "../controllers/loginController.js";
import authenticate from "../../middlewares/authenticate.js";
import authorization from "../../middlewares/authorization.js"; 

const router = Router();
const userController = new userController();
const loginController = new LoginController();

router.post("/login", loginController.login)

//usuarios
router.get("/usuarios", authorization, userController.getAllUsers)
router.get("/usuarios/:id",userController.getUserById)
router.post("/usuarios", userController.createUser)
router.put("/usuarios/:id", userController.updateUser)
router.delete("/usuarios/:id", userController.deleteUser)

//items
router.get("/items", authorization, userController.getAllItems)
router.get("/items/:id", userController.getItemById)
router.post("/items", userController.createItem)
router.put("/items/:id", userController.updateItem)

//proposta
router.get("/propostas", authorization, userController.getAllProposals)
router.get("/propostas/:id", userController.getProposalById)

export default router;