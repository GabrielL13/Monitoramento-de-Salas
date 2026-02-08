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

// Rota para Deletar
app.delete('/dispositivos/:id', async (req, res) => {
    try {
        await Dispositivo.findOneAndDelete({ identificador: req.params.id });
        res.json({ message: "Deletado com sucesso" });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Verifique se sua rota GET está retornando todos os campos
app.get('/dispositivos', async (req, res) => {
    const dispositivos = await Dispositivo.find();
    res.json(dispositivos);
});

// Rota para cadastrar nova sala
app.post('/dispositivos', async (req, res) => {
    try {
        const { identificador } = req.body;

        // Verificar se já existe uma sala com esse ID
        const existe = await Dispositivo.findOne({ identificador });
        if (existe) {
            return res.status(400).json({ message: "Já existe uma sala com este ID." });
        }

        const novo = new Dispositivo(req.body);
        await novo.save();
        
        res.status(201).json(novo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao salvar no banco de dados." });
    }
});

// Buscar uma sala específica
app.get('/dispositivos/:id', async (req, res) => {
    const disp = await Dispositivo.findOne({ identificador: req.params.id });
    res.json(disp);
});

// Alterar Estado do Ar + Gerar Log
app.patch('/dispositivos/:id/ar', async (req, res) => {
    const { estado } = req.body;
    const dataHora = new Date().toLocaleString("pt-BR");
    
    const disp = await Dispositivo.findOne({ identificador: req.params.id });
    const novoIndice = (disp.registros.ar.length || 0) + 1;

    const atualizado = await Dispositivo.findOneAndUpdate(
        { identificador: req.params.id },
        { 
            $set: { "ar.estado": estado },
            $push: { "registros.ar": { indice: novoIndice, dataHora, estado } }
        },
        { new: true }
    );
    res.json(atualizado);
});

// Alterar Temperatura
app.patch('/dispositivos/:id/temperatura', async (req, res) => {
    const { temperatura } = req.body;
    await Dispositivo.findOneAndUpdate(
        { identificador: req.params.id },
        { $set: { "ar.temperatura": temperatura, "ar.temperatura_flag": true } }
    );
    res.json({ message: "Temperatura atualizada" });
});

// Criar Novo Usuário
app.post('/usuarios', async (req, res) => {
    try {
        const { matricula, email } = req.body;
        
        // Verifica duplicidade
        const existe = await User.findOne({ $or: [{ matricula }, { email }] });
        if (existe) {
            return res.status(400).json({ message: "Matrícula ou E-mail já cadastrados." });
        }

        const novoUsuario = new User(req.body);
        await novoUsuario.save();
        res.status(201).json({ message: "Usuário criado!" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao salvar usuário." });
    }
});

// Deletar Usuário
app.delete('/usuarios/:matricula', async (req, res) => {
    try {
        const resultado = await User.findOneAndDelete({ matricula: req.params.matricula });
        if (!resultado) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.json({ message: "Usuário removido." });
    } catch (err) {
        res.status(500).json({ message: "Erro ao deletar." });
    }
});