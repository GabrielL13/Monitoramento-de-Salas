const form = document.getElementById("form-dispositivo");
const mensagem = document.getElementById("mensagem");

const API_URL = "http://localhost:3000";

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("idSala").value.trim();
    const nome = document.getElementById("nomeSala").value.trim();

    if (!id || !nome) {
        mensagem.textContent = "Preencha todos os campos.";
        mensagem.style.color = "orange";
        return;
    }

    try {
        // Criamos o objeto seguindo o Schema que definimos no inicializando.js
        const dataHoraAtual = new Date().toLocaleString("pt-BR");
        
        const novoDispositivo = {
            identificador: id,
            nome: nome,
            ar: {
                estado: false, // Usando booleanos como no novo banco
                temperatura: 21,
                temperatura_flag: false
            },
            luz: {
                estado: false
            },
            registros: {
                ar: [
                    { indice: 1, dataHora: dataHoraAtual, estado: false }
                ]
            }
        };

        const response = await fetch(`${API_URL}/dispositivos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoDispositivo)
        });

        const data = await response.json();

        if (response.ok) {
            mensagem.textContent = `Sala "${nome}" cadastrada com sucesso!`;
            mensagem.style.color = "lightgreen";
            form.reset();
            
            // Redireciona após 2 segundos para a tabela
            setTimeout(() => {
                window.location.href = "monitoramento.html";
            }, 2000);
        } else {
            // Se o servidor retornar erro (ex: ID já existe)
            mensagem.textContent = data.message || "Erro ao cadastrar sala.";
            mensagem.style.color = "red";
        }

    } catch (error) {
        console.error("Erro ao cadastrar sala:", error);
        mensagem.textContent = "Não foi possível conectar ao servidor.";
        mensagem.style.color = "red";
    }
});