const id = localStorage.getItem("dispositivoIdParaRegistro");
const API_URL = "https://monitoramento-de-salas.onrender.com";

const popupPower = document.getElementById("popupPower");
const popupTemp = document.getElementById("popupTemperatura");
const inputTemp = document.getElementById("inputTemperatura");
let tipoPendente = "";

async function carregarDados() {
    try {
        const response = await fetch(`${API_URL}/dispositivos/${id}`);
        const disp = await response.json();

        const tabelaAr = document.getElementById("registros-ar");
        tabelaAr.innerHTML = disp.registros?.ar?.length > 0 
            ? [...disp.registros.ar].reverse().slice(0, 15).map((r, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${r.dataHora}</td>
                    <td style="color:${r.estado ? '#00ff00' : '#ff4444'}">${r.estado ? "Ligado" : "Desligado"}</td>
                    <td>${r.temperatura ?? "-"}</td>
                </tr>`).join('')
            : `<tr><td colspan="4">Sem registros.</td></tr>`;

        const tabelaLuz = document.getElementById("registros-luz");
        tabelaLuz.innerHTML = disp.registros?.luz?.length > 0
            ? [...disp.registros.luz].reverse().slice(0, 15).map((r, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${r.dataHora}</td>
                    <td style="color:${r.estado ? '#00ff00' : '#ff4444'}">${r.estado ? "Ligada" : "Desligada"}</td>
                </tr>`).join('')
            : `<tr><td colspan="3">Sem registros.</td></tr>`;

    } catch (err) { console.error("Erro:", err); }
}

document.getElementById("powerArBtn").onclick = () => { tipoPendente = "ar"; popupPower.style.display = "flex"; };
document.getElementById("powerLuzBtn").onclick = () => { tipoPendente = "luz"; popupPower.style.display = "flex"; };

document.getElementById("confirmPower").onclick = async () => {
    const res = await fetch(`${API_URL}/dispositivos/${id}`);
    const disp = await res.json();
    const novoEstado = tipoPendente === 'ar' ? !disp.ar.estado : !disp.luz.estado;

    await fetch(`${API_URL}/dispositivos/${id}/${tipoPendente}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: novoEstado })
    });
    
    popupPower.style.display = "none";
    carregarDados();
};

document.getElementById("temperaturaBtn").onclick = () => { popupTemp.style.display = "flex"; };
document.getElementById("confirmTemperatura").onclick = async () => {
    const temp = Number(inputTemp.value);
    if (temp < 16 || temp > 31) return alert("Valor inválido");

    await fetch(`${API_URL}/dispositivos/${id}/temperatura`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperatura: temp })
    });

    popupTemp.style.display = "none";
    carregarDados();
};

document.getElementById("cancelPower").onclick = () => popupPower.style.display = "none";
document.getElementById("cancelTemperatura").onclick = () => popupTemp.style.display = "none";

carregarDados();
setInterval(carregarDados, 5000);