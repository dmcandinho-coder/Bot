const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot do Daniel Moreira Candinho está online no Render! 🤖');
});
app.listen(port, () => console.log(`Servidor rodando na porta \${port}`));

// Configura o fuso horário padrão para o servidor
process.env.TZ = 'America/Sao_Paulo';

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
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            
            if (!text) return;
            const input = text.trim();
            const inputLower = input.toLowerCase();

            // =============== FUNÇÃO 3: COMANDO DE LEMBRETE ===============
            if (inputLower.startsWith('!lembrar')) {
                // Exemplo de uso: !lembrar 10 Comprar pão (lembrar em 10 minutos)
                const partes = input.split(' ');
                const minutos = parseInt(partes[1]);
                const tarefa = partes.slice(2).join(' ');

                if (isNaN(minutos) || !tarefa) {
                    await sock.sendMessage(from, { text: `⚠️ *Como usar o lembrete:* \nDigite exatamente:\n\`!lembrar [minutos] [sua tarefa]\`\n\n*Exemplo:* \`!lembrar 10 Tomar o café\`` });
                    return;
                }

                await sock.sendMessage(from, { text: `⏰ *Lembrete agendado com sucesso!* \nDaqui a *\${minutos} minutos* eu vou te avisar sobre: _"\${tarefa}"_` });

                // Agenda o envio da mensagem usando o tempo correto
                setTimeout(async () => {
                    const alerta = `🔔 *ALERTA DE LEMBRETE, DANIEL!* 🔔\n\n⏰ Está na hora de:\n👉 *\${tarefa}*`;
                    await sock.sendMessage(from, { text: alerta });
                }, minutos * 60 * 1000);
                
                return; // Sai da execução para não cair no menu
            }
            // ============================================================

            // 1. Saudação inicial (Manda apenas o Menu)
            if (inputLower === 'oi' || inputLower === 'olá' || inputLower === 'ola' || inputLower === 'bom dia' || inputLower === 'boa tarde' || inputLower === 'boa noite') {
                const menu = `Olá! Eu sou o assistente virtual do Daniel Moreira Candinho. Escolha uma das opções abaixo digitando o número correspondente:\n\n1. Redes Sociais 🌐\n2. Horário de Atendimento ⏰\n3. Deixar um Recado 📝\n\n💡 *Dica:* Quer agendar um alerta? Digite:\n\`!lembrar 5 Fazer o teste do bot\``;
                await sock.sendMessage(from, { text: menu });
            } 
            // 2. Opção 1 - Redes Sociais
            else if (inputLower === '1') {
                const opt1 = `Aqui estão as minhas redes sociais:\n• Instagram: ://instagram.com\n• GitHub: ://github.com`;
                await sock.sendMessage(from, { text: opt1 });
            } 
            // 3. Opção 2 - Horários
            else if (inputLower === '2') {
                const opt2 = `Meu horário de atendimento é das 10h às 17h horas. ⏰`;
                await sock.sendMessage(from, { text: opt2 });
            } 
            // 4. Opção 3 - Recado
            else if (inputLower === '3') {
                const opt3 = `Pode digitar o seu recado aqui embaixo! Assim que eu visualizar, eu te respondo. 📝`;
                await sock.sendMessage(from, { text: opt3 });
            }
            // 5. Se digitar qualquer outro número ou texto confuso
            else {
                const erro = `Opção inválida. ❌\nPor favor, digite 1, 2 ou 3 para escolher uma opção ou envie "Oi" para ver o menu novamente.\n\nPara agendar um lembrete use:\n\`!lembrar [minutos] [tarefa]\``;
                await sock.sendMessage(from, { text: erro });
            }
        }
    });
}

connectToWhatsApp();

