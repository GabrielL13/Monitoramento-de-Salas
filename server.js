const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// --- CONEXÃO COM MONGODB ATLAS ---
const ATLAS_URI = "mongodb+srv://gabriel_db_user:LKGSHxBeyw58K36g@monitoramentodispositiv.gdoyn3l.mongodb.net/?appName=MonitoramentoDispositivos";
mongoose.connect(ATLAS_URI)
    .then(() => console.log("✅ Servidor conectado ao MongoDB Atlas"))
    .catch(err => console.error("❌ Erro de conexão:", err));

// --- SCHEMAS (Devem bater com o inicializando.js) ---
const User = mongoose.model('User', new mongoose.Schema({
    matricula: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipo: Number
}));

const Dispositivo = mongoose.model('Dispositivo', new mongoose.Schema({
    identificador: { type: String, required: true, unique: true },
    nome: String,
    ar: { estado: Boolean, temperatura: Number, temperatura_flag: Boolean },
    luz: { estado: Boolean },
    registros: {
        ar: [{ indice: Number, dataHora: String, estado: Boolean }]
    }
}));

// --- ROTA DE LOGIN ---
app.post('/login', async (req, res) => {
    const { matricula, password } = req.body; // 'password' vem do fetch do login.js

    try {
        const user = await User.findOne({ matricula: matricula });

        if (!user) {
            return res.status(404).json({ message: "Matrícula não encontrada." });
        }

        // Comparamos com 'user.senha' que está no banco
        if (user.senha === password) {
            return res.json({ 
                matricula: user.matricula, 
                tipo: user.tipo 
            });
        } else {
            return res.status(401).json({ message: "Senha incorreta." });
        }
    } catch (err) {
        res.status(500).json({ message: "Erro no servidor." });
    }
});

// --- ROTA PARA LISTAR DISPOSITIVOS (Com os registros de teste) ---
app.get('/dispositivos', async (req, res) => {
    try {
        const dispositivos = await Dispositivo.find();
        res.json(dispositivos);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar dispositivos." });
    }
});

app.listen(3000, () => console.log("🚀 API rodando em http://localhost:3000"));