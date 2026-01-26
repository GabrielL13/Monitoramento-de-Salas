document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const matricula = document.getElementById("matricula").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = "";

    if (!matricula || !password) {
        errorMessage.textContent = "Preencha todos os campos.";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                matricula: matricula, 
                password: password 
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("matricula", data.matricula);
            localStorage.setItem("tipoUsuario", data.tipo);
            window.location.href = "monitoramento.html";
        } else {
            errorMessage.textContent = data.message || "Erro ao realizar login.";
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        errorMessage.textContent = "Não foi possível conectar ao servidor. Verifique se o Node.js está rodando.";
    }
});