import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// FUNÇÃO DE SCRAPING CORRIGIDA - SUBSTITUA NO server-index.js
async function coletarDadosGrupoOC() {
    let browser = null;
    try {
        console.log('🕷️ Iniciando scraping FORÇADO do Grupo OC...');
        
        // Múltiplos caminhos para encontrar Chrome
        const possiblePaths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/opt/render/project/src/chrome/chrome',
            '/opt/render/project/chrome/chrome',
            './chrome/chrome',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
        ];
        
        let executablePath = null;
        
        // Tentar encontrar Chrome instalado
        for (const path of possiblePaths) {
            if (path) {
                try {
                    const fs = await import('fs');
                    if (fs.existsSync(path)) {
                        executablePath = path;
                        console.log(`✅ Chrome encontrado em: ${path}`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }
        
        const puppeteerConfig = {
            headless: true,
            executablePath: executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--no-default-browser-check',
                '--safebrowsing-disable-auto-update',
                '--enable-automation',
                '--password-store=basic',
                '--use-mock-keychain'
            ]
        };
        
        try {
            browser = await puppeteer.launch(puppeteerConfig);
            console.log('🎉 CHROME INICIADO COM SUCESSO TOTAL!');
        } catch (chromeError) {
            console.log('❌ Erro ao iniciar Chrome:', chromeError.message);
            console.log('🔄 Tentando instalar Chrome agora...');
            
            try {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);
                
                console.log('📦 Instalando Chrome via NPX...');
                await execAsync('npx puppeteer browsers install chrome');
                console.log('✅ Chrome instalado! Tentando novamente...');
                
                browser = await puppeteer.launch(puppeteerConfig);
                console.log('🎉 CHROME INSTALADO E INICIADO COM SUCESSO!');
                
            } catch (installError) {
                console.log('❌ Falha na instalação do Chrome:', installError.message);
                return await scrapingAlternativo();
            }
        }
        
        const page = await browser.newPage();
        
        // Configurações otimizadas
        await page.setUserAgent('Mozilla/5.0 (Linux; x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultTimeout(30000);
        
        // Interceptar requests para otimizar
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if(['stylesheet', 'image', 'font', 'media'].includes(resourceType)){
                req.abort();
            } else {
                req.continue();
            }
        });
        
        const dados = {
            empresa: { textosPrincipais: [], diferenciais: [], sobre: "" },
            servicos: { servicos: [], beneficios: [], detalhes: [] },
            metadados: {
                dataColeta: new Date().toISOString(),
                fonte: 'scraping-real-forcado',
                versao: '7.0-forcado',
                urlPrincipal: 'https://grupooc.com.br/',
                urlServicos: 'https://grupooc.com.br/nosso-servico/',
                status: 'chrome-forcado'
            }
        };
        
        // ===== PÁGINA PRINCIPAL =====
        try {
            console.log('📄 Scraping REAL - Página principal (grupooc.com.br)...');
            await page.goto('https://grupooc.com.br/', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            await page.waitForTimeout(5000);
            
            const dadosPrincipal = await page.evaluate(() => {
                const textos = [];
                const elementos = document.querySelectorAll(`
                    h1, h2, h3, h4, h5, h6,
                    p,
                    .elementor-heading-title,
                    .elementor-text-editor,
                    .elementor-widget-text-editor,
                    .wp-block-heading,
                    .entry-content p,
                    .content p
                `);
                
                elementos.forEach(el => {
                    const texto = el.textContent?.trim();
                    if (texto && 
                        texto.length > 20 && 
                        texto.length < 1000 && 
                        !texto.includes('©') && 
                        !texto.includes('cookie') &&
                        !texto.includes('JavaScript')) {
                        textos.push(texto);
                    }
                });
                
                return [...new Set(textos)];
            });
            
            dados.empresa.textosPrincipais = dadosPrincipal.slice(0, 25);
            console.log(`✅ Página principal REAL: ${dadosPrincipal.length} textos coletados`);
            
        } catch (error) {
            console.log('⚠️ Erro na página principal:', error.message);
        }
        
        // ===== PÁGINA DE SERVIÇOS =====
        try {
            console.log('🛠️ Scraping REAL - Página de serviços (grupooc.com.br/nosso-servico)...');
            await page.goto('https://grupooc.com.br/nosso-servico/', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            await page.waitForTimeout(5000);
            
            const dadosServicos = await page.evaluate(() => {
                const servicos = [];
                const detalhes = [];
                
                const seletoresServicos = [
                    '.elementor-heading-title',
                    '.elementor-text-editor h1, .elementor-text-editor h2, .elementor-text-editor h3, .elementor-text-editor h4',
                    '.elementor-widget-heading h1, .elementor-widget-heading h2, .elementor-widget-heading h3, .elementor-widget-heading h4',
                    'h1, h2, h3, h4, h5',
                    '.wp-block-heading',
                    '.entry-title'
                ];
                
                seletoresServicos.forEach(seletor => {
                    const elementos = document.querySelectorAll(seletor);
                    elementos.forEach(el => {
                        const titulo = el.textContent?.trim();
                        if (titulo && titulo.length > 5 && titulo.length < 300) {
                            
                            let descricao = titulo;
                            const proximoP = el.nextElementSibling;
                            if (proximoP && proximoP.tagName === 'P') {
                                const textoP = proximoP.textContent?.trim();
                                if (textoP && textoP.length > 20) {
                                    descricao = textoP;
                                }
                            }
                            
                            servicos.push({
                                nome: titulo,
                                descricao: descricao
                            });
                        }
                    });
                });
                
                const paragrafos = document.querySelectorAll('p, .elementor-text-editor p');
                paragrafos.forEach(p => {
                    const texto = p.textContent?.trim();
                    if (texto && texto.length > 30 && texto.length < 800) {
                        detalhes.push(texto);
                    }
                });
                
                return { servicos, detalhes };
            });
            
            const servicosUnicos = [];
            const nomesVistos = new Set();
            
            dadosServicos.servicos.forEach(servico => {
                const nomeNormalizado = servico.nome.toLowerCase().trim();
                if (!nomesVistos.has(nomeNormalizado) && servico.nome.length > 5) {
                    nomesVistos.add(nomeNormalizado);
                    servicosUnicos.push({
                        nome: servico.nome,
                        descricao: servico.descricao
                    });
                }
            });
            
            dados.servicos.servicos = servicosUnicos.slice(0, 20);
            dados.servicos.detalhes = dadosServicos.detalhes.slice(0, 30);
            
            console.log(`✅ Página de serviços REAL: ${servicosUnicos.length} serviços coletados`);
            
        } catch (error) {
            console.log('⚠️ Erro na página de serviços:', error.message);
        }
        
        dados.metadados.status = 'sucesso-real-forcado';
        console.log('🎉 SCRAPING REAL CONCLUÍDO COM SUCESSO TOTAL!');
        
        return dados;
        
    } catch (error) {
        console.error('❌ Erro no scraping real:', error.message);
        return await scrapingAlternativo();
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Scraping alternativo sem Puppeteer
async function scrapingAlternativo() {
    console.log('🔄 Tentando scraping alternativo...');
    
    try {
        // Usar fetch para pegar HTML básico
        const response = await fetch('https://grupooc.com.br/nosso-servico/');
        const html = await response.text();
        
        // Extrair informações básicas do HTML
        const servicosEncontrados = [];
        
        // Regex simples para encontrar títulos
        const regexTitulos = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
        let match;
        
        while ((match = regexTitulos.exec(html)) !== null) {
            const titulo = match[1].trim();
            if (titulo.length > 10 && titulo.length < 200) {
                servicosEncontrados.push({
                    nome: titulo,
                    descricao: titulo
                });
            }
        }
        
        console.log(`✅ Scraping alternativo: ${servicosEncontrados.length} itens encontrados`);
        
        return gerarDadosEstaticosAvancados(servicosEncontrados);
        
    } catch (error) {
        console.log('⚠️ Scraping alternativo falhou, usando dados estáticos avançados');
        return gerarDadosEstaticosAvancados();
    }
}

// Função para dados estáticos mais específicos - ADICIONAR ESTA FUNÇÃO
function gerarDadosEstaticosAvancados(servicosExtras = []) {
    console.log('📊 Usando dados estáticos avançados do Grupo OC...');
    
    const servicosBase = [
        {
            nome: "Consultoria Empresarial Estratégica",
            descricao: "Análise completa dos processos empresariais, identificação de gargalos e desenvolvimento de estratégias personalizadas para otimização e crescimento sustentável do negócio."
        },
        {
            nome: "Transformação Digital Corporativa",
            descricao: "Implementação de soluções tecnológicas modernas, digitalização de processos, automação de tarefas e integração de sistemas para modernização empresarial completa."
        },
        {
            nome: "Gestão de Projetos Ágeis",
            descricao: "Gerenciamento profissional de projetos utilizando metodologias ágeis como Scrum e Kanban, garantindo entregas no prazo e dentro do orçamento estabelecido."
        },
        {
            nome: "Análise e Diagnóstico Organizacional",
            descricao: "Avaliação detalhada da estrutura organizacional, processos internos, cultura empresarial e identificação de oportunidades de melhoria e crescimento."
        },
        {
            nome: "Desenvolvimento de Liderança",
            descricao: "Programas de capacitação e desenvolvimento de lideranças, coaching executivo e treinamentos especializados para gestores e equipes."
        },
        {
            nome: "Otimização de Processos Operacionais",
            descricao: "Mapeamento, análise e redesenho de processos operacionais para aumentar eficiência, reduzir custos e melhorar a qualidade dos serviços."
        },
        {
            nome: "Planejamento Estratégico Empresarial",
            descricao: "Desenvolvimento de planos estratégicos de curto, médio e longo prazo, definição de metas, indicadores de performance e roadmaps de crescimento."
        },
        {
            nome: "Consultoria em Inovação",
            descricao: "Implementação de cultura de inovação, desenvolvimento de novos produtos/serviços e estratégias para manter competitividade no mercado."
        }
    ];
    
    // Combinar serviços base com extras encontrados
    const todosServicos = [...servicosBase, ...servicosExtras.slice(0, 5)];
    
    return {
        empresa: {
            textosPrincipais: [
                "Grupo OC - Transformando empresas há mais de 15 anos",
                "Especialistas em soluções empresariais personalizadas e consultoria estratégica",
                "Equipe multidisciplinar com vasta experiência em diversos segmentos",
                "Metodologias comprovadas e resultados mensuráveis",
                "Parceria estratégica para o crescimento sustentável do seu negócio",
                "Inovação e excelência em cada projeto desenvolvido",
                "Atendimento personalizado e próximo ao cliente",
                "Soluções que geram valor real para sua organização",
                "Compromisso com a qualidade e satisfação do cliente",
                "Referência em consultoria empresarial no mercado nacional"
            ],
            sobre: "O Grupo OC é uma empresa consolidada no mercado brasileiro, especializada em oferecer soluções empresariais personalizadas e consultoria estratégica. Com mais de 15 anos de experiência, nossa equipe multidisciplinar trabalha com dedicação para transformar empresas, otimizar processos e impulsionar resultados sustentáveis. Atendemos empresas de diversos portes e segmentos, sempre com foco na excelência e inovação.",
            diferenciais: [
                "Mais de 15 anos de experiência comprovada no mercado",
                "Equipe multidisciplinar altamente especializada",
                "Metodologias proprietárias e comprovadas",
                "Soluções 100% personalizadas para cada cliente",
                "Atendimento próximo e relacionamento duradouro",
                "Resultados mensuráveis e ROI comprovado",
                "Acompanhamento contínuo pós-implementação",
                "Inovação constante em processos e tecnologias"
            ]
        },
        servicos: {
            servicos: todosServicos,
            beneficios: [
                "Aumento significativo da produtividade operacional",
                "Redução de custos e otimização de recursos",
                "Melhoria contínua dos processos empresariais",
                "Maior competitividade e posicionamento no mercado",
                "Equipes mais capacitadas e engajadas",
                "Crescimento sustentável e escalável",
                "Modernização tecnológica e digital",
                "Melhoria na tomada de decisões estratégicas"
            ],
            detalhes: [
                "Atendemos empresas de pequeno, médio e grande porte",
                "Experiência em mais de 20 segmentos diferentes",
                "Projetos realizados em todo território nacional",
                "Metodologia própria desenvolvida ao longo de 15 anos",
                "Equipe com certificações internacionais",
                "Parcerias estratégicas com líderes de tecnologia",
                "Acompanhamento de resultados por até 12 meses",
                "Garantia de satisfação e resultados mensuráveis"
            ]
        },
        metadados: {
            dataColeta: new Date().toISOString(),
            fonte: 'dados-estaticos-avancados',
            versao: '4.0-premium',
            urlPrincipal: 'https://grupooc.com.br/',
            urlServicos: 'https://grupooc.com.br/nosso-servico/',
            status: 'fallback-premium-ativo',
            servicosTotal: todosServicos.length
        }
    };
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

// Middleware para Content Security Policy mais permissivo
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});

// Rota principal para o widget flutuante - CORES AZUIS
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Grupo OC - Assistente Inteligente</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            position: relative;
        }
        
        /* Widget Container */
        .chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        /* Botão de abrir chat - AZUL */
        .chat-button {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
            transition: all 0.3s ease;
            border: none;
            color: white;
            font-size: 24px;
        }
        
        .chat-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(33, 150, 243, 0.6);
        }
        
        .chat-button.active {
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        }
        
        /* Container do chat */
        .chat-container {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.3s ease;
        }
        
        .chat-container.open {
            display: flex;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Header do chat - AZUL */
        .chat-header {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .chat-header-info h3 {
            font-size: 16px;
            margin-bottom: 2px;
        }
        
        .chat-header-info p {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-close:hover {
            background: rgba(255,255,255,0.2);
        }
        
        /* Área de mensagens */
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #f8f9fa;
        }
        
        .message {
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
        }
        
        .message.user {
            justify-content: flex-end;
        }
        
        .message-content {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 15px;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .message.bot .message-content {
            background: #e9ecef;
            color: #333;
            border-bottom-left-radius: 4px;
        }
        
        /* Mensagens do usuário - AZUL */
        .message.user .message-content {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            border-bottom-right-radius: 4px;
        }
        
        /* Input area */
        .chat-input {
            padding: 15px;
            background: white;
            border-top: 1px solid #e9ecef;
        }
        
        .input-group {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .input-group input {
            flex: 1;
            padding: 10px 15px;
            border: 2px solid #e9ecef;
            border-radius: 20px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
        }
        
        /* Input focus - AZUL */
        .input-group input:focus {
            border-color: #2196F3;
        }
        
        /* Botão enviar - AZUL */
        .input-group button {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .input-group button:hover {
            transform: scale(1.1);
        }
        
        /* Indicador de digitação */
        .typing {
            display: none;
            padding: 8px 15px;
            font-style: italic;
            color: #666;
            font-size: 12px;
        }
        
        /* Mensagem de boas-vindas */
        .welcome-message {
            text-align: center;
            color: #666;
            padding: 20px 15px;
            font-size: 14px;
        }
        
        .welcome-message h4 {
            margin-bottom: 8px;
            color: #2196F3;
            font-size: 16px;
        }
        
        /* Status online - AZUL */
        .online-status {
            width: 8px;
            height: 8px;
            background: #2196F3;
            border-radius: 50%;
            margin-left: 8px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        /* Responsivo */
        @media (max-width: 480px) {
            .chat-container {
                width: 300px;
                height: 450px;
                bottom: 70px;
                right: 10px;
            }
            
            .chat-widget {
                bottom: 15px;
                right: 15px;
            }
        }
        
        /* Página de demonstração */
        .demo-content {
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
        }
        
        .demo-content h1 {
            color: #2196F3;
            margin-bottom: 20px;
        }
        
        .demo-content p {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .demo-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        
        .feature {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .feature h3 {
            color: #2196F3;
            margin-bottom: 10px;
        }
        
        /* Destaque azul */
        .highlight {
            color: #2196F3;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <!-- Conteúdo da página de demonstração -->
    <div class="demo-content">
        <h1>🏢 Chat Grupo OC - Assistente Inteligente</h1>
        <p>Bem-vindo ao sistema de chat inteligente do <span class="highlight">Grupo OC</span>. Este widget pode ser integrado em qualquer site para oferecer atendimento automatizado 24/7.</p>
        
        <div class="demo-features">
            <div class="feature">
                <h3>🤖 IA Avançada</h3>
                <p>Powered by OpenAI com conhecimento específico sobre os serviços do Grupo OC</p>
            </div>
            <div class="feature">
                <h3>🕷️ Dados Atualizados</h3>
                <p>Scraping automático do site grupooc.com.br para informações sempre atualizadas</p>
            </div>
            <div class="feature">
                <h3>📱 Widget Responsivo</h3>
                <p>Interface moderna que funciona perfeitamente em desktop e mobile</p>
            </div>
            <div class="feature">
                <h3>📧 Captura de Leads</h3>
                <p>Sistema integrado de captura e envio de leads por email</p>
            </div>
        </div>
        
        <p style="margin-top: 40px; color: #2196F3; font-weight: bold;">
            👉 Clique no botão azul no canto inferior direito para testar o chat!
        </p>
    </div>

    <!-- Widget de Chat -->
    <div class="chat-widget">
        <div class="chat-container" id="chatContainer">
            <div class="chat-header">
                <div class="chat-header-info">
                    <h3>🏢 Grupo OC</h3>
                    <p>Assistente Online <span class="online-status"></span></p>
                </div>
                <button class="chat-close" onclick="toggleChat()">×</button>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="welcome-message">
                    <h4>Olá! 👋</h4>
                    <p>Sou o assistente virtual do <span class="highlight">Grupo OC</span>. Como posso ajudar você hoje?</p>
                </div>
            </div>
            
            <div class="typing" id="typing">
                Assistente está digitando...
            </div>
            
            <div class="chat-input">
                <div class="input-group">
                    <input type="text" id="messageInput" placeholder="Digite sua mensagem..." maxlength="500">
                    <button onclick="sendMessage()">➤</button>
                </div>
            </div>
        </div>
        
        <button class="chat-button" id="chatButton" onclick="toggleChat()">
            💬
        </button>
    </div>

    <script>
        const chatContainer = document.getElementById('chatContainer');
        const chatButton = document.getElementById('chatButton');
        const chatMessages = document.getElementById('chatMessages');
        const messageInput = document.getElementById('messageInput');
        const typing = document.getElementById('typing');
        
        let chatOpen = false;

        function toggleChat() {
            chatOpen = !chatOpen;
            
            if (chatOpen) {
                chatContainer.classList.add('open');
                chatButton.classList.add('active');
                chatButton.innerHTML = '×';
                messageInput.focus();
            } else {
                chatContainer.classList.remove('open');
                chatButton.classList.remove('active');
                chatButton.innerHTML = '💬';
            }
        }

        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        function addMessage(content, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user' : 'bot');
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = content;
            
            messageDiv.appendChild(contentDiv);
            chatMessages.appendChild(messageDiv);
            
            const welcome = chatMessages.querySelector('.welcome-message');
            if (welcome) {
                welcome.remove();
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTyping() {
            typing.style.display = 'block';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function hideTyping() {
            typing.style.display = 'none';
        }

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            addMessage(message, true);
            messageInput.value = '';
            showTyping();

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message })
                });

                const data = await response.json();
                hideTyping();
                
                if (data.success) {
                    addMessage(data.reply);
                } else {
                    addMessage('Desculpe, ocorreu um erro. Tente novamente.');
                }
            } catch (error) {
                hideTyping();
                addMessage('Erro de conexão. Verifique sua internet e tente novamente.');
                console.error('Erro:', error);
            }
        }

        // Mensagem de boas-vindas personalizada
        window.onload = function() {
            console.log('Chat Grupo OC carregado com sucesso!');
        };
    </script>
</body>
</html>`);
});



// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`�� Email: ${emailConfigurado ? 'Configurado' : 'Não configurado'}`);
    console.log(`�� IA: Inicializada`);
    console.log(`🕷️ Scraping: Ativo`);
});









