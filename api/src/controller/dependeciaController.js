import * as myModel from "../model/dependenciaModel.js"

// metodo get = verbo get
export async function Get(req,res){
    try {
        const response = await myModel.Get();
        if (response.message.toLowerCase() == "success".toLowerCase() ) {
            res.status(200).json(response);
        } else {
            res.status(400).json(response);
        }
        
        
    } catch (error) {
        res.status(403).json({"message":"erro", "Error": error.message});
    }
}

export async function GetById(req,res) {
    try {
        const id = req.params.id;
        const response = await myModel.GetById(id);
        if (response.message.toLowerCase() == "success".toLowerCase() ) {
            res.status(200).json(response);
        } else {
            res.status(400).json(response);
        }
    } catch (error) {
       res.status(403).json({"message":"erro", "Error": error.message});    
    }
}

export async function Delete(req,res) {
    try {
        const id = req.params.id;
        const response = await myModel.Delete(id);
        if (response.message.toLowerCase() == "success".toLowerCase() ) {
            res.status(200).json(response);
        } else {
            res.status(400).json(response);
        }
    } catch (error) {
       res.status(403).json({"message":"erro", "Error": error.message});    
    }
}

export async function Post(req,res){
    try {
        const dataBody = req.body;
        if (!dataBody) {
            res.status(415).json({"message":"erro", "Error": "Falha sem Body..."});       
        }
        const response = await myModel.Post(dataBody);
         if (response.message.toLowerCase() == "success".toLowerCase() ) {
            res.status(201).json(response);
        } else {
            res.status(408).json(response);
        }
    } catch (error) {
       res.status(405).json({"message":"erro", "Error": error.message});  
    }

}

export async function Put(req,res){
    try {
        const id = req.params.id;
        const dataBody = req.body;
        if ( id <= 0 ){
            res.status(416).json({"message":"erro", "Error": "Falha sem ID..."});       
        }
        if (!dataBody) {
            res.status(415).json({"message":"erro", "Error": "Falha sem Body..."});       
        }
        const response = await myModel.Put(dataBody, id );
         if (response.message.toLowerCase() == "success".toLowerCase() ) {
            res.status(201).json(response);
        } else {
            res.status(400).json(response);
        }
    } catch (error) {
        res.status(406).json({"message":"erro", "Error": error.message});  
    }
}