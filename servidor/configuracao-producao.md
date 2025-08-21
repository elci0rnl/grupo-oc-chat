# CONFIGURAÇÕES PARA PRODUÇÃO - GRUPO OC

## 1. SERVIDOR BACKEND
- Hospedagem: VPS/Cloud (Recomendado: DigitalOcean, AWS, Heroku)
- Node.js: Versão 18+
- Porta: 3000 (ou variável de ambiente PORT)
- SSL: Obrigatório (Let's Encrypt gratuito)

## 2. DOMÍNIO E DNS
- Subdomínio sugerido: api.grupooc.com.br
- Configurar CORS para: https://grupooc.com.br
- Certificado SSL válido

## 3. VARIÁVEIS DE AMBIENTE (.env)
# OpenAI Configuration
OPENAI_API_KEY=process.env.OPENAI_API_KEY

# Email Configuration (Gmail/Google Workspace)
EMAIL_USER=bruno.grupooc@gmail.com
EMAIL_PASS=zsso vehi cxgu tedh

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bruno.grupooc@gmail.com
SMTP_PASS=zsso vehi cxgu tedh

# Email de destino para leads
LEADS_EMAIL=bruno.grupooc@gmail.com
LEADS_EMAIL_CC=bruno.grupooc@gmail.com
EMAIL_FROM_NAME=TIM Corporativo Chat
EMAIL_SUBJECT=Novo Lead - Grupo OC

# WhatsApp Configuration
ENABLE_WHATSAPP=false
WHATSAPP_TIMEOUT=180000

# CONFIGURAÇÕES DE EMAIL PARA CAPTAÇÃO
EMAIL_COMERCIAL=bruno.grupooc@gmail.com
EMAIL_COMERCIAL_CC=elcio.silva@grupooc.com.br,comercial@grupooc.com.br
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bruno.grupooc@gmail.com
SMTP_PASS=zsso vehi cxgu tedh
EMAIL_DESTINO=elcio.silva@grupooc.com.br,comercial@grupooc.com.br

## 4. CORS CONFIGURADO
- Origin: https://grupooc.com.br
- Methods: GET, POST
- Headers: Content-Type

## 5. MONITORAMENTO
- PM2 para manter servidor ativo
- Logs automáticos
- Restart automático em caso de erro

## 6. BACKUP
- Leads salvos em arquivo JSON
- Backup diário recomendado
- Monitoramento de espaço em disco

