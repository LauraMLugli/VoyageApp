import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import * as UserModel from "../model/usersModel.js";

export const logouf = async (req, res) => {
    return
}

export const register = async (req, res) => {
    const { name, login, password } = req.body;
    const { data, message} = await UserModel.GetByEmail(login) ;
    
    if (message === "Success") 
        return res.status(400).json({ message: 'Email já cadastrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
  
    const response = await UserModel.Post({ name, login, password:hashedPassword });
    
    res.status(201).json(response);

};

export const login = async (req, res) => {
    const { login, password } = req.body;
    console.log( login, password);
    const user = await UserModel.GetByEmail(login);    
    if (user.message !== "Success") 
        return res.status(401).json({ message: 'Credenciais inválidas ***' });

    const responseData = user.data[0];
    // if ( responseData.password !== password) {
    //     return res.status(401).json({ message: 'Credenciais inválidas' });
    // }
    console.log(`do banco ${responseData}`)
    const valid = await bcrypt.compare(password, responseData.password)

    if (!valid) return res.status(401).json({ message: 'Credenciais inválidas >>>' });

    const token = jwt.sign ({ userId: responseData.id , 
        userName: responseData.name },
         process.env.JWT_SECRET,
         { expiresIn: '1h' });
    console.log( token );

    res.json({ "message":"sucess", "data" : token , "user": { "id": responseData.id,
        "name": responseData.name
    } });
    
};