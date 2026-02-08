const TABELA_DADOS = document.getElementById("tabela-dados");
const ADMIN_BUTTONS = document.getElementById("adminButtons");
const LOGOUT_BTN = document.getElementById("logout-btn");
const TH_DELETAR = document.getElementById("th-deletar");

// Configuração da URL da sua API
const API_URL = "http://localhost:3000";

function inicializarInterface() {
    const matricula = localStorage.getItem('matricula');
    const tipoUsuarioStr = localStorage.getItem('tipoUsuario');

    // Verifica se está logado (0 = Normal, 1 = Admin)
    if (!matricula || (tipoUsuarioStr !== "0" && tipoUsuarioStr !== "1")) {
        window.location.href = "index.html";
        return null;
    }
    
    const tipoUsuario = Number(tipoUsuarioStr);

    // No MongoDB o Admin é tipo 1 (conforme o inicializando.js)
    if (tipoUsuario === 1) {
        ADMIN_BUTTONS.style.display = "flex";
        TH_DELETAR.style.display = "table-cell";
    } else {
        ADMIN_BUTTONS.style.display = "none";
        TH_DELETAR.style.display = "none";
    }

    LOGOUT_BTN.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "index.html";
    });

    return tipoUsuario;
}

async function deletarDispositivo(id) {
    if (confirm(`Deseja realmente deletar a sala ${id}?`)) {
        try {
            const response = await fetch(`${API_URL}/dispositivos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`Sala ${id} deletada com sucesso.`);
                // Recarrega os dados imediatamente após deletar
                const tipoUsuario = Number(localStorage.getItem('tipoUsuario'));
                carregarDispositivos(tipoUsuario);
            } else {
                alert("Erro ao deletar sala no servidor.");
            }
        } catch (err) {
            alert("Erro de conexão: " + err.message);
        }
    }
}

async function carregarDispositivos(tipoUsuario) {
    const colspan = tipoUsuario === 1 ? 6 : 5;

    try {
        const response = await fetch(`${API_URL}/dispositivos`);
        const dispositivos = await response.json();

        TABELA_DADOS.innerHTML = "";
        
        if (dispositivos.length === 0) {
            TABELA_DADOS.innerHTML = `<tr><td colspan='${colspan}'>Nenhum dispositivo encontrado.</td></tr>`;
            return;
        }

        dispositivos.forEach((disp) => {
            // O id no Mongo que usamos é o 'identificador' (0001, 0002)
            const id = disp.identificador;
            const nome = disp.nome || "Desconhecido";
            
            // Lógica de booleanos do seu novo Schema
            const luzLigado = disp.luz?.estado === true;
            const arLigado = disp.ar?.estado === true;
            const temperatura = disp.ar?.temperatura;
            const temperaturaTexto = temperatura !== undefined ? `${temperatura}°C` : "-";

            const row = document.createElement("tr");
            row.style.cursor = "pointer";

            row.innerHTML = `
                <td>${id}</td>
                <td>${nome}</td>
                <td style="color:${luzLigado ? "#00ff00" : "#ff4444"};font-weight:bold;">
                    ${luzLigado ? "Ligado" : "Desligado"}
                </td>
                <td style="color:${arLigado ? "#00ff00" : "#ff4444"};font-weight:bold;">
                    ${arLigado ? "Ligado" : "Desligado"}
                </td>
                <td style="font-weight:bold;">${temperaturaTexto}</td>
                ${tipoUsuario === 1 ? `<td><button class="deletar-btn" data-id="${id}">Deletar</button></td>` : ""}
            `;

            // Clique na linha para ver o histórico (registros de teste que criamos)
            row.addEventListener("click", (e) => {
                // Não dispara o clique da linha se clicar no botão deletar
                if (e.target.classList.contains('deletar-btn')) return;
                
                localStorage.setItem("dispositivoIdParaRegistro", id);
                window.location.href = "registro.html";
            });

            TABELA_DADOS.appendChild(row);
        });

        // Reatribui eventos aos botões de deletar
        if (tipoUsuario === 1) {
            document.querySelectorAll(".deletar-btn").forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    deletarDispositivo(btn.getAttribute("data-id"));
                };
            });
        }
    } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
        TABELA_DADOS.innerHTML = `<tr><td colspan='${colspan}'>Erro ao conectar ao servidor.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tipoUsuario = inicializarInterface();
    if (tipoUsuario !== null) {
        // Primeira carga
        carregarDispositivos(tipoUsuario);
        
        // Atualização automática a cada 5 segundos (Polling)
        setInterval(() => carregarDispositivos(tipoUsuario), 5000);
    }
});