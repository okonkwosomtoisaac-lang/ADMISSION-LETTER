import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import config from './config.js'

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update

        if (qr) {
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log('✅ Bot Connected!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const messageText =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (!messageText) return
        if (!messageText.startsWith(config.prefix)) return

        const args = messageText.slice(1).trim().split(/ +/)
        const command = args.shift().toLowerCase()

        const from = msg.key.remoteJid

        // MENU COMMAND
        if (command === "menu") {
            await sock.sendMessage(from, {
                text: `
┏▣ ◈ *꧁༆𝗦𝗢𝗠𝗦𝗠𝗜𝗧𝗛༆꧂* ◈
┃ *OWNER* : ${config.ownerName}
┃ *PREFIX* : [ ${config.prefix} ]
┃ *MODE* : ${config.mode}
┗▣

✨ *MAIN MENU* ✨
➽ ${config.prefix}ping
➽ ${config.prefix}menu
➽ ${config.prefix}owner
                `
            })
        }

        // PING COMMAND
        if (command === "ping") {
            await sock.sendMessage(from, { text: "🏓 Pong!" })
        }

        // OWNER COMMAND
        if (command === "owner") {
            await sock.sendMessage(from, {
                text: `👑 Owner: ${config.ownerName}`
            })
        }
    })
}

startBot()
