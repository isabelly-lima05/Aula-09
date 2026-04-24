// ==========================================
// 1. CONFIGURAÇÕES E ENDPOINTS
// ==========================================
const API_BASE_URL = 'https://api-charadas-3mpu.vercel.app'; 

// ==========================================
// 2. MAPEAMENTO DO HTML (DOM)
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
// 3. GERENCIAMENTO DE ESTADO
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
// 4. SISTEMA DE SEGURANÇA (LOGIN)
// ==========================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = loginForm.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Verificando...";

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    try {
        const resposta = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuario, senha: password })
        });

        const dados = await resposta.json();

        if (resposta.ok && dados.token) {
            tokenAtual = dados.token;
            localStorage.setItem('adminToken', tokenAtual);
            
            loginError.classList.add('hidden');
            loginForm.reset();
            mostrarPainelAdmin();
            carregarCharadas();
        } else {
            throw new Error("Credenciais inválidas");
        }
    } catch (erro) {
        tokenAtual = null;
        localStorage.removeItem('adminToken');
        loginError.classList.remove('hidden');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Entrar no Sistema";
    }
});

btnLogout.addEventListener('click', () => {
    tokenAtual = null;
    localStorage.removeItem('adminToken');
    mostrarLogin();
});

// ==========================================
// 5. OPERAÇÕES (CRUD)
// ==========================================

async function carregarCharadas() {
    if (!tokenAtual) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenAtual}` }
        });

        if (resposta.status === 401 || resposta.status === 403) {
            btnLogout.click();
            return;
        }

        if (resposta.ok) {
            charadas = await resposta.json();
            renderizarTabela();
        }
    } catch (erro) {
        console.error("Erro ao carregar lista:", erro);
    }
}

function renderizarTabela() {
    tabelaCharadas.innerHTML = '';
    totalCharadasEl.textContent = charadas.length;

    charadas.forEach(charada => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-800/50 hover:bg-white/[0.02] transition-all";
        tr.innerHTML = `
            <td class="px-4 py-6 text-sm italic text-slate-400 leading-relaxed">${charada.pergunta}</td>
            <td class="px-4 py-6 text-xs font-bold text-yellow-600 uppercase tracking-widest">${charada.resposta}</td>
            <td class="px-4 py-6 text-right">
                <div class="flex justify-end gap-6">
                    <button onclick="editarCharada('${charada.id}')" class="text-slate-400 hover:text-yellow-500 active:scale-95 transition-all p-2">
                        <i class="fas fa-pen text-sm"></i>
                    </button>
                    <button onclick="deletarCharada('${charada.id}')" class="text-slate-400 hover:text-red-500 active:scale-95 transition-all p-2">
                        <i class="fas fa-trash-can text-sm"></i>
                    </button>
                </div>
            </td>
        `;
        tabelaCharadas.appendChild(tr);
    });
}

charadaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('charadaId').value;
    const pergunta = document.getElementById('pergunta').value;
    const resposta = document.getElementById('resposta').value;

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
            body: JSON.stringify({ pergunta, resposta })
        });

        if (respostaApi.ok) {
            limparFormulario();
            carregarCharadas();
        }
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
    }
});

function editarCharada(id) {
    const charada = charadas.find(c => String(c.id) === String(id)); 
    if (charada) {
        document.getElementById('charadaId').value = charada.id;
        document.getElementById('pergunta').value = charada.pergunta;
        document.getElementById('resposta').value = charada.resposta;
        formTitle.textContent = "Editar Enigma"; 
        btnCancelar.classList.remove('hidden');
        document.getElementById('pergunta').focus();
    }
}

async function deletarCharada(id) {
    if (!confirm("Deseja remover este enigma permanentemente?")) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenAtual}` }
        });

        if (resposta.ok) carregarCharadas();
    } catch (erro) {
        console.error("Erro ao deletar:", erro);
    }
}

// ==========================================
// 6. CONTROLE DE INTERFACE
// ==========================================
function limparFormulario() {
    charadaForm.reset();
    document.getElementById('charadaId').value = '';
    formTitle.textContent = "Novo Registro";
    btnCancelar.classList.add('hidden');
}

btnCancelar.addEventListener('click', limparFormulario);

function mostrarLogin() {
    loginSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    userInfo.classList.add('hidden');
}

function mostrarPainelAdmin() {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
}

iniciarApp();