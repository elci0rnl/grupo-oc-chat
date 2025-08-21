import OpenAI from 'openai';

class GrupoOCIA {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.dadosEmpresa = null;
        this.sessoes = new Map();
        this.fallbackAtivo = false;
        
        console.log('🤖 GrupoOCIA inicializada com fallback robusto');
    }
    
    carregarDadosEmpresa(dados) {
        this.dadosEmpresa = dados;
        console.log('📊 Dados da empresa carregados');
        console.log(`   • Fonte: ${dados?.metadados?.fonte || 'desconhecida'}`);
        console.log(`   • Serviços: ${dados?.servicos?.servicos?.length || 0}`);
    }
    
    async gerarResposta(mensagem, sessionId = 'default') {
        // Tentar OpenAI primeiro (se disponível e não em fallback)
        if (!this.fallbackAtivo && this.openai.apiKey) {
            try {
                return await this.gerarRespostaOpenAI(mensagem, sessionId);
            } catch (error) {
                console.log('⚠️ OpenAI falhou, ativando fallback:', error.message);
                this.fallbackAtivo = true;
            }
        }
        
        // Usar fallback inteligente
        return this.gerarRespostaFallback(mensagem, sessionId);
    }
    
    async gerarRespostaOpenAI(mensagem, sessionId) {
        const dados = this.dadosEmpresa || this.obterDadosPadrao();
        
        if (!this.sessoes.has(sessionId)) {
            this.sessoes.set(sessionId, []);
        }
        
        const historico = this.sessoes.get(sessionId);
        historico.push({ role: 'user', content: mensagem });
        
        if (historico.length > 6) {
            historico.splice(0, historico.length - 6);
        }
        
        const prompt = this.criarPromptSistema(dados);
        const mensagens = [
            { role: 'system', content: prompt },
            ...historico
        ];
        
        const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: mensagens,
            max_tokens: 400,
            temperature: 0.7
        });
        
        const resposta = response.choices[0].message.content;
        historico.push({ role: 'assistant', content: resposta });
        
        return {
            resposta: resposta,
            fonte: 'openai',
            tokens: response.usage?.total_tokens || 0
        };
    }
    
    gerarRespostaFallback(mensagem, sessionId) {
        const dados = this.dadosEmpresa || this.obterDadosPadrao();
        const mensagemLower = mensagem.toLowerCase();
        
        console.log('🤖 Usando IA fallback para responder');
        
        // Detectar tipo de pergunta e responder adequadamente
        if (this.detectarSaudacao(mensagem)) {
            return this.responderSaudacao();
        }
        
        if (this.detectarPerguntaServicos(mensagem)) {
            return this.responderSobreServicos(dados);
        }
        
        if (this.detectarPerguntaSobre(mensagem)) {
            return this.responderSobreEmpresa(dados);
        }
        
        if (this.detectarPerguntaContato(mensagem)) {
            return this.responderSobreContato();
        }
        
        if (this.detectarPerguntaPreco(mensagem)) {
            return this.responderSobrePrecos();
        }
        
        // Resposta padrão inteligente
        return this.responderPadrao(dados);
    }
    
    detectarSaudacao(mensagem) {
        const saudacoes = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'];
        return saudacoes.some(s => mensagem.toLowerCase().includes(s));
    }
    
    detectarPerguntaServicos(mensagem) {
        const palavras = [
            'serviços', 'serviço', 'fazem', 'oferecem', 'soluções', 'consultoria', 
            'trabalham', 'especialidade', 'atividade', 'o que vocês', 'que fazem'
        ];
        return palavras.some(p => mensagem.toLowerCase().includes(p));
    }
    
    detectarPerguntaSobre(mensagem) {
        const palavras = [
            'sobre', 'empresa', 'grupo oc', 'quem são', 'história', 
            'experiência', 'tempo', 'mercado', 'quem é'
        ];
        return palavras.some(p => mensagem.toLowerCase().includes(p));
    }
    
    detectarPerguntaContato(mensagem) {
        const palavras = [
            'contato', 'telefone', 'email', 'falar', 'conversar', 
            'atendimento', 'como entrar', 'localização'
        ];
        return palavras.some(p => mensagem.toLowerCase().includes(p));
    }
    
    detectarPerguntaPreco(mensagem) {
        const palavras = [
            'preço', 'valor', 'custo', 'orçamento', 'quanto custa', 
            'investimento', 'proposta', 'cotação'
        ];
        return palavras.some(p => mensagem.toLowerCase().includes(p));
    }
    
    responderSaudacao() {
        const resposta = `Olá! 👋 Seja bem-vindo(a) ao **Grupo OC**!

🏢 Somos uma empresa especializada em **soluções empresariais** com mais de 15 anos de experiência no mercado.

✨ **Como posso ajudá-lo hoje?**
• 🛠️ Conhecer nossos serviços
• 🏢 Saber mais sobre nossa empresa  
• 📞 Informações de contato
• 💼 Solicitar orçamento

Digite sua dúvida ou interesse!`;
        
        return {
            resposta: resposta,
            fonte: 'fallback-saudacao'
        };
    }
    
    responderSobreServicos(dados) {
        let resposta = `🛠️ **Serviços do Grupo OC**

Somos especializados em soluções empresariais personalizadas. Nossos principais serviços incluem:

`;
        
        if (dados.servicos && dados.servicos.servicos && dados.servicos.servicos.length > 0) {
            dados.servicos.servicos.slice(0, 6).forEach((servico, index) => {
                resposta += `**${index + 1}. ${servico.nome}**\n${servico.descricao}\n\n`;
            });
        } else {
            resposta += `**1. Consultoria Empresarial**
Consultoria especializada para otimização de processos e estratégias

**2. Soluções Tecnológicas**
Implementação de tecnologias para modernização empresarial

**3. Gestão de Projetos**
Gerenciamento completo de projetos com metodologias ágeis

**4. Transformação Digital**
Apoio na digitalização e modernização de processos

`;
        }
        
        resposta += `🌐 **Saiba mais:** https://grupooc.com.br/nosso-servico/

💬 **Qual serviço te interessa mais?** Posso dar mais detalhes!`;
        
        return {
            resposta: resposta,
            fonte: 'fallback-servicos'
        };
    }
    
    responderSobreEmpresa(dados) {
        const sobre = dados?.empresa?.sobre || 'Somos uma empresa consolidada no mercado, especializada em oferecer soluções empresariais personalizadas.';
        
        const resposta = `🏢 **Sobre o Grupo OC**

${sobre}

🎯 **Nossos Diferenciais:**
• ⭐ Mais de 15 anos de experiência no mercado
• 👥 Equipe especializada e qualificada  
• 🎨 Soluções personalizadas para cada cliente
• 🤝 Atendimento próximo e dedicado
• 🚀 Metodologias inovadoras e eficientes
• 📈 Resultados comprovados

🌐 **Conheça mais:** https://grupooc.com.br/

�� **Quer saber como podemos ajudar sua empresa?**`;
        
        return {
            resposta: resposta,
            fonte: 'fallback-sobre'
        };
    }
    
    responderSobreContato() {
        const resposta = `📞 **Entre em Contato com o Grupo OC**

Para orçamentos, consultas ou mais informações sobre nossos serviços:

🌐 **Site Oficial:** https://grupooc.com.br/
📋 **Nossos Serviços:** https://grupooc.com.br/nosso-servico/

💼 **Nossa equipe está pronta para:**
• Analisar suas necessidades
• Apresentar soluções personalizadas
• Elaborar propostas comerciais
• Agendar reuniões de apresentação

🎯 **Que tipo de solução sua empresa precisa?**`;
        
        return {
            resposta: resposta,
            fonte: 'fallback-contato'
        };
    }
    
    responderSobrePrecos() {
        const resposta = `💰 **Orçamentos e Investimentos**

No Grupo OC, cada projeto é único e personalizado para suas necessidades específicas.

📋 **Como funciona:**
• 🔍 Análise gratuita das suas necessidades
• 📊 Diagnóstico detalhado do cenário atual
• 💡 Proposta de solução personalizada
• 💼 Orçamento adequado ao seu investimento

🎯 **Fatores que influenciam:**
• Escopo do projeto
• Complexidade da solução
• Prazo de implementação
• Recursos necessários

📞 **Para orçamento personalizado:**
Visite: https://grupooc.com.br/

💬 **Conte-me mais sobre seu projeto para orientá-lo melhor!**`;
        
        return {
            resposta: resposta,
            fonte: 'fallback-precos'
        };
    }
    
    responderPadrao(dados) {
        const resposta = `🤖 **Assistente Virtual do Grupo OC**

Entendi sua mensagem! Sou especializado em ajudar com informações sobre o Grupo OC.

🎯 **Posso ajudá-lo com:**
• 🛠️ **Serviços:** Consultoria, soluções tecnológicas, gestão de projetos
• 🏢 **Empresa:** Nossa história, experiência e diferenciais
• 📞 **Contato:** Como falar conosco e solicitar orçamentos
• 💼 **Soluções:** Como podemos ajudar sua empresa

💬 **Reformule sua pergunta ou escolha um dos tópicos acima!**

🌐 **Site oficial:** https://grupooc.com.br/`;
        
        return {
            resposta: resposta,
            fonte: 'fallback-padrao'
        };
    }
    
    obterDadosPadrao() {
        return {
            empresa: {
                nome: "Grupo OC",
                sobre: "Empresa especializada em soluções empresariais com mais de 15 anos de experiência no mercado, oferecendo consultoria e soluções personalizadas para transformar empresas e impulsionar resultados."
            },
            servicos: {
                servicos: [
                    { 
                        nome: "Consultoria Empresarial", 
                        descricao: "Consultoria especializada para otimização de processos, estratégias de negócio e melhoria da performance empresarial" 
                    },
                    { 
                        nome: "Soluções Tecnológicas", 
                        descricao: "Implementação de tecnologias inovadoras para modernização e digitalização empresarial" 
                    },
                    { 
                        nome: "Gestão de Projetos", 
                        descricao: "Gerenciamento completo de projetos com metodologias ágeis e foco em resultados" 
                    },
                    { 
                        nome: "Transformação Digital", 
                        descricao: "Apoio completo na jornada de transformação digital da sua empresa" 
                    }
                ]
            }
        };
    }
    
    criarPromptSistema(dados) {
        return `Você é o assistente virtual oficial do Grupo OC, empresa de soluções empresariais. Seja profissional, cordial e foque exclusivamente nos serviços do Grupo OC. Site: https://grupooc.com.br/`;
    }
    
    deveAbrirFormulario(mensagem, resposta) {
        const palavras = [
            'orçamento', 'contato', 'preço', 'interessado', 'proposta', 
            'reunião', 'conversar', 'falar', 'atendimento'
        ];
        const texto = (mensagem + ' ' + resposta).toLowerCase();
        return palavras.some(p => texto.includes(p));
    }
    
    getStatus() {
        return {
            openaiConfigurada: !!this.openai.apiKey,
            fallbackAtivo: this.fallbackAtivo,
            dadosCarregados: !!this.dadosEmpresa,
            sessoesAtivas: this.sessoes.size,
            empresa: 'Grupo OC',
            servicosCarregados: this.dadosEmpresa?.servicos?.servicos?.length || 0
        };
    }
}

export default GrupoOCIA;
