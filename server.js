const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/monitoramento')
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch(err => console.error("❌ Erro de conexão:", err));

const User = mongoose.model('User', new mongoose.Schema({
    matricula: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipo: Number
}));

const Dispositivo = mongoose.model('Dispositivo', new mongoose.Schema({
    identificador: { type: String, required: true, unique: true },
    nome: String,
    ar: {
        estado: { type: Boolean, default: false },
        temperatura: { type: Number, default: 25 },
        temperatura_flag: { type: Boolean, default: false }
    },
    luz: {
        estado: { type: Boolean, default: false }
    },
    registros: [{
        timestamp: { type: Date, default: Date.now },
        evento: String
    }]
}));

app.post('/login', async (req, res) => {
    const { matricula, password } = req.body;
    try {
        const user = await User.findOne({ matricula });
        if (!user) return res.status(404).json({ message: "Matrícula não encontrada." });
        
        if (user.senha === password) {
            res.json({ matricula: user.matricula, tipo: user.tipo });
        } else {
            res.status(401).json({ message: "Senha incorreta." });
        }
    } catch (err) {
        res.status(500).json({ message: "Erro no servidor." });
    }
});

app.get('/dispositivos', async (req, res) => {
    try {
        const dispositivos = await Dispositivo.find();
        res.json(dispositivos);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar dispositivos." });
    }
});

app.patch('/dispositivos/:id', async (req, res) => {
    try {
        const atualizado = await Dispositivo.findOneAndUpdate(
            { identificador: req.params.id },
            req.body,
            { new: true }
        );
        res.json(atualizado);
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));