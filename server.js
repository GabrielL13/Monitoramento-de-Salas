const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());


// --- CONEXÃO COM MONGODB ATLAS ---
const ATLAS_URI = process.env.MONGODB_URI;
mongoose.connect(ATLAS_URI)
    .then(() => console.log("✅ Servidor conectado ao MongoDB Atlas"))
    .catch(err => console.error("❌ Erro de conexão:", err));

const User = mongoose.model('User', new mongoose.Schema({
    matricula: { type: String, required: true, unique: true },
    email: String,
    senha: { type: String, required: true },
    tipo: Number
}));

const Dispositivo = mongoose.model('Dispositivo', new mongoose.Schema({
    identificador: { type: String, required: true, unique: true },
    nome: String,
    ar: { estado: Boolean, temperatura: Number, temperatura_flag: Boolean },
    luz: { estado: Boolean },
    registros: {
        ar: [{ dataHora: String, estado: Boolean, temperatura: Number }],
        luz: [{ dataHora: String, estado: Boolean }]
    }
}));

// --- ROTAS DE USUÁRIO ---

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

app.post('/usuarios', async (req, res) => {
    try {
        const { matricula, email } = req.body;
        const existe = await User.findOne({ $or: [{ matricula }, { email }] });
        if (existe) return res.status(400).json({ message: "Matrícula ou E-mail já cadastrados." });

        const novoUsuario = new User(req.body);
        await novoUsuario.save();
        res.status(201).json({ message: "Usuário criado!" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao salvar usuário." });
    }
});

app.delete('/usuarios/:matricula', async (req, res) => {
    try {
        const resultado = await User.findOneAndDelete({ matricula: req.params.matricula });
        if (!resultado) return res.status(404).json({ message: "Usuário não encontrado." });
        res.json({ message: "Usuário removido." });
    } catch (err) {
        res.status(500).json({ message: "Erro ao deletar." });
    }
});

// --- ROTAS DE DISPOSITIVOS ---

app.get('/dispositivos', async (req, res) => {
    try {
        const dispositivos = await Dispositivo.find();
        res.json(dispositivos);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar dispositivos." });
    }
});

app.get('/dispositivos/:id', async (req, res) => {
    try {
        const disp = await Dispositivo.findOne({ identificador: req.params.id });
        if (!disp) return res.status(404).json({ message: "Sala não encontrada" });
        res.json(disp);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar sala." });
    }
});

app.post('/dispositivos', async (req, res) => {
    try {
        const { identificador } = req.body;
        const existe = await Dispositivo.findOne({ identificador });
        if (existe) return res.status(400).json({ message: "ID já existe." });

        const novo = new Dispositivo(req.body);
        await novo.save();
        res.status(201).json(novo);
    } catch (err) {
        res.status(500).json({ message: "Erro ao salvar dispositivo." });
    }
});

app.delete('/dispositivos/:id', async (req, res) => {
    try {
        await Dispositivo.findOneAndDelete({ identificador: req.params.id });
        res.json({ message: "Deletado com sucesso" });
    } catch (err) {
        res.status(500).send(err);
    }
});

// --- ROTAS DE CONTROLE (REGISTROS) ---

app.patch('/dispositivos/:id/ar', async (req, res) => {
    try {
        const { estado } = req.body;
        const dataHora = new Date().toLocaleString("pt-BR");
        const disp = await Dispositivo.findOne({ identificador: req.params.id });

        const atualizado = await Dispositivo.findOneAndUpdate(
            { identificador: req.params.id },
            { 
                $set: { "ar.estado": estado },
                $push: { "registros.ar": { dataHora, estado, temperatura: disp.ar.temperatura } }
            },
            { new: true }
        );
        res.json(atualizado);
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar Ar." });
    }
});

app.patch('/dispositivos/:id/luz', async (req, res) => {
    try {
        const { estado } = req.body;
        const dataHora = new Date().toLocaleString("pt-BR");

        const atualizado = await Dispositivo.findOneAndUpdate(
            { identificador: req.params.id },
            { 
                $set: { "luz.estado": estado },
                $push: { "registros.luz": { dataHora, estado } }
            },
            { new: true }
        );
        res.json(atualizado);
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar Luz." });
    }
});

app.patch('/dispositivos/:id/temperatura', async (req, res) => {
    try {
        const { temperatura } = req.body;
        await Dispositivo.findOneAndUpdate(
            { identificador: req.params.id },
            { $set: { "ar.temperatura": temperatura, "ar.temperatura_flag": true } }
        );
        res.json({ message: "Temperatura atualizada" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar temperatura." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API rodando na porta ${PORT}`));