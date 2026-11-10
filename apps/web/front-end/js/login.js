/* =================================================================
   LOGIN ADM - VOYAGE
   Supabase + Criptografia (Web Crypto) + Mostrar/Ocultar senha
   ================================================================= */

const CONFIG = {
    MIN_SENHA: 6,
    MIN_NOME: 3,
    CODIGO_ADM: 'VOYAGE2026',
    STORAGE_EMAIL_KEY: 'voyage_login_email',
    STORAGE_ADMIN_KEY: 'voyage_admin',
    TOAST_DURATION: 3500
};

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =================================================================
   CRIPTOGRAFIA (SHA-256)
   ================================================================= */

async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function compararSenha(senhaDigitada, hashSalvo) {
    const hashDigitado = await hashSenha(senhaDigitada);
    return hashDigitado === hashSalvo;
}

/* =================================================================
   ELEMENTOS
   ================================================================= */

const els = {
    cardLogin: document.getElementById('cardLogin'),
    cardRegister: document.getElementById('cardRegister'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    goToRegister: document.getElementById('goToRegister'),
    goToLogin: document.getElementById('goToLogin'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    rememberMe: document.getElementById('rememberMe'),
    forgotPassword: document.getElementById('forgotPassword'),
    regNome: document.getElementById('regNome'),
    regEmail: document.getElementById('regEmail'),
    regCodigo: document.getElementById('regCodigo'),
    regSenha: document.getElementById('regSenha'),
    regConfirmaSenha: document.getElementById('regConfirmaSenha'),
    aceitoTermos: document.getElementById('aceitoTermos'),
    toast: document.getElementById('toast')
};

/* =================================================================
   TOAST
   ================================================================= */

function mostrarToast(msg, tipo = 'success') {
    if (!els.toast) return;
    const icones = { success: '✅ ', error: '⚠️ ', info: 'ℹ️ ' };
    els.toast.innerHTML = (icones[tipo] || '') + msg;
    els.toast.className = `toast show ${tipo}`;
    clearTimeout(els.toast._timer);
    els.toast._timer = setTimeout(() => {
        els.toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

/* =================================================================
   TROCA DE CARD
   ================================================================= */

function mostrarLogin(event) {
    if (event) event.preventDefault();
    els.cardRegister.classList.remove('active');
    els.cardRegister.classList.add('hidden');
    setTimeout(() => {
        els.cardLogin.classList.remove('hidden');
        els.cardLogin.classList.add('active');
        setTimeout(() => els.loginEmail && els.loginEmail.focus(), 300);
    }, 200);
}

function mostrarRegistro(event) {
    if (event) event.preventDefault();
    els.cardLogin.classList.remove('active');
    els.cardLogin.classList.add('hidden');
    setTimeout(() => {
        els.cardRegister.classList.remove('hidden');
        els.cardRegister.classList.add('active');
        setTimeout(() => els.regNome && els.regNome.focus(), 300);
    }, 200);
}

/* =================================================================
   VALIDAÇÕES
   ================================================================= */

function validarEmail(email) {
    return REGEX_EMAIL.test(email);
}

function marcarErro(input, mensagem) {
    if (!input) return;
    input.classList.add('input-error');
    input.focus();
    mostrarToast(mensagem, 'error');
    setTimeout(() => input.classList.remove('input-error'), 3000);
}

function limparErros() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function setLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Aguarde...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.original || 'ENVIAR';
    }
}

/* =================================================================
   LOGIN
   ================================================================= */

if (els.loginForm) {
    els.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limparErros();

        const email = els.loginEmail.value.trim();
        const senha = els.loginPassword.value.trim();

        if (!email) return marcarErro(els.loginEmail, 'Digite seu e-mail!');
        if (!validarEmail(email)) return marcarErro(els.loginEmail, 'E-mail inválido!');
        if (!senha) return marcarErro(els.loginPassword, 'Digite sua senha!');
        if (senha.length < CONFIG.MIN_SENHA) {
            return marcarErro(els.loginPassword, `A senha deve ter no mínimo ${CONFIG.MIN_SENHA} caracteres!`);
        }

        if (els.rememberMe && els.rememberMe.checked) {
            localStorage.setItem(CONFIG.STORAGE_EMAIL_KEY, email);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_EMAIL_KEY);
        }

        const btn = e.target.querySelector('.btn-primary');
        setLoading(btn, true);
        mostrarToast('Verificando credenciais...', 'info');

        try {
            const senhaHash = await hashSenha(senha);

            const { data, error } = await supabase.rpc('verificar_login_admin', {
                p_email: email,
                p_senha_hash: senhaHash
            });

            if (error || !data || data.ok !== true) {
                setLoading(btn, false);
                mostrarToast('E-mail ou senha incorretos.', 'error');
                return;
            }

            localStorage.setItem(CONFIG.STORAGE_ADMIN_KEY, JSON.stringify({
                id: data.id,
                nome: data.nome,
                email: data.email
            }));

            setLoading(btn, false);
            mostrarToast('Login realizado com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = './admin.html';
            }, 1000);

        } catch (err) {
            setLoading(btn, false);
            console.error(err);
            mostrarToast('Erro ao conectar com o servidor.', 'error');
        }
    });
}

/* =================================================================
   REGISTRO
   ================================================================= */

if (els.registerForm) {
    els.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limparErros();

        const nome = els.regNome.value.trim();
        const email = els.regEmail.value.trim();
        const codigo = els.regCodigo.value.trim().toUpperCase();
        const senha = els.regSenha.value.trim();
        const confirmaSenha = els.regConfirmaSenha.value.trim();
        const aceito = els.aceitoTermos.checked;

        if (!nome) return marcarErro(els.regNome, 'Digite seu nome!');
        if (nome.length < CONFIG.MIN_NOME) return marcarErro(els.regNome, 'Digite seu nome completo!');
        if (!email) return marcarErro(els.regEmail, 'Digite seu e-mail!');
        if (!validarEmail(email)) return marcarErro(els.regEmail, 'E-mail inválido!');
        if (!codigo) return marcarErro(els.regCodigo, 'Digite o código ADM!');
        if (codigo !== CONFIG.CODIGO_ADM) return marcarErro(els.regCodigo, 'Código ADM inválido!');
        if (!senha) return marcarErro(els.regSenha, 'Digite uma senha!');
        if (senha.length < CONFIG.MIN_SENHA) {
            return marcarErro(els.regSenha, `A senha deve ter no mínimo ${CONFIG.MIN_SENHA} caracteres!`);
        }
        if (senha !== confirmaSenha) {
            return marcarErro(els.regConfirmaSenha, 'As senhas não coincidem!');
        }
        if (!aceito) {
            mostrarToast('Você precisa aceitar os termos!', 'error');
            return;
        }

        const btn = e.target.querySelector('.btn-primary');
        setLoading(btn, true);
        mostrarToast('Criando sua conta ADM...', 'info');

        try {
            const { data: existe } = await supabase
                .from('admins')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existe) {
                setLoading(btn, false);
                mostrarToast('Este e-mail já está cadastrado.', 'error');
                return;
            }

            const senhaHash = await hashSenha(senha);

            const { error } = await supabase
                .from('admins')
                .insert([{
                    nome: nome,
                    email: email,
                    senha_hash: senhaHash
                }]);

            setLoading(btn, false);

            if (error) {
                console.error(error);
                mostrarToast('Erro ao criar conta. Tente novamente.', 'error');
                return;
            }

            mostrarToast('Registro realizado com sucesso! Faça login.', 'success');

            setTimeout(() => {
                els.registerForm.reset();
                mostrarLogin();
            }, 1500);

        } catch (err) {
            setLoading(btn, false);
            console.error(err);
            mostrarToast('Erro ao conectar com o servidor.', 'error');
        }
    });
}

/* =================================================================
   EVENTOS
   ================================================================= */

if (els.goToRegister) els.goToRegister.addEventListener('click', mostrarRegistro);
if (els.goToLogin) els.goToLogin.addEventListener('click', mostrarLogin);

function preencherEmailSalvo() {
    const emailSalvo = localStorage.getItem(CONFIG.STORAGE_EMAIL_KEY);
    if (emailSalvo && els.loginEmail) {
        els.loginEmail.value = emailSalvo;
        if (els.rememberMe) els.rememberMe.checked = true;
    }
}

if (els.regCodigo) {
    els.regCodigo.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/\s/g, '');
    });
}

function configurarEnter(inputs, form) {
    if (!form) return;
    inputs.forEach(input => {
        if (!input) return;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                form.requestSubmit();
            }
        });
    });
}

configurarEnter([els.loginEmail, els.loginPassword], els.loginForm);
configurarEnter(
    [els.regNome, els.regEmail, els.regCodigo, els.regSenha, els.regConfirmaSenha],
    els.registerForm
);

if (els.forgotPassword) {
    els.forgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        const email = els.loginEmail.value.trim();
        if (!email || !validarEmail(email)) {
            mostrarToast('Digite um e-mail válido primeiro!', 'error');
            els.loginEmail.focus();
            return;
        }
        mostrarToast(`Link de recuperação enviado para ${email}`, 'success');
    });
}

/* =================================================================
   MOSTRAR / OCULTAR SENHA
   ================================================================= */

function iniciarToggleSenha() {
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');

            if (!input || !icon) {
                console.warn('Input ou ícone não encontrado:', targetId);
                return;
            }

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
                this.setAttribute('aria-label', 'Ocultar senha');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
                this.setAttribute('aria-label', 'Mostrar senha');
            }
        });
    });
}

/* =================================================================
   INICIALIZAÇÃO
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const adminLogado = localStorage.getItem(CONFIG.STORAGE_ADMIN_KEY);
    if (adminLogado) {
        window.location.href = './admin.html';
        return;
    }

    if (els.cardLogin) {
        els.cardLogin.classList.add('active');
        els.cardLogin.classList.remove('hidden');
    }
    if (els.cardRegister) {
        els.cardRegister.classList.remove('active');
        els.cardRegister.classList.add('hidden');
    }

    preencherEmailSalvo();
    iniciarToggleSenha();

    console.log('✅ Login ADM inicializado com sucesso!');
});