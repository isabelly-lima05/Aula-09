/**
 * ==============================================================================
 * SISTEMA DE GERENCIAMENTO DE CHARADAS (ADMIN DASHBOARD)
 * ==============================================================================
 * Este script gerencia toda a lógica de um CRUD (Create, Read, Update, Delete)
 * utilizando persistência de dados em uma API externa e autenticação via Token.
 */

// ==========================================
// CONFIGURAÇÕES GERAIS DA API
// ==========================================

/**
 * 🎯 [PASSO 1: Configuração do Endpoint]
 * Define a URL base para todas as requisições. Centralizar isso facilita
 * a manutenção caso o endereço do servidor mude no futuro.
 */
const API_BASE_URL = 'https://api-charadas-3mpu.vercel.app'; 

// ==========================================
// REFERÊNCIAS DO DOM (Document Object Model)
// ==========================================
// Capturamos os elementos HTML para que o JavaScript possa interagir com eles.

// Seções de visualização (Telas)
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');

// Elementos de Login
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');
const userInfo = document.getElementById('userInfo');
const loginError = document.getElementById('loginError');

// Elementos do CRUD de Charadas
const charadaForm = document.getElementById('charadaForm');
const tabelaCharadas = document.getElementById('tabelaCharadas');
const totalCharadasEl = document.getElementById('totalCharadas');
const btnCancelar = document.getElementById('btnCancelar');
const formTitle = document.getElementById('formTitle');

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================

/**
 * tokenAtual: Armazena o "passaporte" de acesso do usuário. 
 * Tentamos recuperar do localStorage para que o usuário não precise logar novamente ao dar F5.
 */
let tokenAtual = localStorage.getItem('adminToken') || null;

/**
 * charadas: Array global que servirá como nosso "banco de dados local" 
 * sincronizado com o servidor para facilitar a renderização da interface.
 */
let charadas = [];

/**
 * iniciarApp: Função de entrada (Entry Point). 
 * Decide se mostra a tela de login ou carrega os dados com base na existência do token.
 */
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

/**
 * Listener do formulário de login.
 * Intercepta o envio para processar a autenticação via Fetch API.
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página (comportamento padrão do form)
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    try {
        // 🎯 [PASSO 2: Requisição de Autenticação]
        const resposta = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST', // Método POST para enviar dados sensíveis
            headers: {
                'Content-Type': 'application/json' // Avisa a API que estamos enviando um JSON
            },
            // Converte o objeto JS para uma string JSON antes de enviar
            body: JSON.stringify({ usuario: usuario, senha: password }) 
        });

        if (resposta.ok) {
            const dados = await resposta.json(); 
            
            // Extrai o token gerado pelo servidor (geralmente um JWT)
            tokenAtual = dados.token;

            // 🎯 [PASSO 3: Persistência]
            // Salva o token no navegador para manter o login ativo
            localStorage.setItem('adminToken', tokenAtual); 
            
            loginForm.reset();         // Limpa os campos de texto
            mostrarPainelAdmin();     // Troca a interface
            carregarCharadas();       // Busca os dados protegidos
        } else {
            // Se o status for diferente de 200-299, exibe mensagem de erro
            loginError.classList.remove('hidden');
        }
    } catch (erro) {
        console.error("Erro na conexão:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
});

/**
 * Logout: Limpa as credenciais e "reseta" a visão do app.
 */
btnLogout.addEventListener('click', () => {
    tokenAtual = null;
    localStorage.removeItem('adminToken'); // Remove o "passaporte" do storage
    mostrarLogin(); 
});


// ==========================================
// 2. CRUD: READ (Busca e Listagem)
// ==========================================

/**
 * carregarCharadas: Busca a lista de charadas na API.
 * Requer o Token de Autorização no Header.
 */
async function carregarCharadas() {
    try {
        // 🎯 [PASSO 4: Requisição Privada]
        const resposta = await fetch(`${API_BASE_URL}/charadas`, {
            method: 'GET',
            headers: {
                // Padrão Bearer Token: comum em autenticação moderna
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        // Caso o token tenha expirado ou seja inválido
        if (resposta.status === 401 || resposta.status === 403) {
            alert("Sua sessão expirou. Por favor, faça login novamente.");
            btnLogout.click(); // Força o logout
            return;
        }

        if (resposta.ok) {
            charadas = await resposta.json(); 
            renderizarTabela(); // Atualiza o HTML com os novos dados
        } else {
            console.error("Erro ao obter dados da API.");
        }
    } catch (erro) {
        console.error("Erro de rede:", erro);
    }
}

/**
 * renderizarTabela: Transforma o array de objetos em linhas de tabela HTML.
 */
function renderizarTabela() {
    tabelaCharadas.innerHTML = ''; // Limpa a tabela antes de reconstruir
    totalCharadasEl.textContent = charadas.length; // Atualiza o contador no topo

    charadas.forEach(charada => {
        const tr = document.createElement('tr');
        // Usamos Template Literals (``) para criar o HTML de forma legível
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-white-800">${charada.pergunta}</td>
            <td class="px-6 py-4 text-sm text-white-600 font-medium">${charada.resposta}</td>
            <td class="px-6 py-4 text-right text-sm font-medium">
                <button onclick="editarCharada('${charada.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                <button onclick="deletarCharada('${charada.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
            </td>
        `;
        tabelaCharadas.appendChild(tr);
    });
}

// ==========================================
// 3. CRUD: CREATE e UPDATE (Criação e Edição)
// ==========================================

/**
 * O mesmo formulário serve para Criar e para Editar.
 * A diferença é a presença ou ausência de um ID no campo oculto (Hidden Input).
 */
charadaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('charadaId').value;
    const pergunta = document.getElementById('pergunta').value;
    const resposta = document.getElementById('resposta').value;

    const charadaData = { pergunta, resposta };

    try {
        let url = `${API_BASE_URL}/charadas`;
        let metodoHTTP = 'POST'; // Por padrão, assume que é uma nova charada

        // Se existir um ID, mudamos para o modo de Edição
        if (id) {
            url = `${API_BASE_URL}/charadas/${id}`; // URL específica com ID
            metodoHTTP = 'PUT'; // Método para atualização total
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
            alert(id ? "✅ Charada atualizada!" : "✅ Charada criada com sucesso!");
            limparFormulario();
            carregarCharadas(); // Recarrega a lista para mostrar a alteração
        } else {
            alert("❌ Erro ao salvar. Verifique os dados.");
        }
    } catch (erro) {
        console.error("Erro na operação:", erro);
    }
});

/**
 * editarCharada: Preenche o formulário com os dados de uma charada existente.
 */
function editarCharada(id) {
    // Busca o objeto dentro do nosso array local pelo ID
    const charada = charadas.find(c => String(c.id) === String(id)); 
    
    if (charada) {
        // Alimenta os campos do form com os dados da charada selecionada
        document.getElementById('charadaId').value = charada.id;
        document.getElementById('pergunta').value = charada.pergunta;
        document.getElementById('resposta').value = charada.resposta;

        // Muda a interface para indicar o modo de edição
        formTitle.textContent = "Editar Charada";
        btnCancelar.classList.remove('hidden');
    }
}

// Listener para o botão cancelar (limpa a edição e volta para modo criação)
btnCancelar.addEventListener('click', limparFormulario);

function limparFormulario() {
    charadaForm.reset();
    document.getElementById('charadaId').value = ''; // Limpa o ID oculto
    formTitle.textContent = "Nova Charada";
    btnCancelar.classList.add('hidden');
}


// ==========================================
// 4. CRUD: DELETE (Remoção)
// ==========================================

/**
 * deletarCharada: Remove um item permanentemente da API.
 */
async function deletarCharada(id) {
    // Confirmação de segurança para evitar cliques acidentais
    if (!confirm("⚠️ Tem certeza que deseja excluir esta charada permanentemente?")) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas/${id}`, {
            method: 'DELETE', // Método padrão para remoção
            headers: {
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        if (resposta.ok) {
            carregarCharadas(); // Atualiza a lista após excluir
        } else {
            alert("Erro ao tentar excluir o registro.");
        }
    } catch (erro) {
        console.error("Erro na exclusão:", erro);
    }
}


// ==========================================
// CONTROLE DE INTERFACE (Telas)
// ==========================================

/**
 * As funções abaixo alternam a visibilidade dos elementos usando classes CSS
 * (como a classe 'hidden' do Tailwind ou CSS customizado).
 */

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

// Executa a função inicializadora ao carregar o script
iniciarApp();