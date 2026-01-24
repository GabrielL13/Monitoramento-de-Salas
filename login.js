document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const matricula = document.getElementById("matricula").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("matricula", data.matricula);
            localStorage.setItem("tipoUsuario", data.tipo);
            window.location.href = "monitoramento.html";
        } else {
            errorMessage.textContent = data.message;
        }
    } catch (error) {
        console.error("Erro ao conectar com a API:", error);
        errorMessage.textContent = "Erro ao conectar com o servidor.";
    }
});