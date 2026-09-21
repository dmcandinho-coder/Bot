const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot do Daniel Moreira Candinho está online no Render! 🤖');
});
app.listen(port, () => console.log(`Servidor rodando na porta \${port}`));

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Bot Daniel', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Tudo pronto! Bot do Daniel conectado com sucesso.');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages;
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            
            if (!text) return;
            const input = text.trim();
            const inputLower = input.toLowerCase();

            // 1. FUNÇÃO DE LEMBRETE (!lembrar 1 teste)
            if (inputLower.startsWith('!lembrar')) {
                const partes = input.split(' ');
                const minutos = parseInt(partes[1]);
                const tarefa = partes.slice(2).join(' ');

                if (isNaN(minutos) || !tarefa) {
                    await sock.sendMessage(from, { text: `⚠️ *Como usar o lembrete:* \nDigite exatamente:\n\`!lembrar [minutos] [sua tarefa]\`\n\n*Exemplo:* \`!lembrar 5 Tomar café\`` });
                    return;
                }

                await sock.sendMessage(from, { text: `⏰ *Lembrete agendado!* \nDaqui a *\${minutos} minutos* te aviso sobre: _"\${tarefa}"_` });

                setTimeout(async () => {
                    await sock.sendMessage(from, { text: `🔔 *ALERTA, DANIEL!* \n\nEstá na hora de:\n👉 *\${tarefa}*` });
                }, minutos * 60 * 1000);
                
                return;
            }

            // 2. Menu Inicial (Se saudar com Oi, Olá, etc.)
            if (['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'].includes(inputLower)) {
                const menu = `Olá! Eu sou o assistente virtual do Daniel Moreira Candinho. Escolha uma das opções digitando o número correspondente:\n\n1. Redes Sociais 🌐\n2. Horário de Atendimento ⏰\n3. Deixar um Recado 📝\n4. Receber arquivo PDF 📄\n\n💡 *Dica:* Para criar um alerta, use:\n\`!lembrar 5 Fazer o teste do bot\``;
                await sock.sendMessage(from, { text: menu });
                return;
            } 

            // 3. Opções do Menu (1, 2, 3 ou 4)
            if (inputLower === '1') {
                await sock.sendMessage(from, { text: `Aqui estão as minhas redes sociais:\n• Instagram: ://instagram.com\n• GitHub: ://github.com` });
            } else if (inputLower === '2') {
                await sock.sendMessage(from, { text: `Meu horário de atendimento é das 10h às 17h horas. ⏰` });
            } else if (inputLower === '3') {
                await sock.sendMessage(from, { text: `Pode digitar o seu recado aqui embaixo! Assim que eu visualizar, eu te respondo. 📝` });
            } else if (inputLower === '4') {
                // Mensagem de aviso antes de mandar o arquivo
                await sock.sendMessage(from, { text: `Estou preparando o seu documento... Um segundo! ⏳` });
                
                // COMANDO QUE ENVIA O PDF DE VERDADE
                await sock.sendMessage(from, { 
                    document: { url: "https://w3.org" }, 
                    mimetype: "application/pdf", 
                    fileName: "Documento_Daniel.pdf" 
                });
            } 
            // 4. Se for qualquer texto aleatório que não seja comando ou número
            else {
                await sock.sendMessage(from, { text: `Opção inválida. ❌\nPor favor, digite 1, 2, 3 ou 4, ou envie "Oi" para ver o menu.` });
            }
        }
    });
}

connectToWhatsApp();
