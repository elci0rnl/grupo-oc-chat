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
// Função para enviar email de lead - ATUALIZADA
async function enviarEmailLead(dadosLead) {
    if (!emailConfigurado || !transporter) {
        console.log('⚠️ Email não configurado, salvando lead apenas no log');
        return { success: false, error: 'Email não configurado' };
    }
    
    try {
        const emailDestino = process.env.LEADS_EMAIL || process.env.EMAIL_DESTINO || process.env.EMAIL_COMERCIAL;
        const emailCC = process.env.LEADS_EMAIL_CC || process.env.EMAIL_COMERCIAL_CC;
        const emailFromName = process.env.EMAIL_FROM_NAME || 'Sistema de Leads - Grupo OC';
        const emailSubject = process.env.EMAIL_SUBJECT || '🎯 Novo Lead Capturado - Chat Widget';
        
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
                .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #495057; }
                .value { background: white; padding: 10px; border-radius: 4px; margin-top: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
                .priority { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🎯 Novo Lead Capturado!</h2>
                    <p>Um novo cliente demonstrou interesse nos serviços do Grupo OC através do Chat Widget</p>
                </div>
                <div class="content">
                    ${dadosLead.interesse ? '<div class="priority"><strong>⚡ INTERESSE ESPECÍFICO:</strong> ' + dadosLead.interesse + '</div>' : ''}
                    
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
                    ${dadosLead.cnpj ? `<div class="field"><div class="label">📄 CNPJ:</div><div class="value">${dadosLead.cnpj}</div></div>` : ''}
                    <div class="field">
                        <div class="label">💼 Principal Interesse:</div>
                        <div class="value">${dadosLead.interesse || 'Não especificado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">💬 Mensagem:</div>
                        <div class="value">${dadosLead.mensagem || 'Nenhuma mensagem adicional'}</div>
                    </div>
                    <div class="field">
                        <div class="label">🌐 Origem:</div>
                        <div class="value">${dadosLead.origem || 'Chat Widget - Grupo OC'}</div>
                    </div>
                    <div class="field">
                        <div class="label">📅 Data/Hora:</div>
                        <div class="value">${new Date().toLocaleString('pt-BR')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Este email foi gerado automaticamente pelo sistema de captura de leads do Grupo OC</p>
                    <p><strong>⚡ AÇÃO REQUERIDA:</strong> Entre em contato com o lead em até 24 horas</p>
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
CNPJ: ${dadosLead.cnpj || 'Não informado'}
Interesse: ${dadosLead.interesse || 'Não especificado'}
Mensagem: ${dadosLead.mensagem || 'Nenhuma mensagem adicional'}
Origem: ${dadosLead.origem || 'Chat Widget'}
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

// ===== SISTEMA AVANÇADO DE CAPTAÇÃO DE LEADS ===== 
// 👆 ADICIONAR AQUI (APÓS A LINHA ultimoScraping)

// Palavras-chave que indicam interesse comercial - EXPANDIDAS
const palavrasChaveInteresse = [
    // Interesse direto
    'quero', 'preciso', 'gostaria', 'interesse', 'contratar', 'solicitar',
    'orçamento', 'proposta', 'cotação', 'valor', 'preço', 'custo',
    'contratar', 'contratação', 'contrato',
    
    // Serviços específicos
    'telefonia', 'internet', 'fibra', 'plano de saúde', 'convênio',
    'seo', 'google ads', 'marketing', 'site', 'digital',
    'telecom', 'comunicação', 'dados móveis',
    
    // Ações comerciais
    'falar com', 'conversar', 'reunião', 'apresentação', 'demonstração',
    'contato', 'ligar', 'whatsapp', 'email', 'vendas',
    'comercial', 'atendimento', 'suporte',
    
    // Urgência
    'urgente', 'rápido', 'hoje', 'agora', 'imediato',
    
    // Decisão
    'decidir', 'escolher', 'comparar', 'avaliar', 'analisar',
    
    // Frases específicas
    'como contratar', 'quero contratar', 'interesse em',
    'preciso de', 'gostaria de', 'como funciona',
    'quanto custa', 'qual o valor', 'como solicitar'
];

// ===== SISTEMA DE DESPEDIDA INTELIGENTE =====

// Palavras-chave que indicam agradecimento
const palavrasAgradecimento = [
    'obrigado', 'obrigada', 'valeu', 'muito obrigado', 'muito obrigada',
    'agradeço', 'grato', 'grata', 'thanks', 'thank you',
    'brigado', 'brigada', 'vlw', 'valeu mesmo'
];

// Palavras-chave que indicam despedida/finalização
const palavrasDespedida = [
    'tchau', 'até logo', 'até mais', 'até breve', 'bye', 'adeus',
    'falou', 'flw', 'até', 'xau', 'tchau tchau', 'até a próxima',
    'era só isso', 'era isso mesmo', 'só isso mesmo', 'era isso',
    'não precisa mais', 'não preciso mais', 'já é suficiente',
    'está bom', 'tá bom', 'ok obrigado', 'beleza obrigado'
];

// Palavras-chave que indicam negação/finalização
const palavrasNegacao = [
    'não', 'nao', 'não preciso', 'não quero', 'não tenho interesse',
    'não é necessário', 'não precisa', 'tá bom assim', 'está bom assim',
    'só isso', 'apenas isso', 'era só isso', 'só queria saber isso'
];

// Respostas para agradecimentos
const respostasAgradecimento = [
    "Por nada! 😊 Posso ajudar em mais alguma coisa?",
    "Fico feliz em ajudar! 🤝 Há algo mais que posso esclarecer?",
    "De nada! 😄 Estou aqui se precisar de mais informações.",
    "Foi um prazer ajudar! 🌟 Tem alguma outra dúvida?",
    "Disponha sempre! 👍 Posso auxiliar em mais algum assunto?"
];

// Respostas para despedidas
const respostasDespedida = [
    "Até logo! 👋 Estou sempre à disposição quando precisar. Tenha um ótimo dia!",
    "Tchau! 😊 Estarei aqui sempre que precisar dos serviços do Grupo OC. Até mais!",
    "Até breve! 🤝 Foi um prazer conversar com você. Conte conosco sempre!",
    "Falou! 👍 Qualquer dúvida sobre nossos serviços, é só chamar. Até logo!",
    "Até a próxima! 🌟 O Grupo OC está sempre pronto para atender você!"
];

// Respostas para negação/finalização
const respostasFinalizacao = [
    "Perfeito! 😊 Estou sempre à disposição quando precisar. O Grupo OC está aqui para ajudar!",
    "Entendi! 👍 Qualquer dúvida sobre nossos serviços, é só me chamar. Tenha um ótimo dia!",
    "Tudo bem! 🤝 Estarei aqui sempre que precisar de informações sobre o Grupo OC.",
    "Certo! 😄 Conte conosco sempre que precisar. Até logo!",
    "Beleza! 🌟 O Grupo OC está sempre pronto para atender você quando precisar!"
];

// Função para detectar tipo de mensagem
function detectarTipoMensagem(mensagem) {
    const textoLimpo = mensagem.toLowerCase().trim();
    console.log('🔍 Analisando tipo de mensagem:', textoLimpo);
    
    // Verificar agradecimento
    const ehAgradecimento = palavrasAgradecimento.some(palavra => 
        textoLimpo.includes(palavra.toLowerCase())
    );
    
    // Verificar despedida
    const ehDespedida = palavrasDespedida.some(palavra => 
        textoLimpo.includes(palavra.toLowerCase())
    );
    
    // Verificar negação/finalização
    const ehNegacao = palavrasNegacao.some(palavra => 
        textoLimpo.includes(palavra.toLowerCase())
    );
    
    // Verificar se é uma resposta curta de finalização
    const ehRespostaCurta = textoLimpo.length <= 15 && (
        textoLimpo.includes('não') || 
        textoLimpo.includes('nao') ||
        textoLimpo === 'ok' ||
        textoLimpo === 'beleza' ||
        textoLimpo === 'certo'
    );
    
    console.log('• Agradecimento:', ehAgradecimento);
    console.log('• Despedida:', ehDespedida);
    console.log('• Negação:', ehNegacao);
    console.log('• Resposta curta:', ehRespostaCurta);
    
    if (ehAgradecimento) return 'agradecimento';
    if (ehDespedida) return 'despedida';
    if (ehNegacao || ehRespostaCurta) return 'finalizacao';
    
    return 'normal';
}

// Função para gerar resposta de despedida
function gerarRespostaDespedida(tipo) {
    let respostas;
    
    switch (tipo) {
        case 'agradecimento':
            respostas = respostasAgradecimento;
            break;
        case 'despedida':
            respostas = respostasDespedida;
            break;
        case 'finalizacao':
            respostas = respostasFinalizacao;
            break;
        default:
            return null;
    }
    
    // Selecionar resposta aleatória
    const indiceAleatorio = Math.floor(Math.random() * respostas.length);
    return respostas[indiceAleatorio];
}

// Função melhorada para detectar interesse - CORRIGIDA PARA EVITAR FALSOS POSITIVOS
function detectarInteresseComercial(mensagemUsuario, respostaIA) {
    console.log('🔍 Analisando interesse comercial...');
    
    const textoCompleto = `${mensagemUsuario} ${respostaIA}`.toLowerCase();
    console.log('• Texto para análise:', textoCompleto.substring(0, 200) + '...');
    
    // Verificar palavras-chave de interesse APENAS na mensagem do usuário
    const mensagemLimpa = mensagemUsuario.toLowerCase();
    const palavrasEncontradas = [];
    const temPalavraChave = palavrasChaveInteresse.some(palavra => {
        const encontrou = mensagemLimpa.includes(palavra.toLowerCase());
        if (encontrou) {
            palavrasEncontradas.push(palavra);
        }
        return encontrou;
    });
    
    console.log('• Palavras-chave encontradas:', palavrasEncontradas);
    
    // Verificar se o USUÁRIO mencionou serviços específicos
    const servicosEncontrados = [];
    const mencionouServicos = ['telefonia', 'marketing', 'plano de saúde', 'seo', 'google ads'].some(servico => {
        const encontrou = mensagemLimpa.includes(servico);
        if (encontrou) {
            servicosEncontrados.push(servico);
        }
        return encontrou;
    });
    
    console.log('• Serviços mencionados pelo usuário:', servicosEncontrados);
    
    // Verificar se é uma pergunta sobre como contratar (APENAS do usuário)
    const perguntaContratacao = (mensagemLimpa.includes('como') && 
                               (mensagemLimpa.includes('contratar') || 
                                mensagemLimpa.includes('solicitar') ||
                                mensagemLimpa.includes('começar'))) ||
                               mensagemLimpa.includes('quero contratar') ||
                               mensagemLimpa.includes('interesse em') ||
                               mensagemLimpa.includes('preciso de') ||
                               mensagemLimpa.includes('gostaria de');
    
    console.log('• Pergunta sobre contratação:', perguntaContratacao);
    
    // EVITAR falsos positivos em saudações
    const ehSaudacao = mensagemLimpa.length < 20 && (
        mensagemLimpa.includes('olá') ||
        mensagemLimpa.includes('oi') ||
        mensagemLimpa.includes('bom dia') ||
        mensagemLimpa.includes('boa tarde') ||
        mensagemLimpa.includes('boa noite')
    );
    
    console.log('• É saudação simples:', ehSaudacao);
    
    // Só abrir formulário se NÃO for saudação E tiver interesse real
    const resultado = !ehSaudacao && (temPalavraChave || mencionouServicos || perguntaContratacao);
    console.log('• RESULTADO FINAL - Abrir formulário:', resultado);
    
    return resultado;
}

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

// Rota do chat - COM DESPEDIDA + DETECÇÃO DE LEADS
// Rota do chat - CORRIGIDA PARA RESOLVER "resultado não definido"
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
        
        // ===== VERIFICAR TIPO DE MENSAGEM PRIMEIRO =====
        const tipoMensagem = detectarTipoMensagem(message);
        console.log('📝 Tipo de mensagem detectado:', tipoMensagem);
        
        let resposta;
        let deveAbrirFormulario = false;
        let fonteResposta = 'despedida';
        let resultado = null; // ← INICIALIZAR VARIÁVEL
        
        // Se for despedida, usar resposta pré-definida
        if (tipoMensagem !== 'normal') {
            resposta = gerarRespostaDespedida(tipoMensagem);
            console.log('💬 Usando resposta de despedida:', resposta);
            fonteResposta = 'despedida';
        } else {
            // Usar IA para resposta normal
            try {
                resultado = await ia.gerarResposta(message, sessionId);
                resposta = resultado.resposta;
                fonteResposta = resultado.fonte;
                
                // ===== DETECÇÃO DE LEADS MANTIDA =====
                console.log('🔍 Verificando interesse comercial...');
                console.log('• Mensagem:', message);
                console.log('• Resposta IA:', resposta.substring(0, 100) + '...');
                
                deveAbrirFormulario = detectarInteresseComercial(message, resposta);
                console.log('• Deve abrir formulário:', deveAbrirFormulario);
                
            } catch (error) {
                console.error('❌ Erro ao gerar resposta da IA:', error.message);
                resposta = "Olá! 👋 Sou o assistente virtual do Grupo OC. Como posso ajudar você hoje?";
                fonteResposta = 'fallback';
            }
        }
        
        // Garantir que sempre temos uma resposta
        if (!resposta) {
            resposta = "Olá! 👋 Sou o assistente virtual do Grupo OC. Como posso ajudar você hoje?";
            fonteResposta = 'fallback';
        }
        
        res.json({
            success: true,
            reply: resposta,
            openForm: deveAbrirFormulario,
            debug: {
                tipoMensagem: tipoMensagem,
                fonteResposta: fonteResposta,
                fonteDados: dadosEmpresa?.metadados?.fonte || 'dados-padrao',
                urlsColetadas: {
                    principal: dadosEmpresa?.metadados?.urlPrincipal || 'não coletada',
                    servicos: dadosEmpresa?.metadados?.urlServicos || 'não coletada'
                },
                servicosTotal: dadosEmpresa?.metadados?.servicosTotal || 0,
                divisoes: dadosEmpresa?.metadados?.divisoes || [],
                tokens: fonteResposta === 'despedida' ? 0 : (resultado?.tokens || 0),
                interesseDetectado: deveAbrirFormulario,
                mensagemOriginal: message,
                palavrasDetectadas: tipoMensagem === 'normal' ? 
                    palavrasChaveInteresse.filter(palavra => 
                        message.toLowerCase().includes(palavra.toLowerCase())
                    ) : [],
                respostaTipo: tipoMensagem !== 'normal' ? 'despedida' : 'ia'
            }
        });
        
    } catch (error) {
        console.error('❌ Erro no chat:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            reply: "Desculpe, ocorreu um erro temporário. Tente novamente em alguns instantes."
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

// Rota específica para o widget flutuante (APENAS O BALÃO)
app.get('/widget', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Chat Grupo OC</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        
        /* Destaque azul */
        .highlight {
            color: #2196F3;
            font-weight: bold;
        }
        /* Formulário de Leads */
.lead-form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
}

.lead-form-container {
    background: white;
    border-radius: 20px;
    padding: 30px;
    max-width: 450px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: formSlideIn 0.3s ease;
}

@keyframes formSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.lead-form-header {
    text-align: center;
    margin-bottom: 25px;
}

.lead-form-header h3 {
    color: #2196F3;
    font-size: 24px;
    margin-bottom: 10px;
}

.lead-form-header p {
    color: #666;
    font-size: 16px;
}

.lead-form-group {
    margin-bottom: 20px;
}

.lead-form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #333;
}

.lead-form-group input,
.lead-form-group select,
.lead-form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    font-size: 14px;
    transition: border-color 0.3s;
}

.lead-form-group input:focus,
.lead-form-group select:focus,
.lead-form-group textarea:focus {
    outline: none;
    border-color: #2196F3;
}

.lead-form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.lead-form-buttons {
    display: flex;
    gap: 15px;
    margin-top: 25px;
}

.lead-form-button {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.lead-form-button.primary {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
}

.lead-form-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4);
}

.lead-form-button.secondary {
    background: #f8f9fa;
    color: #666;
    border: 2px solid #e9ecef;
}

.lead-form-button.secondary:hover {
    background: #e9ecef;
}

.lead-form-loading {
    display: none;
    text-align: center;
    padding: 20px;
}

.lead-form-success {
    display: none;
    text-align: center;
    padding: 30px;
}

.lead-form-success h4 {
    color: #28a745;
    margin-bottom: 15px;
}

@media (max-width: 480px) {
    .lead-form-container {
        padding: 20px;
        margin: 10px;
    }
    
    .lead-form-buttons {
        flex-direction: column;
    }
}
    </style>
</head>
<body>
    <!-- APENAS O Widget de Chat -->
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

    <!-- Formulário de Leads -->
<div class="lead-form-overlay" id="leadFormOverlay">
    <div class="lead-form-container">
        <div class="lead-form-header">
            <h3>🎯 Vamos conversar!</h3>
            <p>Preencha seus dados e nossa equipe entrará em contato em breve</p>
        </div>
        
        <form id="leadForm">
            <div class="lead-form-group">
                <label for="leadNome">Nome Completo *</label>
                <input type="text" id="leadNome" name="nome" required>
            </div>
            
            <div class="lead-form-group">
                <label for="leadEmail">Email Corporativo *</label>
                <input type="email" id="leadEmail" name="email" required>
            </div>
            
            <div class="lead-form-group">
                <label for="leadTelefone">Telefone/WhatsApp *</label>
                <input type="tel" id="leadTelefone" name="telefone" required placeholder="(11) 99999-9999">
            </div>
            
            <div class="lead-form-group">
                <label for="leadEmpresa">Empresa</label>
                <input type="text" id="leadEmpresa" name="empresa" placeholder="Nome da sua empresa">
            </div>
            
            <div class="lead-form-group">
                <label for="leadCNPJ">CNPJ</label>
                <input type="text" id="leadCNPJ" name="cnpj" placeholder="00.000.000/0001-00">
            </div>
            
            <div class="lead-form-group">
                <label for="leadInteresse">Principal Interesse *</label>
                <select id="leadInteresse" name="interesse" required>
                    <option value="">Selecione uma opção</option>
                    <option value="OC TEL - Soluções em Telecom">OC TEL - Soluções em Telecom</option>
                    <option value="OC DIGITAL - Marketing Digital">OC DIGITAL - Marketing Digital</option>
                    <option value="OC SAÚDE - Planos Empresariais">OC SAÚDE - Planos Empresariais</option>
                    <option value="Consultoria Empresarial Geral">Consultoria Empresarial Geral</option>
                    <option value="Múltiplas Soluções">Múltiplas Soluções</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>
            
            <div class="lead-form-group">
                <label for="leadMensagem">Mensagem Adicional</label>
                <textarea id="leadMensagem" name="mensagem" placeholder="Conte-nos mais sobre sua necessidade..."></textarea>
            </div>
            
            <div class="lead-form-buttons">
                <button type="button" class="lead-form-button secondary" onclick="closeLeadForm()">
                    Cancelar
                </button>
                <button type="submit" class="lead-form-button primary">
                    Enviar Solicitação
                </button>
            </div>
        </form>
        
        <div class="lead-form-loading" id="leadFormLoading">
            <h4>📤 Enviando solicitação...</h4>
            <p>Aguarde um momento...</p>
        </div>
        
        <div class="lead-form-success" id="leadFormSuccess">
            <h4>✅ Solicitação enviada com sucesso!</h4>
            <p>Nossa equipe entrará em contato em breve. Obrigado pelo interesse!</p>
            <button class="lead-form-button primary" onclick="closeLeadForm()" style="margin-top: 15px;">
                Fechar
            </button>
        </div>
    </div>
</div>

    <script>
    // ===== VARIÁVEIS GLOBAIS =====
    const chatContainer = document.getElementById('chatContainer');
    const chatButton = document.getElementById('chatButton');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const typing = document.getElementById('typing');
    
    let chatOpen = false;
    let leadFormOpen = false;

    // ===== FUNÇÕES DO CHAT =====
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

    // ===== FUNÇÕES DO FORMULÁRIO - VERSÃO GARANTIDA =====
    function openLeadForm() {
        console.log('🎯 FORÇANDO ABERTURA DO FORMULÁRIO...');
        
        leadFormOpen = true;
        
        // Buscar elemento
        const overlay = document.getElementById('leadFormOverlay');
        console.log('• Elemento encontrado:', !!overlay);
        
        if (overlay) {
            // FORÇAR DISPLAY
            overlay.style.display = 'flex';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '10000';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            
            console.log('✅ FORMULÁRIO FORÇADO A APARECER!');
            
            // Focar no primeiro campo
            setTimeout(() => {
                const nomeField = document.getElementById('leadNome');
                if (nomeField) {
                    nomeField.focus();
                }
            }, 500);
        } else {
            console.error('❌ ELEMENTO leadFormOverlay NÃO ENCONTRADO!');
            alert('TESTE: Formulário deveria abrir agora!');
        }
    }

    function closeLeadForm() {
        console.log('🔒 Fechando formulário...');
        leadFormOpen = false;
        
        const overlay = document.getElementById('leadFormOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Reset form
        const form = document.getElementById('leadForm');
        if (form) {
            form.reset();
            form.style.display = 'block';
        }
        
        const loading = document.getElementById('leadFormLoading');
        if (loading) loading.style.display = 'none';
        
        const success = document.getElementById('leadFormSuccess');
        if (success) success.style.display = 'none';
    }

    // ===== FUNÇÃO DE ENVIO DE MENSAGEM =====
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
            
            console.log('📊 RESPOSTA COMPLETA:', data);
            
            if (data.success) {
                addMessage(data.reply);
                
                // ===== VERIFICAÇÃO SUPER SIMPLES =====
                console.log('🔍 Verificando openForm:', data.openForm);
                
                if (data.openForm) {
                    console.log('🎯 DEVE ABRIR FORMULÁRIO! Abrindo em 1 segundo...');
                    setTimeout(() => {
                        openLeadForm();
                    }, 1000);
                } else {
                    console.log('ℹ️ Não precisa abrir formulário');
                }
            } else {
                addMessage('Desculpe, ocorreu um erro. Tente novamente.');
            }
        } catch (error) {
            hideTyping();
            addMessage('Erro de conexão. Verifique sua internet e tente novamente.');
            console.error('❌ Erro:', error);
        }
    }

    // ===== EVENT LISTENERS =====
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // ===== INICIALIZAÇÃO QUANDO PÁGINA CARREGAR =====
    window.addEventListener('load', function() {
        console.log('🚀 WIDGET CARREGADO!');
        
        // Verificar se elementos existem
        const overlay = document.getElementById('leadFormOverlay');
        const form = document.getElementById('leadForm');
        
        console.log('🔍 VERIFICAÇÃO DE ELEMENTOS:');
        console.log('• leadFormOverlay:', !!overlay);
        console.log('• leadForm:', !!form);
        
        if (overlay && form) {
            console.log('✅ TODOS OS ELEMENTOS ENCONTRADOS!');
            
            // Configurar event listeners do formulário
            setupFormListeners();
        } else {
            console.error('❌ ELEMENTOS DO FORMULÁRIO NÃO ENCONTRADOS!');
        }
    });

    // ===== CONFIGURAR FORMULÁRIO =====
    function setupFormListeners() {
        console.log('⚙️ Configurando listeners do formulário...');
        
        // Fechar clicando fora
        const overlay = document.getElementById('leadFormOverlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeLeadForm();
                }
            });
        }

        // Submissão do formulário
        const form = document.getElementById('leadForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('📤 Enviando formulário...');
                
                const formData = new FormData(this);
                const leadData = {
                    nome: formData.get('nome'),
                    email: formData.get('email'),
                    telefone: formData.get('telefone'),
                    empresa: formData.get('empresa'),
                    cnpj: formData.get('cnpj'),
                    interesse: formData.get('interesse'),
                    mensagem: formData.get('mensagem'),
                    origem: 'Chat Widget - Grupo OC',
                    timestamp: new Date().toISOString()
                };
                
                // Mostrar loading
                document.getElementById('leadForm').style.display = 'none';
                document.getElementById('leadFormLoading').style.display = 'block';
                
                try {
                    const response = await fetch('/api/capture-lead', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(leadData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        document.getElementById('leadFormLoading').style.display = 'none';
                        document.getElementById('leadFormSuccess').style.display = 'block';
                        
                        setTimeout(() => {
                            closeLeadForm();
                        }, 5000);
                    } else {
                        throw new Error(result.error || 'Erro ao enviar solicitação');
                    }
                    
                } catch (error) {
                    console.error('❌ Erro ao enviar lead:', error);
                    alert('Erro ao enviar solicitação. Tente novamente.');
                    
                    document.getElementById('leadFormLoading').style.display = 'none';
                    document.getElementById('leadForm').style.display = 'block';
                }
            });
        }

        // Máscaras
        const telefoneField = document.getElementById('leadTelefone');
        if (telefoneField) {
            telefoneField.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                    if (value.length < 14) {
                        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                    }
                }
                e.target.value = value;
            });
        }

        const cnpjField = document.getElementById('leadCNPJ');
        if (cnpjField) {
            cnpjField.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                e.target.value = value;
            });
        }
        
        console.log('✅ Listeners do formulário configurados!');
    }

    // ===== FUNÇÃO DE TESTE GLOBAL =====
    window.testarFormulario = function() {
        console.log('🧪 TESTE MANUAL DO FORMULÁRIO');
        openLeadForm();
    };
</script>
</body>
</html>`);
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

















