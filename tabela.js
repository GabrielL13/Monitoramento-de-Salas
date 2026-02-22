const corpoTabela = document.getElementById("tabela-dados");
const adminButtons = document.getElementById("adminButtons");
const thDeletar = document.getElementById("th-deletar");
const logoutBtn = document.getElementById("logout-btn");

const API_URL = "https://monitoramento-de-salas.onrender.com";
const tipoUsuario = localStorage.getItem("tipoUsuario");

if (tipoUsuario === "1") {
    if (adminButtons) adminButtons.style.display = "flex";
    if (thDeletar) thDeletar.style.display = "table-cell";
}

logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
};

async function carregarDispositivos() {
    try {
        const response = await fetch(`${API_URL}/dispositivos`);
        if (!response.ok) throw new Error("Falha na rede");
        
        const dispositivos = await response.json();
        renderizarTabela(dispositivos);
    } catch (error) {
        console.error("Erro:", error);
        corpoTabela.innerHTML = `<tr><td colspan="6">Erro ao carregar dados.</td></tr>`;
    }
}

function renderizarTabela(dispositivos) {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    dispositivos.forEach((disp) => {
        const tr = document.createElement("tr");
        
        // Cores para status
        const corLuz = disp.luz?.estado ? "#00ff00" : "#ff4444";
        const corAr = disp.ar?.estado ? "#00ff00" : "#ff4444";

        tr.innerHTML = `
            <td>${disp.identificador}</td>
            <td>${disp.nome}</td>
            <td style="color: ${corLuz}; font-weight: bold;">${disp.luz?.estado ? "Ligada" : "Desligada"}</td>
            <td style="color: ${corAr}; font-weight: bold;">${disp.ar?.estado ? "Ligado" : "Desligado"}</td>
            <td>${disp.ar?.temperatura ?? "--"}°C</td>
            ${tipoUsuario === "1" ? `<td><button class="deletar-btn" data-id="${disp.identificador}">🗑️</button></td>` : ""}
        `;

        tr.onclick = (e) => {
            if (!e.target.classList.contains('deletar-btn')) {
                localStorage.setItem("dispositivoIdParaRegistro", disp.identificador);
                window.location.href = "registro.html";
            }
        };

        corpoTabela.appendChild(tr);
    });

    configurarBotoesDeletar();
}

function configurarBotoesDeletar() {
    document.querySelectorAll(".deletar-btn").forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            if (confirm(`Excluir a sala ${id}?`)) {
                await fetch(`${API_URL}/dispositivos/${id}`, { method: 'DELETE' });
                carregarDispositivos();
            }
        };
    });
}

carregarDispositivos();
setInterval(carregarDispositivos, 10000);
window.addEventListener('focus', carregarDispositivos);