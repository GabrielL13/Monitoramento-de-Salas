const id = localStorage.getItem("dispositivoIdParaRegistro");
const tipoUsuario = localStorage.getItem("tipoUsuario");
const API_URL = "http://localhost:3000";

if (!id) {
    alert("Sala não encontrada!");
    window.location.href = "monitoramento.html";
}

const tabelaAr = document.getElementById("registros-ar");
const tabelaLuz = document.getElementById("registros-luz");
const downloadBtn = document.getElementById("downloadBtn");
const powerArBtn = document.getElementById("powerArBtn");
const powerLuzBtn = document.getElementById("powerLuzBtn");
const temperaturaBtn = document.getElementById("temperaturaBtn");

// Exibir botão de download apenas para Admin (tipo 1)
if (tipoUsuario === "1") {
    downloadBtn.style.display = "block";
}

function formatarEstadoAr(v) { return v === true ? "Ligado" : "Desligado"; }
function formatarEstadoLuz(v) { return v === true ? "Ligada" : "Desligada"; }

// Função para buscar dados do servidor e popular tabelas
async function carregarDados() {
    try {
        const response = await fetch(`${API_URL}/dispositivos/${id}`);
        const disp = await response.json();

        // 1. Popular Tabela de Ar
        tabelaAr.innerHTML = "";
        if (disp.registros && disp.registros.ar && disp.registros.ar.length > 0) {
            // Ordenar por data (mais recente primeiro)
            const registrosAr = [...disp.registros.ar].reverse().slice(0, 15);
            registrosAr.forEach((r, index) => {
                tabelaAr.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${r.dataHora}</td>
                        <td style="color:${r.estado ? '#00ff00' : '#ff4444'}">${formatarEstadoAr(r.estado)}</td>
                        <td>${r.temperatura ?? "-"}</td>
                    </tr>`;
            });
        } else {
            tabelaAr.innerHTML = `<tr><td colspan="4">Nenhum registro disponível.</td></tr>`;
        }

        // 2. Popular Tabela de Luz (Note: No MongoDB unificamos os registros no array de AR por enquanto, 
        // ou você pode criar o campo registros.luz no seu Schema do server.js)
        tabelaLuz.innerHTML = `<tr><td colspan="3">Monitoramento de luz integrado ao log principal.</td></tr>`;

    } catch (err) {
        console.error("Erro ao carregar registros:", err);
    }
}

// Inicialização e Atualização Automática
carregarDados();
setInterval(carregarDados, 5000);

// --- AÇÕES DE CONTROLE ---

powerArBtn.onclick = async () => {
    try {
        // Primeiro buscamos o estado atual
        const res = await fetch(`${API_URL}/dispositivos/${id}`);
        const disp = await res.json();
        const novoEstado = !disp.ar.estado;

        // Enviamos a atualização
        await fetch(`${API_URL}/dispositivos/${id}/ar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: novoEstado })
        });

        alert(`Ar ${novoEstado ? "Ligado" : "Desligado"}!`);
        carregarDados();
    } catch (err) {
        alert("Erro ao alterar estado do Ar.");
    }
};

powerLuzBtn.onclick = async () => {
    try {
        const res = await fetch(`${API_URL}/dispositivos/${id}`);
        const disp = await res.json();
        const novoEstado = !disp.luz.estado;

        await fetch(`${API_URL}/dispositivos/${id}/luz`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: novoEstado })
        });

        alert(`Luz ${novoEstado ? "Ligada" : "Desligada"}!`);
        carregarDados();
    } catch (err) {
        alert("Erro ao alterar estado da Luz.");
    }
};

temperaturaBtn.onclick = async () => {
    let temp = prompt("Defina a temperatura (16 a 31°C):");
    if (temp === null) return;
    temp = Number(temp);

    if (isNaN(temp) || temp < 16 || temp > 31) {
        alert("Temperatura inválida!");
        return;
    }

    try {
        await fetch(`${API_URL}/dispositivos/${id}/temperatura`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temperatura: temp })
        });
        alert("Temperatura enviada!");
        carregarDados();
    } catch (err) {
        alert("Erro ao definir temperatura.");
    }
};

// Download CSV
downloadBtn.onclick = async () => {
    const response = await fetch(`${API_URL}/dispositivos/${id}`);
    const disp = await response.json();
    
    let csv = "Tipo,Data/Hora,Estado,Temperatura\n";
    if (disp.registros && disp.registros.ar) {
        disp.registros.ar.forEach(r => {
            csv += `Ar,${r.dataHora},${r.estado ? "Ligado" : "Desligado"},${r.temperatura ?? "-"}\n`;
        });
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registros_sala_${id}.csv`;
    a.click();
};