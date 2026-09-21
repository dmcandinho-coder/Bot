const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot do Daniel Moreira Candinho está online no Render! 🤖');
});
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Bot Daniel', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Tudo pronto! Bot do Daniel conectado com sucesso.');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            
            if (!text) return;
            const input = text.trim().toLowerCase();

            // Menu Principal
            if (input === 'oi' || input === 'olá' || input === 'ola' || !['1', '2', '3'].includes(input)) {
                const menu = `Olá! Eu sou o assistente virtual do Daniel Moreira Candinho. Escolha uma das opções abaixo digitando o número correspondente:\n\n1. Redes Sociais 🌐\n2. Horário de Atendimento ⏰\n3. Deixar um Recado 📝`;
                await sock.sendMessage(from, { text: menu });
            } 
            // Opção 1
            else if (input === '1') {
                const opt1 = `Here are my social networks:\n• Instagram: ://instagram.com\n• GitHub: ://github.com`;
                await sock.sendMessage(from, { text: opt1 });
            } 
            // Opção 2
            else if (input === '2') {
                const opt2 = `Meu horário de atendimento é das 10h às 17h horas. ⏰`;
                await sock.sendMessage(from, { text: opt2 });
            } 
            // Opção 3
            else if (input === '3') {
                const opt3 = `Pode digitar o seu recado aqui embaixo! Assim que eu visualizar, eu te respondo. 📝`;
                await sock.sendMessage(from, { text: opt3 });
            }
        }
    });
}

connectToWhatsApp();
