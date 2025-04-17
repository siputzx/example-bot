/*
 * Base Simpel
 * Created By Siputzx Production
 */

const {
  default: makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  useMultiFileAuthState,
  downloadContentFromMessage
} = require('baileys')
const {Boom} = require('@hapi/boom')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const pino = require('pino')
const fs = require('fs')
const readline = require('readline')
const {
  imageToWebp,
  videoToWebp,
  webpToImage,
  webpToVideo,
  writeExifImg,
  writeExifVid,
  writeExif,
  toAudio,
  toPTT,
  toVideo
} = require('./lib/converter')

const store = makeInMemoryStore({
  logger: pino().child({level: 'silent', stream: 'store'})
})

const question = text => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise(resolve => {
    rl.question(text, resolve)
  })
}

async function startBotz() {
  const {state, saveCreds} = await useMultiFileAuthState('session')
  const ptz = makeWASocket({
    logger: pino({level: 'silent'}),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  })

  if (!ptz.authState.creds.registered) {
    const phoneNumber = await question('𝙼𝚊𝚜𝚞𝚔𝚊𝚗 𝙽𝚘𝚖𝚎𝚛 𝚈𝚊𝚗𝚐 𝙰𝚔𝚝𝚒𝚏 𝙰𝚠𝚊𝚕𝚒 𝙳𝚎𝚗𝚐𝚊𝚗 𝟼𝟸 :\n')
    let code = await ptz.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join('-') || code
    console.log(`𝙲𝙾𝙳𝙴 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 :`, code)
  }

  store.bind(ptz.ev)

  ptz.ev.on('messages.upsert', async chatUpdate => {
    try {
      mek = chatUpdate.messages[0]
      if (!mek.message) return
      mek.message = Object.keys(mek.message)[0] === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message
      if (mek.key && mek.key.remoteJid === 'status@broadcast') return
      if (!ptz.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
      if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
      m = smsg(ptz, mek, store)
      require('./case')(ptz, m, chatUpdate, store)
    } catch (err) {
      console.log(err)
    }
  })

  // Setting
  ptz.decodeJid = jid => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {}
      return (decode.user && decode.server && decode.user + '@' + decode.server) || jid
    } else return jid
  }

  ptz.public = true

  ptz.serializeM = m => smsg(ptz, m, store)
  ptz.ev.on('connection.update', update => {
    const {connection, lastDisconnect} = update
    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode
      if (
        reason === DisconnectReason.badSession ||
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.connectionReplaced ||
        reason === DisconnectReason.restartRequired ||
        reason === DisconnectReason.timedOut
      ) {
        startBotz()
      } else if (reason === DisconnectReason.loggedOut) {
      } else {
        ptz.end(`Unknown DisconnectReason: ${reason}|${connection}`)
      }
    } else if (connection === 'open') {
      console.log('[Connected] ' + JSON.stringify(ptz.user.id, null, 2))
    }
  })

  ptz.ev.on('creds.update', saveCreds)

  ptz.sendText = (jid, text, quoted = '', options) => ptz.sendMessage(jid, {text: text, ...options}, {quoted})

  ptz.downloadMediaMessage = async message => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

  ptz.getFile = async (PATH, returnAsFilename) => {
    let res, filename
    const tmpDir = path.join(__dirname, './tmp')
    if (!fs.existsSync(tmpDir)) await fs.promises.mkdir(tmpDir, {recursive: true})

    const data = Buffer.isBuffer(PATH)
      ? PATH
      : /^data:.*?\/.*?;base64,/i.test(PATH)
        ? Buffer.from(PATH.split`,`[1], 'base64')
        : /^https?:\/\//i.test(PATH)
          ? await (async () => {
              res = await axios.get(PATH, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                  'Sec-Fetch-Mode': 'navigate',
                  'Sec-Fetch-Site': 'same-origin',
                  'Sec-Fetch-User': '?1',
                  'Upgrade-Insecure-Requests': '1'
                }
              })
              if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
              return Buffer.from(res.data)
            })()
          : fs.existsSync(PATH)
            ? ((filename = PATH), fs.readFileSync(PATH))
            : typeof PATH === 'string'
              ? Buffer.alloc(0)
              : Buffer.alloc(0)

    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
    if (data.length === 0) throw new Error('Empty file')

    const type = (await FileType.fromBuffer(data)) || {
      mime: 'application/octet-stream',
      ext: 'bin'
    }

    if (data && returnAsFilename && !filename) {
      filename = path.join(tmpDir, `${Date.now()}-${Math.random().toString(36).slice(2)}.${type.ext}`)
      await fs.promises.writeFile(filename, data)
    }

    return {
      res,
      filename,
      ...type,
      data,
      deleteFile: async () => {
        if (filename && fs.existsSync(filename)) {
          try {
            await fs.promises.unlink(filename)
          } catch (e) {
            console.warn(`Failed to delete file ${filename}:`, e.message)
          }
        }
      }
    }
  }

  ptz.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
    let type
    try {
      type = await ptz.getFile(path, true)
      let {res, data: file, filename: pathFile, mime, deleteFile} = type

      let opt = {filename}
      if (quoted) opt.quoted = quoted

      let mtype = '',
        mimetype = mime,
        convert

      if (/webp/.test(mime) || (/image/.test(mime) && options.asSticker)) {
        mtype = 'sticker'
      } else if (/image/.test(mime) || (/webp/.test(mime) && options.asImage)) {
        mtype = 'image'
      } else if (/video/.test(mime)) {
        mtype = 'video'
      } else if (/audio/.test(mime)) {
        convert = await (ptt ? toPTT : toAudio)(file, type.ext)
        if (pathFile && fs.existsSync(pathFile)) await deleteFile()
        file = convert.data
        pathFile = convert.filename
        mtype = 'audio'
        mimetype = 'audio/ogg; codecs=opus'
      } else {
        mtype = options.asDocument ? 'document' : 'document'
      }

      const message = {
        ...options,
        caption,
        ptt,
        [mtype]: {url: pathFile},
        mimetype
      }

      let m
      try {
        m = await ptz.sendMessage(jid, message, {...opt, ...options})
      } catch (e) {
        console.error('Primary send failed:', e.message)
        try {
          message[mtype] = file
          m = await ptz.sendMessage(jid, {...message}, {...opt, ...options})
        } catch (fallbackErr) {
          console.error('Fallback send failed:', fallbackErr.message)
          m = null
        }
      } finally {
        await deleteFile()
        if (convert?.filename && fs.existsSync(convert.filename)) {
          try {
            await fs.promises.unlink(convert.filename)
          } catch (e) {
            console.warn(`Failed to delete converted file ${convert.filename}:`, e.message)
          }
        }
      }
      return m
    } catch (e) {
      console.error('Error in sendFile:', e.message)
      throw e
    } finally {
      if (type?.deleteFile) await type.deleteFile()
    }
  }
  ptz.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`,`[1], 'base64')
        : /^https?:\/\//.test(path)
          ? await await getBuffer(path)
          : fs.existsSync(path)
            ? fs.readFileSync(path)
            : Buffer.alloc(0)
    let buffer
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options)
    } else {
      buffer = await videoToWebp(buff)
    }
    await ptz.sendMessage(jid, {sticker: {url: buffer}, ...options}, {quoted})
    return buffer
  }

  ptz.downloadMediaMessage = async message => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

  return ptz
}

startBotz()

function smsg(ptz, m, store) {
  if (!m) return m
  let M = proto.WebMessageInfo
  if (m.key) {
    m.id = m.key.id
    m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat.endsWith('@g.us')
    m.sender = ptz.decodeJid((m.fromMe && ptz.user.id) || m.participant || m.key.participant || m.chat || '')
    if (m.isGroup) m.participant = ptz.decodeJid(m.key.participant) || ''
  }
  if (m.message) {
    m.mtype = getContentType(m.message)
    m.msg = m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]
    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      (m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId) ||
      (m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId) ||
      (m.mtype == 'viewOnceMessage' && m.msg.caption) ||
      m.text
    let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null)
    m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
    if (m.quoted) {
      let type = getContentType(quoted)
      m.quoted = m.quoted[type]
      if (['productMessage'].includes(type)) {
        type = getContentType(m.quoted)
        m.quoted = m.quoted[type]
      }
      if (typeof m.quoted === 'string')
        m.quoted = {
          text: m.quoted
        }
      m.quoted.mtype = type
      m.quoted.id = m.msg.contextInfo.stanzaId
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
      m.quoted.sender = ptz.decodeJid(m.msg.contextInfo.participant)
      m.quoted.fromMe = m.quoted.sender === ptz.decodeJid(ptz.user.id)
      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        ''
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false
        let q = await store.loadMessage(m.chat, m.quoted.id, conn)
        return exports.smsg(conn, q, store)
      }
      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id
        },
        message: quoted,
        ...(m.isGroup ? {participant: m.quoted.sender} : {})
      }))
      m.quoted.delete = () => ptz.sendMessage(m.quoted.chat, {delete: vM.key})
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) => ptz.copyNForward(jid, vM, forceForward, options)
      m.quoted.download = () => ptz.downloadMediaMessage(m.quoted)
    }
  }
  if (m.msg.url) m.download = () => ptz.downloadMediaMessage(m.msg)
  m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''
  m.reply = (text, chatId = m.chat, options = {}) =>
    Buffer.isBuffer(text) ? ptz.sendMedia(chatId, text, 'file', '', m, {...options}) : ptz.sendText(chatId, text, m, {...options})
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => ptz.copyNForward(jid, m, forceForward, options)

  return m
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Update ${__filename}`)
  delete require.cache[file]
  require(file)
})
