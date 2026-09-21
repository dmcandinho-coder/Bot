const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

// Configuração do cliente com opções reforçadas para evitar travamentos/inatividade
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Gera o QR Code no terminal
client.on('qr', (qr) => {
    console.log('Escaneie o QR Code abaixo com o seu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Confirmação de conexão
client.on('ready', () => {
    console.log('========================================');
    console.log('>>> BOT ATIVO E PRONTO PARA USO! <<<');
    console.log('========================================');
});

// Tratamento para evitar que o bot "durma" se a conexão cair
client.on('disconnected', (reason) => {
    console.log('Bot foi desconectado:', reason);
    console.log('Tentando reconectar...');
    client.initialize();
});

// Escuta e processa todas as mensagens recebidas/enviadas
client.on('message_create', async (msg) => {
    // Ignora mensagens de grupos para evitar respostas indesejadas
    if (msg.from.endsWith('@g.us')) return;

    const texto = msg.body.trim().toLowerCase();

    // Menu Principal (Acionado por oi, ola, menu ou inicio)
    if (['oi', 'olá', 'ola', 'menu', 'inicio', 'início'].includes(texto)) {
        const menu = `🤖 *Atendimento Automático*\n\n` +
                     `Escolha uma das opções abaixo digitando apenas o número:\n\n` +
                     `1️⃣ Redes Sociais\n` +
                     `2️⃣ Horário de Atendimento\n` +
                     `3️⃣ Deixar um Recado\n` +
                     `4️⃣ Baixar PDF\n`;
        await msg.reply(menu);
        return;
    }

    // Opção 1: Redes Sociais
    if (texto === '1') {
        await msg.reply('📱 *Nossas Redes Sociais:*\n\n• Instagram: @seu_usuario\n• Facebook: /sua_pagina\n• Site: www.seusite.com');
    } 
    // Opção 2: Horário de Atendimento
    else if (texto === '2') {
        await msg.reply('⏰ *Horário de Atendimento:*\n\nAtendemos de Segunda a Sexta, das 08h às 18h.');
    } 
    // Opção 3: Deixar Recado
    else if (texto === '3') {
        await msg.reply('📝 Por favor, digite o seu recado aqui abaixo. Um dos nossos atendentes responderá assim que possível!');
    } 
    // Opção 4: Envio de PDF
    else if (texto === '4') {
        // Nome do arquivo PDF localizado na mesma pasta do index.js
        const pdfName = 'documento.pdf';
        const pdfPath = path.join(__dirname, pdfName);

        if (fs.existsSync(pdfPath)) {
            try {
                await msg.reply('Aguarde um instante, estou enviando o arquivo...');
                const media = MessageMedia.fromFilePath(pdfPath);
                await client.sendMessage(msg.from, media, { caption: '📄 Aqui está o seu PDF!' });
                console.log(`[LOG] PDF enviado com sucesso para ${msg.from}`);
            } catch (err) {
                console.error('[ERRO] Falha ao enviar o arquivo PDF:', err);
                await msg.reply('Ocorreu um erro ao tentar enviar o arquivo PDF.');
            }
        } else {
            await msg.reply('⚠️ O arquivo PDF não foi encontrado no sistema.');
            console.log(`[ERRO] O arquivo "${pdfName}" não foi encontrado na raiz do projeto.`);
        }
    }
});

// Inicializa o bot
client.initialize();
