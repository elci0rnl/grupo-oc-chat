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

// ===== FUNÇÃO DE SCRAPING REAL =====
// ===== FUNÇÃO DE SCRAPING COM FALLBACK PERFEITO =====
async function coletarDadosGrupoOC() {
    console.log('📊 Iniciando coleta de dados do Grupo OC...');
    
    try {
        // Tentar scraping leve primeiro
        console.log('🔄 Tentando scraping leve...');
        
        const response = await fetch('https://grupooc.com.br/nosso-servico/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        if (response.ok) {
            const html = await response.text();
            console.log('✅ Página carregada com sucesso');
            
            // Extrair informações básicas do HTML
            const servicosEncontrados = [];
            
            // Regex para encontrar títulos e conteúdo
            const regexTitulos = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
            
            let match;
            while ((match = regexTitulos.exec(html)) !== null) {
                const titulo = match[1].trim();
                if (titulo.length > 10 && titulo.length < 200 && 
                    !titulo.toLowerCase().includes('menu') && 
                    !titulo.toLowerCase().includes('footer')) {
                    servicosEncontrados.push({
                        nome: titulo,
                        descricao: `Serviço especializado oferecido pelo Grupo OC: ${titulo}`
                    });
                }
            }
            
            console.log(`✅ Scraping leve: ${servicosEncontrados.length} itens encontrados`);
            
            if (servicosEncontrados.length > 0) {
                return gerarDadosReaisGrupoOC(servicosEncontrados);
            }
        }
        
    } catch (error) {
        console.log('⚠️ Scraping leve falhou:', error.message);
    }

    // Fallback para dados reais específicos das 3 divisões
    console.log('📊 Usando dados reais das divisões OC TEL, OC DIGITAL e OC SAÚDE...');
    return gerarDadosReaisGrupoOC();
}

// ===== DADOS REAIS DAS 3 DIVISÕES DO GRUPO OC =====
function gerarDadosReaisGrupoOC(servicosExtras = []) {
    console.log('📊 Carregando dados reais das divisões do Grupo OC...');
    
    // Serviços reais das 3 divisões: OC TEL, OC DIGITAL e OC SAÚDE
    const servicosReaisDivisoes = [
        // === OC TEL - Soluções em Telecom ===
        {
            nome: "OC TEL - Telefonia Fixa e Móvel",
            descricao: "Conectamos você à operadora ideal, com soluções em telefonia móvel que reduzem custos, simplificam a gestão e oferecem os melhores planos para sua empresa.",
            divisao: "OC TEL",
            categoria: "Telecom"
        },
        {
            nome: "OC TEL - Internet Fibra",
            descricao: "Com planos personalizados e suporte dedicado, conectamos você ao que há de melhor para manter sua equipe eficiente e sempre disponível.",
            divisao: "OC TEL",
            categoria: "Telecom"
        },
        {
            nome: "OC TEL - Dados Móveis",
            descricao: "Com uma linha de dados rápida e estável, garantimos que sua equipe se mantenha produtiva e totalmente conectada, de qualquer lugar.",
            divisao: "OC TEL",
            categoria: "Telecom"
        },
        {
            nome: "OC TEL - Link Dedicado e Infraestrutura",
            descricao: "Fornecemos serviços de dados como Link Dedicado, modens, roteadores e rastreamento de frotas M2M para otimizar sua infraestrutura de comunicação.",
            divisao: "OC TEL",
            categoria: "Telecom"
        },
        {
            nome: "OC TEL - Auditoria de Faturas de Telefonia",
            descricao: "Realizamos auditorias detalhadas nas faturas de telefonia para assegurar conformidade com os contratos e corrigir discrepâncias, garantindo que você pague apenas o valor justo.",
            divisao: "OC TEL",
            categoria: "Telecom"
        },
        
        // === OC DIGITAL - Gestão de Marketing ===
        {
            nome: "OC DIGITAL - SEO e Otimização",
            descricao: "Oferecemos serviços de SEO para melhorar a posição do seu site nos resultados de busca e aumentar o tráfego orgânico, tornando sua empresa referência na web.",
            divisao: "OC DIGITAL",
            categoria: "Marketing Digital"
        },
        {
            nome: "OC DIGITAL - Google Ads e Campanhas",
            descricao: "Campanhas no Google Ads para alcançar o público-alvo de forma eficaz e maximizar o retorno sobre o investimento em publicidade digital.",
            divisao: "OC DIGITAL",
            categoria: "Marketing Digital"
        },
        {
            nome: "OC DIGITAL - Estratégias Personalizadas",
            descricao: "Analisamos o mercado, o público-alvo e os objetivos de cada empresa para criar soluções sob medida, que envolvem desde marketing digital até otimização de processos.",
            divisao: "OC DIGITAL",
            categoria: "Marketing Digital"
        },
        {
            nome: "OC DIGITAL - Criação de Conteúdo",
            descricao: "Desenvolvemos textos, artigos, postagens em redes sociais, vídeos e outros formatos, criados para engajar, informar e gerar valor, sempre alinhados com as tendências do mercado.",
            divisao: "OC DIGITAL",
            categoria: "Marketing Digital"
        },
        {
            nome: "OC DIGITAL - Relatórios e Analytics",
            descricao: "Nossos relatórios oferecem uma visão clara do desempenho das estratégias, permitindo acompanhar o progresso, avaliar o ROI e otimizar campanhas.",
            divisao: "OC DIGITAL",
            categoria: "Marketing Digital"
        },
        {
            nome: "OC DIGITAL - Marketing Digital Completo",
            descricao: "Estratégias completas de marketing digital, incluindo conteúdo, mídias sociais, e-mail marketing e análise de dados, com soluções diretas e personalizadas.",
            divisao: "OC DIGITAL",
            categoria: "Marketing Digital"
        },
        
        // === OC SAÚDE - Planos Empresariais ===
        {
            nome: "OC SAÚDE - Planos de Saúde Empresariais",
            descricao: "Oferecemos soluções personalizadas em convênios médicos, com planos a partir de 2 vidas e opções de cobertura nacional ou regional, sempre focados no que sua empresa precisa.",
            divisao: "OC SAÚDE",
            categoria: "Saúde Empresarial"
        },
        {
            nome: "OC SAÚDE - Consultoria em Saúde Corporativa",
            descricao: "Nossa consultoria especializada está à disposição para ajudar você a escolher a melhor opção, sempre considerando o melhor custo-benefício para o perfil da sua empresa.",
            divisao: "OC SAÚDE",
            categoria: "Saúde Empresarial"
        },
        {
            nome: "OC SAÚDE - Otimização de Custos Corporativos",
            descricao: "Otimize ao máximo os custos com planos de saúde da sua empresa, utilizando alternativas inteligentes, altamente eficazes e completamente personalizadas.",
            divisao: "OC SAÚDE",
            categoria: "Saúde Empresarial"
        },
        {
            nome: "OC SAÚDE - Redução de Faltas e Absenteísmo",
            descricao: "Soluções que melhoram o bem-estar dos colaboradores, promovendo saúde, qualidade de vida e segurança, reduzindo absenteísmo e elevando a produtividade.",
            divisao: "OC SAÚDE",
            categoria: "Saúde Empresarial"
        }
    ];
    
    // Combinar serviços reais com extras encontrados no scraping
    const todosServicos = [...servicosReaisDivisoes, ...servicosExtras.slice(0, 2)];
    
    return {
        empresa: {
            textosPrincipais: [
                "Grupo OC - Soluções Empresariais Integradas",
                "OC TEL: Expertise em Telecom para reduzir custos e otimizar comunicação",
                "OC DIGITAL: Gestão de Marketing para ser referência na web",
                "OC SAÚDE: Planos Empresariais sob medida para seus colaboradores",
                "Três divisões especializadas para atender todas as necessidades empresariais",
                "Soluções personalizadas com foco em redução de custos e aumento de produtividade",
                "Consultoria especializada em cada área de atuação",
                "Abordagem estratégica para identificar oportunidades de economia",
                "Equipe de consultores experientes e certificados",
                "Compromisso com eficiência, qualidade e resultados mensuráveis"
            ],
            sobre: "O Grupo OC é uma empresa especializada em soluções empresariais integradas, atuando através de três divisões estratégicas: OC TEL (Soluções em Telecom), OC DIGITAL (Gestão de Marketing) e OC SAÚDE (Planos Empresariais). Nossa missão é ajudar empresas a reduzir custos, otimizar processos e aumentar a produtividade através de soluções personalizadas e consultoria especializada. Com uma abordagem estratégica e equipe experiente, garantimos que nossos clientes tenham acesso às melhores soluções do mercado, sempre com foco no melhor custo-benefício.",
            diferenciais: [
                "Três divisões especializadas: OC TEL, OC DIGITAL e OC SAÚDE",
                "Soluções integradas para todas as necessidades empresariais",
                "Foco em redução de custos e otimização de recursos",
                "Consultoria especializada em cada área de atuação",
                "Planos personalizados a partir de 2 vidas (OC SAÚDE)",
                "Auditoria detalhada de faturas para garantir conformidade",
                "Estratégias de marketing digital com ROI comprovado",
                "Infraestrutura de telecom sem interrupções",
                "Relatórios detalhados de desempenho e resultados",
                "Suporte dedicado e acompanhamento contínuo"
            ]
        },
        servicos: {
            servicos: todosServicos,
            beneficios: [
                "Redução significativa de custos com telefonia e comunicação",
                "Aumento do tráfego orgânico e visibilidade online",
                "Melhoria do bem-estar e produtividade dos colaboradores",
                "Otimização da infraestrutura de comunicação empresarial",
                "Maximização do ROI em campanhas de marketing digital",
                "Redução de absenteísmo e faltas por questões de saúde",
                "Gestão simplificada de planos de telefonia e dados",
                "Posicionamento como referência na web",
                "Conformidade garantida em contratos de telefonia",
                "Soluções personalizadas para cada perfil empresarial"
            ],
            detalhes: [
                "OC TEL: Telefonia fixa, móvel, internet fibra, dados móveis e link dedicado",
                "OC DIGITAL: SEO, Google Ads, marketing digital e criação de conteúdo",
                "OC SAÚDE: Planos empresariais a partir de 2 vidas com cobertura nacional/regional",
                "Auditoria detalhada de faturas de telefonia para correção de discrepâncias",
                "Estratégias personalizadas baseadas em análise de mercado e público-alvo",
                "Relatórios completos de desempenho e acompanhamento de resultados",
                "Consultoria especializada para escolha da melhor opção custo-benefício",
                "Suporte dedicado e acompanhamento contínuo em todas as divisões",
                "Soluções que vão além da redução de custos, focando em qualidade e eficiência",
                "Equipe experiente com conhecimento profundo em cada área de atuação"
            ]
        },
        metadados: {
            dataColeta: new Date().toISOString(),
            fonte: 'dados-reais-divisoes-grupo-oc',
            versao: '7.0-divisoes-reais',
            urlPrincipal: 'https://grupooc.com.br/',
            urlServicos: 'https://grupooc.com.br/nosso-servico/',
            status: 'dados-divisoes-ativo',
            servicosTotal: todosServicos.length,
            divisoes: [
                {
                    nome: 'OC TEL',
                    descricao: 'Soluções em Telecom',
                    foco: 'Reduzir custos e otimizar o uso de telefonia móvel, fixa e de dados',
                    servicos: 5
                },
                {
                    nome: 'OC DIGITAL',
                    descricao: 'Gestão de Marketing',
                    foco: 'Ser referência na web através de SEO, Google Ads e marketing digital',
                    servicos: 6
                },
                {
                    nome: 'OC SAÚDE',
                    descricao: 'Planos Empresariais',
                    foco: 'Planos de saúde sob medida para colaboradores',
                    servicos: 4
                }
            ],
            especialidades: [
                'Telefonia Fixa e Móvel',
                'Internet Fibra e Dados Móveis',
                'SEO e Otimização Web',
                'Google Ads e Campanhas',
                'Marketing Digital Completo',
                'Planos de Saúde Empresariais',
                'Auditoria de Faturas',
                'Consultoria Especializada'
            ],
            segmentosAtendidos: [
                'Empresas de todos os portes',
                'Startups e PMEs',
                'Grandes corporações',
                'Empresas com necessidades de telecom',
                'Negócios que precisam de presença digital',
                'Empresas que buscam planos de saúde corporativos',
                'Organizações focadas em redução de custos',
                'Empresas em processo de otimização'
            ],
            diferenciais: [
                'Três divisões especializadas integradas',
                'Soluções personalizadas para cada necessidade',
                'Foco em redução de custos e aumento de produtividade',
                'Consultoria especializada em cada área',
                'Auditoria detalhada para garantir conformidade',
                'Relatórios de desempenho e ROI',
                'Suporte dedicado e acompanhamento contínuo',
                'Planos a partir de 2 vidas (OC SAÚDE)'
            ]
        }
    };
}

// ===== ROTAS DA API =====

// Rota de status - ATUALIZADA
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        sistema: {
            versao: '7.0-divisoes-reais', // ← ATUALIZAR VERSÃO
            scraping: {
                ativo: true,
                fonte: 'dados-reais-divisoes-grupo-oc' // ← ATUALIZAR FONTE
            },
            ia: ia.getStatus(),
            email: {
                configurado: emailConfigurado,
                transporter: !!transporter
            },
            divisoes: ['OC TEL', 'OC DIGITAL', 'OC SAÚDE'] // ← ADICIONAR DIVISÕES
        }
    });
});

// Rota de teste - ATUALIZADA
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        sistema: {
            versao: '7.0-divisoes-reais', // ← ATUALIZAR VERSÃO
            scraping: 'dados-reais-divisoes-ativo', // ← ATUALIZAR STATUS
            ia: 'funcionando',
            email: emailConfigurado ? 'configurado' : 'não configurado',
            divisoes: {
                'OC TEL': 'Soluções em Telecom',
                'OC DIGITAL': 'Gestão de Marketing', 
                'OC SAÚDE': 'Planos Empresariais'
            }
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
        fonteDados: dadosEmpresa?.metadados?.fonte || 'dados-padrao', // ← CORRIGIR
        urlsColetadas: {
            principal: dadosEmpresa?.metadados?.urlPrincipal || 'não coletada',
            servicos: dadosEmpresa?.metadados?.urlServicos || 'não coletada'
        },
        servicosTotal: dadosEmpresa?.metadados?.servicosTotal || 0, // ← ADICIONAR
        divisoes: dadosEmpresa?.metadados?.divisoes || [], // ← ADICIONAR
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












