import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import GrupoOCIA from './modules/ia.js';
import nodemailer from 'nodemailer';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ===== CONFIGURAÇÃO DE EMAIL =====
let transporter = null;
let emailConfigurado = false;

function configurarEmail() {
    try {
        console.log('📧 Configurando sistema de email...');
        
        const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
        const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = process.env.SMTP_PORT || 587;
        
        if (!emailUser || !emailPass) {
            console.log('⚠️ Credenciais de email não configuradas no .env');
            return false;
        }
        
        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: false,
            auth: {
                user: emailUser,
                pass: emailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        transporter.verify((error, success) => {
            if (error) {
                console.log('❌ Erro na configuração de email:', error.message);
                emailConfigurado = false;
            } else {
                console.log('✅ Email configurado com sucesso!');
                emailConfigurado = true;
            }
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao configurar email:', error.message);
        return false;
    }
}

// Função para enviar email de lead
async function enviarEmailLead(dadosLead) {
    if (!emailConfigurado || !transporter) {
        console.log('⚠️ Email não configurado, salvando lead apenas no log');
        return { success: false, error: 'Email não configurado' };
    }
    
    try {
        const emailDestino = process.env.LEADS_EMAIL || process.env.EMAIL_DESTINO || process.env.EMAIL_COMERCIAL;
        const emailCC = process.env.LEADS_EMAIL_CC || process.env.EMAIL_COMERCIAL_CC;
        const emailFromName = process.env.EMAIL_FROM_NAME || 'Sistema de Leads - Grupo OC';
        const emailSubject = process.env.EMAIL_SUBJECT || 'Novo Lead Capturado - Grupo OC';
        
        if (!emailDestino) {
            throw new Error('Email de destino não configurado');
        }
        
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Novo Lead - Grupo OC</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #495057; }
                .value { background: white; padding: 10px; border-radius: 4px; margin-top: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🎯 Novo Lead Capturado!</h2>
                    <p>Um novo cliente demonstrou interesse nos serviços do Grupo OC</p>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">👤 Nome:</div>
                        <div class="value">${dadosLead.nome || 'Não informado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">📧 Email:</div>
                        <div class="value">${dadosLead.email || 'Não informado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">📱 Telefone:</div>
                        <div class="value">${dadosLead.telefone || 'Não informado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">🏢 Empresa:</div>
                        <div class="value">${dadosLead.empresa || 'Não informado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">💼 Interesse:</div>
                        <div class="value">${dadosLead.interesse || 'Não especificado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">💬 Mensagem:</div>
                        <div class="value">${dadosLead.mensagem || 'Nenhuma mensagem adicional'}</div>
                    </div>
                    <div class="field">
                        <div class="label">📅 Data/Hora:</div>
                        <div class="value">${new Date().toLocaleString('pt-BR')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Este email foi gerado automaticamente pelo sistema de captura de leads do Grupo OC</p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const mailOptions = {
            from: `"${emailFromName}" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
            to: emailDestino,
            cc: emailCC || undefined,
            subject: emailSubject,
            html: htmlTemplate,
            text: `Novo Lead Capturado - Grupo OC

Nome: ${dadosLead.nome || 'Não informado'}
Email: ${dadosLead.email || 'Não informado'}
Telefone: ${dadosLead.telefone || 'Não informado'}
Empresa: ${dadosLead.empresa || 'Não informado'}
Interesse: ${dadosLead.interesse || 'Não especificado'}
Mensagem: ${dadosLead.mensagem || 'Nenhuma mensagem adicional'}
Data/Hora: ${new Date().toLocaleString('pt-BR')}`
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de lead enviado com sucesso:', info.messageId);
        
        return { 
            success: true, 
            messageId: info.messageId,
            destinatario: emailDestino
        };
        
    } catch (error) {
        console.error('❌ Erro ao enviar email de lead:', error.message);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// Configurar email na inicialização
configurarEmail();

// Instância da IA
const ia = new GrupoOCIA();

// Variáveis globais
let dadosEmpresa = null;
let ultimoScraping = null;

// ===== FUNÇÕES DE SCRAPING =====
async function aguardar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function coletarDadosGrupoOC() {
    let browser = null;
    try {
        console.log('🕷️ Iniciando scraping do Grupo OC...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        const dados = {
            empresa: { textosPrincipais: [], diferenciais: [] },
            servicos: { servicos: [], beneficios: [] },
            metadados: {
                dataColeta: new Date().toISOString(),
                fonte: 'scraping-forcado',
                versao: '2.0',
                encoding: 'UTF-8',
                puppeteerVersion: 'corrigido',
                urlPrincipal: 'não coletada',
                urlServicos: 'não coletada'
            }
        };
        
        // Coletar página principal
        try {
            console.log('📄 Coletando página principal...');
            await page.goto('https://grupooc.com.br/', { waitUntil: 'networkidle2', timeout: 30000 });
            await aguardar(3000);
            
            const textosPagina = await page.evaluate(() => {
                const textos = [];
                const elementos = document.querySelectorAll('p, h1, h2, h3, .texto, .descricao, .sobre');
                elementos.forEach(el => {
                    const texto = el.textContent?.trim();
                    if (texto && texto.length > 30 && texto.length < 500) {
                        textos.push(texto);
                    }
                });
                return textos;
            });
            
            dados.empresa.textosPrincipais = textosPagina.slice(0, 10);
            dados.metadados.urlPrincipal = 'https://grupooc.com.br/';
            console.log(`✅ Coletados ${textosPagina.length} textos da página principal`);
            
        } catch (error) {
            console.log('⚠️ Erro na página principal:', error.message);
        }
        
        // Coletar página de serviços
        try {
            console.log('🛠️ Coletando página de serviços...');
            await page.goto('https://grupooc.com.br/nosso-servico/', { waitUntil: 'networkidle2', timeout: 30000 });
            await aguardar(3000);
            
            const servicosPagina = await page.evaluate(() => {
                const servicos = [];
                const elementos = document.querySelectorAll('.servico, .service, h3, h4, .titulo');
                elementos.forEach(el => {
                    const texto = el.textContent?.trim();
                    if (texto && texto.length > 10 && texto.length < 200) {
                        servicos.push({
                            nome: texto,
                            descricao: texto
                        });
                    }
                });
                return servicos;
            });
            
            dados.servicos.servicos = servicosPagina.slice(0, 8);
            dados.metadados.urlServicos = 'https://grupooc.com.br/nosso-servico/';
            console.log(`✅ Coletados ${servicosPagina.length} serviços`);
            
        } catch (error) {
            console.log('⚠️ Erro na página de serviços:', error.message);
        }
        
        return dados;
        
    } catch (error) {
        console.error('❌ Erro no scraping:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// ===== ROTAS DA API =====

// Rota de status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        sistema: {
            versao: '2.0-com-email',
            scraping: {
                ativo: true,
                fonte: 'puppeteer-corrigido'
            },
            ia: ia.getStatus(),
            email: {
                configurado: emailConfigurado,
                transporter: !!transporter
            }
        }
    });
});

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        sistema: {
            versao: '2.0-com-email',
            scraping: 'ativo',
            ia: 'funcionando',
            email: emailConfigurado ? 'configurado' : 'não configurado'
        }
    });
});

// Rota de captura de leads
app.post('/api/capture-lead', async (req, res) => {
    try {
        console.log('📨 NOVA CAPTURA DE LEAD:');
        const dadosLead = req.body;
        
        console.log('• Nome:', dadosLead.nome);
        console.log('• Email:', dadosLead.email);
        console.log('• Telefone:', dadosLead.telefone);
        console.log('• Empresa:', dadosLead.empresa);
        console.log('• Interesse:', dadosLead.interesse);
        
        if (!dadosLead.nome || !dadosLead.email) {
            return res.status(400).json({
                success: false,
                error: 'Nome e email são obrigatórios'
            });
        }
        
        console.log('📧 Enviando email do lead...');
        const resultadoEmail = await enviarEmailLead(dadosLead);
        
        if (resultadoEmail.success) {
            console.log(`✅ Lead enviado por email para: ${resultadoEmail.destinatario}`);
            console.log(`📧 Message ID: ${resultadoEmail.messageId}`);
        } else {
            console.log(`⚠️ Falha no envio do email: ${resultadoEmail.error}`);
        }
        
        const logLead = {
            ...dadosLead,
            timestamp: new Date().toISOString(),
            emailEnviado: resultadoEmail.success,
            messageId: resultadoEmail.messageId || null
        };
        
        const fs = await import('fs');
        const path = await import('path');
        const leadsFile = path.join(process.cwd(), 'server', 'leads.json');
        
        let leads = [];
        try {
            if (fs.existsSync(leadsFile)) {
                const leadsData = fs.readFileSync(leadsFile, 'utf8');
                leads = JSON.parse(leadsData);
            }
        } catch (error) {
            console.log('⚠️ Erro ao ler arquivo de leads, criando novo');
            leads = [];
        }
        
        leads.push(logLead);
        fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2));
        console.log('💾 Lead salvo no arquivo de backup');
        
        res.json({
            success: true,
            message: 'Lead capturado com sucesso!',
            emailEnviado: resultadoEmail.success,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro na captura de lead:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota do chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!dadosEmpresa) {
            console.log('📊 Carregando dados da empresa...');
            dadosEmpresa = await coletarDadosGrupoOC();
            if (dadosEmpresa) {
                ia.carregarDadosEmpresa(dadosEmpresa);
            }
        }
        
        const resultado = await ia.gerarResposta(message, sessionId);
        const deveAbrirFormulario = ia.deveAbrirFormulario(message, resultado.resposta);
        
        res.json({
            success: true,
            reply: resultado.resposta,
            openForm: deveAbrirFormulario,
            debug: {
                fonteResposta: resultado.fonte,
                fonteDados: dadosEmpresa ? 'scraping-forcado' : 'dados-padrao',
                urlsColetadas: {
                    principal: dadosEmpresa?.metadados?.urlPrincipal || 'não coletada',
                    servicos: dadosEmpresa?.metadados?.urlServicos || 'não coletada'
                },
                tokens: resultado.tokens || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Erro no chat:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`�� Email: ${emailConfigurado ? 'Configurado' : 'Não configurado'}`);
    console.log(`�� IA: Inicializada`);
    console.log(`🕷️ Scraping: Ativo`);
});

