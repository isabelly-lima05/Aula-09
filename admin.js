/**
 * ARQUIVO MODELO PARA AULA: admin.js - VERSÃO FINAL
 * OBJETIVO: CRUD completo consumindo a API de Charadas.
 */

// ==========================================
// CONFIGURAÇÕES GERAIS DA API
// ==========================================

// 🎯 [PASSO 1: Lacuna de Rota Base]
const API_BASE_URL = 'https://api-charadas-3mpu.vercel.app'; 

// ==========================================
// REFERÊNCIAS DO DOM
// ==========================================
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');
const userInfo = document.getElementById('userInfo');
const loginError = document.getElementById('loginError');

const charadaForm = document.getElementById('charadaForm');
const tabelaCharadas = document.getElementById('tabelaCharadas');
const totalCharadasEl = document.getElementById('totalCharadas');
const btnCancelar = document.getElementById('btnCancelar');
const formTitle = document.getElementById('formTitle');

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================
let tokenAtual = localStorage.getItem('adminToken') || null;
let charadas = [];

function iniciarApp() {
    if (tokenAtual) {
        mostrarPainelAdmin();
        carregarCharadas();
    } else {
        mostrarLogin();
    }
}

// ==========================================
// 1. AUTENTICAÇÃO (Login / Logout)
// ==========================================

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    try {
        // 🎯 [PASSO 2: Lacuna de Rota da API e Dados JSON]
        const resposta = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            // Enviando as chaves exatas que o backend espera
            body: JSON.stringify({ usuario: usuario, senha: password }) 
        });

        if (resposta.ok) {
            const dados = await resposta.json(); 
            
            tokenAtual = dados.token;

            // 🎯 [PASSO 3: Lacuna do Storage do Navegador]
            // Armazena o token para persistência entre sessões
            localStorage.setItem('adminToken', tokenAtual); 
            
            loginForm.reset(); 
            mostrarPainelAdmin();
            carregarCharadas(); 
        } else {
            loginError.classList.remove('hidden');
        }
    } catch (erro) {
        console.error("Erro:", erro);
        alert("Não foi possível conectar.");
    }
});

btnLogout.addEventListener('click', () => {
    tokenAtual = null;
    localStorage.removeItem('adminToken');
    mostrarLogin(); 
});


// ==========================================
// 2. CRUD: READ (Carregar lista de charadas)
// ==========================================
async function carregarCharadas() {
    try {
        // 🎯 [PASSO 4: Lacuna da Rota Privada]
        const resposta = await fetch(`${API_BASE_URL}/charadas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        if (resposta.status === 401 || resposta.status === 403) {
            alert("Sua sessão expirou ou token inválido.");
            btnLogout.click();
            return;
        }

        if (resposta.ok) {
            charadas = await resposta.json(); 
            renderizarTabela(); 
        } else {
            console.error("Falha ao buscar as charadas.");
        }
    } catch (erro) {
        console.error("Erro:", erro);
    }
}

function renderizarTabela() {
    tabelaCharadas.innerHTML = ''; 
    totalCharadasEl.textContent = charadas.length;

    charadas.forEach(charada => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-normal text-sm text-white-800">${charada.pergunta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white-600 font-medium">${charada.resposta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editarCharada('${charada.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                <button onclick="deletarCharada('${charada.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
            </td>
        `;
        tabelaCharadas.appendChild(tr);
    });
}

// ==========================================
// 3. CRUD: CREATE e UPDATE
// ==========================================
charadaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('charadaId').value;
    const pergunta = document.getElementById('pergunta').value;
    const resposta = document.getElementById('resposta').value;

    const charadaData = { pergunta, resposta };

    try {
        let url = `${API_BASE_URL}/charadas`;
        let metodoHTTP = 'POST'; 

        if (id) {
            url = `${API_BASE_URL}/charadas/${id}`;
            metodoHTTP = 'PUT'; 
        }

        const respostaApi = await fetch(url, {
            method: metodoHTTP,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenAtual}` 
            },
            body: JSON.stringify(charadaData)
        });

        if (respostaApi.ok) {
            alert(id ? "Charada atualizada!" : "Charada criada com sucesso!");
            limparFormulario();
            carregarCharadas(); 
        } else {
            alert("Falha ao salvar a charada.");
        }
    } catch (erro) {
        console.error("Erro:", erro);
    }
});

function editarCharada(id) {
    const charada = charadas.find(c => String(c.id) === String(id)); 
    
    if (charada) {
        document.getElementById('charadaId').value = charada.id;
        document.getElementById('pergunta').value = charada.pergunta;
        document.getElementById('resposta').value = charada.resposta;

        formTitle.textContent = "Editar Charada";
        btnCancelar.classList.remove('hidden');
    }
}

btnCancelar.addEventListener('click', limparFormulario);

function limparFormulario() {
    charadaForm.reset();
    document.getElementById('charadaId').value = '';
    formTitle.textContent = "Nova Charada";
    btnCancelar.classList.add('hidden');
}


// ==========================================
// 4. CRUD: DELETE
// ==========================================
async function deletarCharada(id) {
    if (!confirm("Tem certeza que deseja excluir esta charada?")) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        if (resposta.ok) {
            carregarCharadas(); 
        } else {
            alert("Falha ao excluir a charada.");
        }
    } catch (erro) {
        console.error("Erro ao excluir:", erro);
    }
}


// ==========================================
// CONTROLE DE TELA
// ==========================================
function mostrarLogin() {
    loginSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    userInfo.classList.add('hidden');
    loginError.classList.add('hidden');
}

function mostrarPainelAdmin() {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
}

// Inicializa o sistema
iniciarApp();