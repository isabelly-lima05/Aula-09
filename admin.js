// ==========================================
// 1. CONFIGURAÇÕES E ENDPOINTS
// ==========================================

// Aqui definimos o endereço "raiz" do servidor. 
// Usar uma constante evita que você precise mudar o link em 10 lugares diferentes caso o servidor mude.
const API_BASE_URL = 'https://api-charadas-3mpu.vercel.app'; 

// ==========================================
// 2. MAPEAMENTO DO HTML (DOM)
// ==========================================

// Selecionamos as seções (divs) que funcionam como "páginas" dentro do seu site.
const loginSection = document.getElementById('loginSection'); // Tela de entrada
const adminSection = document.getElementById('adminSection'); // Painel principal

// Capturamos os elementos do formulário de login para monitorar o acesso.
const loginForm = document.getElementById('loginForm'); // O formulário em si
const btnLogout = document.getElementById('btnLogout'); // Botão de sair
const userInfo = document.getElementById('userInfo'); // Elemento que exibe o nome do admin
const loginError = document.getElementById('loginError'); // Texto vermelho de "Erro de login"

// Capturamos os elementos que gerenciam as charadas (CRUD).
const charadaForm = document.getElementById('charadaForm'); // Formulário de criar/editar
const tabelaCharadas = document.getElementById('tabelaCharadas'); // Onde os dados aparecem
const totalCharadasEl = document.getElementById('totalCharadas'); // O contador no topo da página
const btnCancelar = document.getElementById('btnCancelar'); // Botão para desistir de uma edição
const formTitle = document.getElementById('formTitle'); // O título que muda conforme a ação

// ==========================================
// 3. GERENCIAMENTO DE ESTADO (MEMÓRIA)
// ==========================================

// O 'tokenAtual' é a chave de segurança. 
// O comando 'localStorage.getItem' verifica se o usuário já logou anteriormente para não pedir senha de novo no F5.
let tokenAtual = localStorage.getItem('adminToken') || null;

// Criamos uma lista (array) vazia para guardar as charadas que o servidor nos enviar.
let charadas = [];

// Esta função é o "motor de partida". Ela decide se o usuário vê a tela de login ou os dados.
function iniciarApp() {
    if (tokenAtual) {
        // Se temos um token, mostramos o painel e baixamos as charadas do banco.
        mostrarPainelAdmin();
        carregarCharadas();
    } else {
        // Se não temos token, mostramos a tela de login obrigatória.
        mostrarLogin();
    }
}

// ==========================================
// 4. SISTEMA DE SEGURANÇA (LOGIN)
// ==========================================

// Ficamos "ouvindo" o momento em que o usuário clica no botão de entrar.
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Comando essencial: impede que a página recarregue e limpe os campos.
    
    // Pegamos os valores digitados nos inputs de usuário e senha.
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    try {
        // Fazemos uma chamada "POST" para enviar os dados sensíveis ao servidor.
        const resposta = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, // Avisamos que estamos enviando um objeto JSON.
            body: JSON.stringify({ usuario: usuario, senha: password }) // Transformamos o objeto em texto.
        });

        // 🛡️ EXPLICAÇÃO DA CORREÇÃO:
        // O comando 'resposta.ok' verifica se o servidor retornou sucesso (status entre 200 e 299).
        if (resposta.ok) {
            const dados = await resposta.json(); // Se deu certo, extraímos o Token do JSON de resposta.
            
            tokenAtual = dados.token; // Salvamos o token na memória do código.
            localStorage.setItem('adminToken', tokenAtual); // Salvamos o token no "HD" do navegador.
            
            loginError.classList.add('hidden'); // Escondemos qualquer erro de tentativas passadas.
            loginForm.reset(); // Limpamos os campos de texto do formulário.
            mostrarPainelAdmin(); // Trocamos a tela para o painel de controle.
            carregarCharadas(); // Iniciamos a busca pelas charadas cadastradas.
        } else {
            // Se o servidor disser que a senha está errada (Status 401 ou 404), entramos aqui.
            loginError.classList.remove('hidden'); // Mostramos a mensagem de erro para o usuário.
            // O código para aqui. O usuário não entra no painel se o login falhar.
        }
    } catch (erro) {
        // Este bloco lida com erros de rede (ex: servidor fora do ar ou sem internet).
        console.error("Erro fatal de conexão:", erro);
        alert("Não foi possível alcançar o servidor. Tente novamente mais tarde.");
    }
});

// O Logout limpa as credenciais e reinicia a visão do app.
btnLogout.addEventListener('click', () => {
    tokenAtual = null; // Apaga o token da memória.
    localStorage.removeItem('adminToken'); // Apaga o token do navegador.
    mostrarLogin(); // Volta para a estaca zero.
});

// ==========================================
// 5. OPERAÇÃO: BUSCAR DADOS (READ)
// ==========================================

// Função que solicita a lista de charadas para o servidor.
async function carregarCharadas() {
    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas`, {
            method: 'GET', // Método padrão para buscar informações.
            headers: {
                // Enviamos o token no cabeçalho 'Authorization' para provar que somos admin.
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        // Caso o token seja antigo ou falso, o servidor retorna 401 (Não autorizado).
        if (resposta.status === 401 || resposta.status === 403) {
            alert("Sua sessão expirou por segurança. Faça login novamente.");
            btnLogout.click(); // Chamamos o logout automaticamente.
            return;
        }

        if (resposta.ok) {
            charadas = await resposta.json(); // Salvamos a lista vinda da API na nossa variável local.
            renderizarTabela(); // Chamamos a função que desenha os itens na tela.
        }
    } catch (erro) {
        console.error("Erro ao carregar a lista:", erro);
    }
}

// Transforma os dados em código HTML dentro da tabela.
function renderizarTabela() {
    tabelaCharadas.innerHTML = ''; // Limpamos a tabela para não repetir itens antigos.
    totalCharadasEl.textContent = charadas.length; // Atualizamos o número total no topo.

    // Para cada charada que recebemos, criamos uma nova linha na tabela.
    charadas.forEach(charada => {
        const tr = document.createElement('tr'); // Cria o elemento <tr>.
        // Inserimos as colunas com a pergunta, resposta e os botões de ação.
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-white-800">${charada.pergunta}</td>
            <td class="px-6 py-4 text-sm text-white-600 font-medium">${charada.resposta}</td>
            <td class="px-6 py-4 text-right text-sm font-medium">
                <button onclick="editarCharada('${charada.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                <button onclick="deletarCharada('${charada.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
            </td>
        `;
        tabelaCharadas.appendChild(tr); // Adiciona a linha pronta dentro do <tbody>.
    });
}

// ==========================================
// 6. OPERAÇÃO: SALVAR E EDITAR (CREATE/UPDATE)
// ==========================================

// O mesmo formulário lida com dois processos: criar algo novo ou atualizar algo que já existe.
charadaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Verificamos se há um ID escondido no campo 'charadaId'.
    const id = document.getElementById('charadaId').value;
    const pergunta = document.getElementById('pergunta').value;
    const resposta = document.getElementById('resposta').value;
    const charadaData = { pergunta, resposta }; // Montamos o pacote de dados.

    try {
        let url = `${API_BASE_URL}/charadas`; // Endereço padrão para criação.
        let metodoHTTP = 'POST'; // Método padrão para criação.

        // Se o ID existir, significa que clicamos em "Editar" antes de enviar.
        if (id) {
            url = `${API_BASE_URL}/charadas/${id}`; // Mudamos a URL para apontar para a charada específica.
            metodoHTTP = 'PUT'; // O método 'PUT' serve para atualizar dados existentes.
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
            alert(id ? "✅ Charada atualizada com sucesso!" : "✅ Nova charada salva!");
            limparFormulario(); // Limpa o formulário e volta o título para "Nova Charada".
            carregarCharadas(); // Recarrega a tabela para mostrar as mudanças.
        } else {
            alert("Erro ao salvar. Verifique se os campos estão preenchidos.");
        }
    } catch (erro) {
        console.error("Erro na operação de salvar:", erro);
    }
});

// Esta função "prepara" o formulário para edição.
function editarCharada(id) {
    // Busca a charada dentro da nossa lista local usando o ID recebido no clique.
    const charada = charadas.find(c => String(c.id) === String(id)); 
    
    if (charada) {
        // Preenche os inputs do formulário com os dados da charada encontrada.
        document.getElementById('charadaId').value = charada.id; // Preenche o campo oculto.
        document.getElementById('pergunta').value = charada.pergunta;
        document.getElementById('resposta').value = charada.resposta;

        // Ajusta a interface para o modo de edição.
        formTitle.textContent = "Editar Charada"; 
        btnCancelar.classList.remove('hidden'); // Mostra o botão para cancelar a edição.
    }
}

// Função para resetar o formulário ao estado original de criação.
btnCancelar.addEventListener('click', limparFormulario);

function limparFormulario() {
    charadaForm.reset(); // Limpa todos os textos.
    document.getElementById('charadaId').value = ''; // Limpa o ID oculto para não editar por engano.
    formTitle.textContent = "Nova Charada"; // Volta o título original.
    btnCancelar.classList.add('hidden'); // Esconde o botão cancelar.
}

// ==========================================
// 7. OPERAÇÃO: REMOVER (DELETE)
// ==========================================

async function deletarCharada(id) {
    // Pedimos confirmação para que o usuário não apague dados sem querer.
    if (!confirm("⚠️ Tem certeza que deseja apagar esta charada?")) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas/${id}`, {
            method: 'DELETE', // Comando para remover do banco de dados.
            headers: { 'Authorization': `Bearer ${tokenAtual}` }
        });

        if (resposta.ok) {
            carregarCharadas(); // Se apagou na API, recarregamos a nossa lista local.
        } else {
            alert("Falha ao tentar excluir o registro.");
        }
    } catch (erro) {
        console.error("Erro ao deletar:", erro);
    }
}

// ==========================================
// 8. CONTROLE VISUAL (TELAS)
// ==========================================

// Mostra a tela de login e esconde o painel.
function mostrarLogin() {
    loginSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    userInfo.classList.add('hidden');
    loginError.classList.add('hidden');
}

// Mostra o painel e esconde a tela de login.
function mostrarPainelAdmin() {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
}

// Dispara o aplicativo assim que o navegador terminar de ler o arquivo.
iniciarApp();