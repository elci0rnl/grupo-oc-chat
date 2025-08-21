// modules/ia.js - VERSÃO GRUPO OC
import OpenAI from 'openai';

class GrupoOCIA {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.dadosEmpresa = null;
        this.sessoes = new Map();
        
        // Dados padrão do Grupo OC
        this.dadosPadrao = {
            empresa: {
                nome: "Grupo OC",
                site: "https://grupooc.com.br/",
                descricao: "Empresa especializada em soluções empresariais e consultoria",
                diferenciais: [
                    "Mais de 15 anos de experiência no mercado",
                    "Soluções personalizadas para cada cliente",
                    "Equipe especializada e qualificada",
                    "Atendimento personalizado e próximo ao cliente"
                ]
            },
            servicos: [
                {
                    nome: "Consultoria Empresarial",
                    descricao: "Consultoria especializada para otimização de processos empresariais"
                },
                {
                    nome: "Soluções Tecnológicas",
                    descricao: "Implementação de tecnologias para modernização empresarial"
                },
                {
                    nome: "Gestão de Projetos",
                    descricao: "Gerenciamento completo de projetos empresariais"
                },
                {
                    nome: "Transformação Digital",
                    descricao: "Apoio na digitalização e modernização de processos"
                }
            ]
        };
        
        console.log('🤖 GrupoOCIA inicializada');
    }
    
    carregarDadosEmpresa(dados) {
        this.dadosEmpresa = dados;
        console.log('📊 Dados da empresa carregados via scraping');
    }
    
    obterDadosAtivos() {
        return this.dadosEmpresa || this.dadosPadrao;
    }
    
    criarPromptSistema() {
        const dados = this.obterDadosAtivos();
        
        let servicos = "";
        if (dados.servicos && dados.servicos.servicos) {
            servicos = dados.servicos.servicos.map(s => `- ${s.nome}: ${s.descricao}`).join('\n');
        } else if (dados.servicos) {
            servicos = dados.servicos.map(s => `- ${s.nome}: ${s.descricao}`).join('\n');
        }
        
        let textosPrincipais = "";
        if (dados.empresa && dados.empresa.textosPrincipais) {
            textosPrincipais = dados.empresa.textosPrincipais.join('\n');
        }
        
        return `Você é o assistente virtual oficial do GRUPO OC, uma empresa especializada em soluções empresariais.

INFORMAÇÕES DA EMPRESA:
- Nome: Grupo OC
- Site: https://grupooc.com.br/
- Especialidade: Soluções empresariais e consultoria

SERVIÇOS OFERECIDOS:
${servicos || `- Consultoria Empresarial: Consultoria especializada para otimização de processos
- Soluções Tecnológicas: Implementação de tecnologias para modernização
- Gestão de Projetos: Gerenciamento completo de projetos empresariais
- Transformação Digital: Apoio na digitalização de processos`}

INFORMAÇÕES ADICIONAIS DO SITE:
${textosPrincipais || "Empresa com mais de 15 anos de experiência, focada em soluções personalizadas para cada cliente."}

INSTRUÇÕES DE COMPORTAMENTO:
1. Seja sempre profissional, cordial e prestativo
2. Responda APENAS sobre o Grupo OC e seus serviços
3. Se perguntarem sobre outras empresas, redirecione para o Grupo OC
4. Ofereça informações detalhadas sobre nossos serviços
5. Incentive o contato para orçamentos e consultorias
6. Use um tom empresarial mas acolhedor
7. Sempre se identifique como assistente do Grupo OC
8. Se não souber algo específico, seja honesto e ofereça contato direto

DADOS DE CONTATO:
- Site: https://grupooc.com.br/
- Para mais informações, visite nosso site ou entre em contato conosco

Responda sempre em português brasileiro e mantenha o foco nos serviços do Grupo OC.`;
    }
    
    async gerarResposta(mensagem, sessionId = 'default') {
        try {
            if (!this.openai.apiKey) {
                throw new Error('Chave da OpenAI não configurada');
            }
            
            // Gerenciar histórico da sessão
            if (!this.sessoes.has(sessionId)) {
                this.sessoes.set(sessionId, []);
            }
            
            const historico = this.sessoes.get(sessionId);
            
            // Adicionar mensagem do usuário
            historico.push({
                role: 'user',
                content: mensagem
            });
            
            // Manter apenas as últimas 10 mensagens
            if (historico.length > 10) {
                historico.splice(0, historico.length - 10);
            }
            
            // Criar mensagens para a API
            const mensagens = [
                {
                    role: 'system',
                    content: this.criarPromptSistema()
                },
                ...historico
            ];
            
            console.log('🤖 Gerando resposta via OpenAI...');
            
            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: mensagens,
                max_tokens: 500,
                temperature: 0.7
            });
            
            const resposta = response.choices[0].message.content;
            
            // Adicionar resposta ao histórico
            historico.push({
                role: 'assistant',
                content: resposta
            });
            
            console.log('✅ Resposta gerada com sucesso');
            
            return {
                resposta: resposta,
                fonte: this.dadosEmpresa ? 'scraping' : 'dados-padrao',
                tokens: response.usage?.total_tokens || 0
            };
            
        } catch (error) {
            console.error('❌ Erro na IA:', error.message);
            
            // Resposta de fallback
            const respostaFallback = `Olá! Sou o assistente virtual do Grupo OC. 

Estamos enfrentando uma instabilidade temporária em nosso sistema, mas posso ajudá-lo com informações básicas:

🏢 **Sobre o Grupo OC:**
- Empresa especializada em soluções empresariais
- Mais de 15 anos de experiência
- Consultoria e soluções tecnológicas

🛠️ **Nossos Serviços:**
- Consultoria Empresarial
- Soluções Tecnológicas  
- Gestão de Projetos
- Transformação Digital

Para mais informações detalhadas, visite nosso site: https://grupooc.com.br/

Como posso ajudá-lo hoje?`;
            
            return {
                resposta: respostaFallback,
                fonte: 'fallback',
                erro: error.message
            };
        }
    }
    
    deveAbrirFormulario(mensagem, resposta) {
        const palavrasChave = [
            'orçamento', 'contato', 'preço', 'valor', 'custo',
            'contratar', 'interessado', 'proposta', 'reunião',
            'telefone', 'email', 'falar com', 'atendimento'
        ];
        
        const texto = (mensagem + ' ' + resposta).toLowerCase();
        return palavrasChave.some(palavra => texto.includes(palavra));
    }
    
    getStatus() {
        return {
            openaiConfigurada: !!this.openai.apiKey,
            dadosCarregados: !!this.dadosEmpresa,
            sessoesAtivas: this.sessoes.size,
            empresa: 'Grupo OC'
        };
    }
}

export default GrupoOCIA;
