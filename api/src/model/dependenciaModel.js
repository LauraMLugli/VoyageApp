import { db } from "../databases/DatabaseContext.js";
const tableName = "dependencias";

export async function Get ( req, res)  {
    try {
        const results = await db.execute(
            `SELECT * FROM ${tableName} ORDER BY id`
        );
        return {"message":"Success","data":results} ;
    } catch (error) {
        console.log(error);
        return {"message": "error", "Error": error.message};
    }
}

export async function GetById(id){
    try {
        const results = await db.execute(
            `SELECT * FROM ${tableName} WHERE id = ? ORDER BY id `,
            [id]
        );
        return {"message":"Success","data":results} ;
    } catch (error) {
       return {"message": "error", "Error": error.message} 
    }
}

export async function Delete(id){
    try {
        const results = await db.execute(
            `DELETE FROM ${tableName} WHERE id = ?`,
            [id]
        );
        return {"message":"Success","data":results} ;
    } catch (error) {
       return {"message": "error", "Error": error.message} 
    }
}

export async function Post( data ){
    try {
        const {dependencia, capacidade } = data;
        
        const results = await db.execute(
            `INSERT INTO ${tableName} (dependencia, capacidade) VALUES ( ? , ?)`,
            [dependencia , capacidade ]
        );
        return {"message":"Success","data":results} ;
    } catch (error) {
        console.log( error, error.message);
        return {"message": "error", "Error": error.message} 
    }

}

export async function Put( data, id ){
    try {
        const { dependencia, capacidade } = data;
        const results = await db.execute(
            `UPDATE ${tableName} SET dependencia = ?, capacidade = ? WHERE id = ?`,
            [ dependencia , capacidade , id]
        );
        return {"message":"Success","data":results} ;
    } catch (error) {
        return {"message": "error", "Error": error.message} 
    }
}