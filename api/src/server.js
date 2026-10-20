import dotenv from "dotenv";
import express from "express";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import uploads from "./middlewares/upload.js";
import swRoutes from "./view/routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Port = process.env.API_PORT || 3600;

const app = express();

// ========================================
// MIDDLEWARES
// ========================================

app.use(express.json({ limit: "100mb" }));

app.use(express.urlencoded({
    limit: "100mb",
    extended: true
}));

// ========================================
// ROTAS
// ========================================

app.use(swRoutes);

// ========================================
// TESTE
// ========================================

app.get("/test", (req, res) => {
    res.status(200).json({
        message: "servidor rodando",
        port: Port
    });
});

// ========================================
// IP DO SERVIDOR
// ========================================

const getLocalIp = () => {

    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {

        for (const iface of interfaces[name] || []) {

            if (
                iface.family === "IPv4" &&
                !iface.internal
            ) {
                return iface.address;
            }
        }
    }

    return "localhost";
};

// ========================================
// RETORNA IP DO SERVIDOR
// ========================================

app.get("/ip-servidor", (req, res) => {

    const serverIp = getLocalIp();

    res.json({
        ipServidor: serverIp,
        porta: Port
    });
});

// ========================================
// ARQUIVOS UPLOAD
// ========================================

app.use(
    "/uploads",
    express.static(
        path.resolve(__dirname, "..", "uploads")
    )
);

// ========================================
// UPLOAD
// ========================================

app.post(
    "/upload",
    uploads.single("avatar"),
    (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                message: "Erro ao fazer upload do arquivo!"
            });
        }

        return res.status(200).json({
            message: "Arquivo enviado com sucesso!"
        });
    }
);

// ========================================
// SERVIDOR
// ========================================

app.listen(Port, () => {

    const ipServidor = getLocalIp();

    console.log(
        `Servidor ouvindo em: http://${ipServidor}:${Port}`
    );

    console.log(
        `Acesse também em: http://localhost:${Port}`
    );

    console.log(
        "CTRL+C para encerrar o servidor"
    );
});