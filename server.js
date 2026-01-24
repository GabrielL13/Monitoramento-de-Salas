const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Permite que seu HTML acesse o servidor

// Conexão com MongoDB (Substitua pela sua URL do Atlas ou Local)
mongoose.connect('mongodb://localhost:27017/monitoramento');

// Definição do Schema de Usuário
const UserSchema = new mongoose.Schema({
    matricula: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipo: Number
});

const User = mongoose.model('User', UserSchema);

// Rota de Login
app.post('/login', async (req, res) => {
    const { matricula, password } = req.body;
    try {
        const user = await User.findOne({ matricula: matricula });

        if (!user) {
            return res.status(404).json({ message: "Matrícula não encontrada." });
        }

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

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));