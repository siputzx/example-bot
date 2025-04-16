/*
 * Base Simpel
 * Created By Siputzx Production
 */

require('./config')
const fs = require('fs')
const util = require('util')
const fetch = require('node-fetch')
const {exec} = require('child_process')

module.exports = async (ptz, m) => {
  try {
    const body =
      (m.mtype === 'conversation' && m.message.conversation) ||
      (m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
      (m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
      (m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
      (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
      (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
      (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
        ? (m.mtype === 'conversation' && m.message.conversation) ||
          (m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
          (m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
          (m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
          (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
          (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
          (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
        : ''

    const budy = typeof m.text === 'string' ? m.text : ''
    const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/
    const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.'
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const text = (q = args.join(' '))
    const sender = m.key.fromMe ? ptz.user.id.split(':')[0] + '@s.whatsapp.net' || ptz.user.id : m.key.participant || m.key.remoteJid
    const botNumber = await ptz.decodeJid(ptz.user.id)
    const senderNumber = sender.split('@')[0]
    const isCreator =
      (m && m.sender && [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false
    const pushname = m.pushName || `${senderNumber}`
    const isBot = botNumber.includes(senderNumber)

    switch (command) {
      case 'llama':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let prompt = 'You are a helpful assistant.'

          let {data} = await api.get('/ai/llama33', {params: {prompt, text}})
          m.reply(data.data)
        }
        break
      case 'llama-turbo':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let {data} = await api.get('/ai/meta-llama-33-70B-instruct-turbo', {params: {content: text}})
          m.reply(data.data)
        }
        break
      case 'claude':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let {data} = await api.get('/ai/claude-sonnet-37', {params: {content: text}})
          m.reply(data.data)
        }
        break

      case 'nous-hermes':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let {data} = await api.get('/ai/nous-hermes', {params: {content: text}})
          m.reply(data.data)
        }
        break
      case 'lepton':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let {data} = await api.get('/ai/lepton', {params: {content: text}})
          m.reply(data.data)
        }
        break
      case 'bard':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let {data} = await api.get('/ai/bard', {params: {query: text}})
          m.reply(data.data)
        }
        break
      case 'joko':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }
          let {data} = await api.get('/ai/joko', {params: {content: text}})
          let {data: res} = await api.get('/tools/tts', {
            params: {text: data.data, voice: 'jv-ID-DimasNeural', rate: '0%', pitch: '0Hz', volume: '0%'},
            responseType: 'arraybuffer'
          })
          await ptz.sendFile(m.chat, res, '', ``, m)
        }
        break
      case 'bard-thinking':
        {
          if (!text) {
            return m.reply('Mau nanya apa sama ai')
          }

          let {data} = await api.get('/ai/bard-thinking', {params: {query: text}})

          let response = data.data
          let thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/)

          if (thinkMatch) {
            let thinkRaw = thinkMatch[0].trim()
            let thinkText = thinkMatch[1]

            let modifiedThink = thinkText
              .split('\n')
              .map(line => {
                if (line.trim() === '') return ''
                return '> ' + line.trim()
              })
              .join('\n')

            let afterThink = response.split(thinkMatch[0])[1]?.trim() || ''

            let finalText = `${modifiedThink}\n\n${afterThink}`

            m.reply(finalText)
          } else {
            m.reply(response)
          }
        }
        break
      case 'bukalapak':
        {
          if (!text) return m.reply(`mau belanja apa nih, di bukalapak\n\nExample: ${prefix}${command} hp`)
          const response = await api.get('/search/bukalapak', {params: {content: text}})
          let result = `*Hasil Pencarian: _${text}_*\n`
          if (Array.isArray(response.data.data)) {
            response.data.data.forEach(item => {
              result += `┌ ◦ *Title :* ${item.title}\n│ ◦ *Harga :* ${item.harga}\n│ ◦ *Image :* ${item.image}\n└ ◦ *Link :* ${item.link}\n\n`
            })
          } else {
            result = 'No data found'
          }
          m.reply(result.trim())
        }
        break
      case 'seegore':
        {
          if (!text) return m.reply(`mau ngapain jir nyari gore☠️\n\nExample: ${prefix}${command} train`)
          const response = await api.get('/search/seegore', {params: {content: text}})

          let result = `*Hasil Pencarian: _${text}_*\n`
          if (Array.isArray(response.data.data)) {
            response.data.data.forEach(item => {
              result += `┌ ◦ *Judul :* ${item.judul}\n│ ◦ *Tag :* ${item.uploader}\n└ ◦ *Link :* ${item.link}\n\n`
            })
          } else {
            result = 'No data found'
          }
          m.reply(result.trim())
        }
        break
      case 'lahelu':
        {
          if (!text) return m.reply(`mau nyari apa di lahelu\n\nExample: ${prefix}${command} kucing`)
          const response = await api.get('/search/lahelu', {params: {content: text}})

          let result = `*Hasil Pencarian: _${text}_*\n`
          if (Array.isArray(response.data.data)) {
            response.data.data.forEach(item => {
              result += `
┌ ◦ *Title :* ${item.title}
│ ◦ *Post ID :* ${item.postID}
│ ◦ *Media :* ${item.media}
└ ◦ *Search Vector :* ${item.searchVector}\n\n`
            })
          } else {
            result = 'No data found'
          }
          m.reply(result.trim())
        }
        break
      case 'playstore':
        {
          if (!text) return m.reply(`mau nyari apa di playstore\n\nExample: ${prefix}${command} free fire`)
          const response = await api.get('/search/playstore', {params: {content: text}})

          let result = `*Hasil Pencarian: _${text}_*\n`
          if (Array.isArray(response.data.data)) {
            response.data.data.forEach(item => {
              result += `
┌ ◦ *Nama :* ${item.nama}
│ ◦ *Rate :* ${item.rate2}
│ ◦ *Developer :* ${item.developer}
└ ◦ *Link :* ${item.link_dev}\n\n`
            })
          } else {
            result = 'No data found'
          }
          m.reply(result.trim())
        }
        break
      case 'soundcloud':
        {
          if (!text) return m.reply(`mau nyari apa di soundcloud\n\nExample: ${prefix}${command} duka`)
          const response = await api.get('/search/soundcloud', {params: {content: text}})

          let result = `*Hasil Pencarian: _${text}_*\n`
          if (Array.isArray(response.data.data)) {
            response.data.data.forEach(item => {
              result += `
┌ ◦ *Title :* ${item.title}
└ ◦ *Link :* ${item.link}\n\n`
            })
          } else {
            result = 'No data found'
          }
          m.reply(result.trim())
        }
        break
      case 'pinterest':
        {
          if (!text) return m.reply(`mau nyari apa di pinterest\n\nExample: ${prefix}${command} kucing`)
          const response = await api.get('/search/pinterest', {params: {content: text}})
          if (Array.isArray(response.data.data)) {
            const pins = response.data.data
            const randomPin = pins[Math.floor(Math.random() * pins.length)]
            await ptz.sendFile(
              m.chat,
              randomPin.images_url,
              '',
              `┌ ◦ *Nama:* ${text}\n│ ◦ *Created:* ${randomPin.created_at}\n└ ◦ *Link:* ${randomPin.pin}`,
              m
            )
          } else {
            m.reply('No data found')
          }
        }
        break
      case 'tiktoks':
        {
          if (!text) return m.reply(`mau nyari apa di tiktok\n\nExample: ${prefix}${command} sad vibes`)
          const response = await api.get('/search/tiktok', {params: {content: text}})
          if (Array.isArray(response.data.data)) {
            const res = response.data.data
            const result = res[Math.floor(Math.random() * res.length)]
            await ptz.sendFile(
              m.chat,
              result.play,
              '',
              `┌ ◦ *Title:* ${result.title}\n│ ◦ *Duration:* ${result.duration}\n└ ◦ *Music:* ${result.music}`,
              m
            )
          } else {
            m.reply('No data found')
          }
        }
        break
      case 'quotesanime':
        {
          if (!text) return m.reply(`mau nyari quotes anime apa?\n\nExample: ${prefix}${command} Anna Yamada`)
          const response = await api.get('/search/quotesanime', {
            params: {
              text: text
            }
          })
          if (Array.isArray(response.data.data)) {
            const res = response.data.data
            const result = res[Math.floor(Math.random() * res.length)]
            await ptz.sendMessage(m.chat, {
              text: `┌ ◦ *Karakter:* ${result.karakter}\n│ ◦ *Anime:* ${result.anime}\n└ ◦ *Quotes:* ${result.quotes}`,
              contextInfo: {
                externalAdReply: {
                  title: result.episode,
                  body: result.up_at,
                  thumbnailUrl: result.gambar,
                  sourceUrl: result.link,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            })
          } else {
            m.reply('No data found')
          }
        }
        break
      case 'get':
        {
          if (!/^https?:\/\//.test(text)) return m?.reply('Awali *URL* dengan http:// atau https://')
          let _url = new URL(text)
          let url = `${_url.origin}${_url.pathname}${_url.search}`
          let res = await fetch(url)
          if (res.headers.get('content-length') > 100 * 1024 * 1024 * 1024) {
            delete res
            m?.reply(`Content-Length: ${res.headers.get('content-length')}`)
          }
          if (!/text|json/.test(res.headers.get('content-type'))) return ptz.sendFile(m?.chat, url, 'file', `2024 © PutuOfc`, m)
          let txt = await res.buffer()
          try {
            txt = util.format(JSON.parse(txt + ''))
          } catch (e) {
            txt = txt + ''
          } finally {
            m?.reply(txt.slice(0, 65536) + '')
          }
        }
        break
      case 'laheludl':
        {
          if (!text) return m.reply(`mau download apa?\n\nExample: ${prefix}${command} https://lahelu.com/post/P6De0IuvI`)
          const response = await api.get('/downloader/lahelu', {params: {content: text}})
          const result = response.data.data
          await ptz.sendFile(
            m.chat,
            result.media,
            '',
            `┌ ◦ *Title:* ${result.title}\n│ ◦ *Up Votes:* ${result.totalUpvotes}\n└ ◦ *Created:* ${result.createTime}`,
            m
          )
        }
        break
      case 'tiktokdl':
      case 'ttdl':
        {
          if (!text) return m.reply(`mau download apa?\n\nExample: ${prefix}${command} https://vt.tiktok.com/ZSYmxyBnp/`)
          const response = await api.get('/downloader/tiktok', {params: {content: text}})
          const result = response.data.data

          await ptz.sendFile(
            m.chat,
            result.downloads.data[0].link,
            '',
            `┌ ◦ *Username:* ${result.user.username}\n└ ◦ *Description:* ${result.user.description}`,
            m
          )
        }
        break
      case 'instagramdl':
      case 'igdl':
        {
          if (!text)
            return m.reply(
              `mau download apa?\n\nExample: ${prefix}${command} https://www.instagram.com/reel/C6F57rGrV_x/?igsh=OXJxanVpdHdiczVi`
            )
          const response = await api.get('/d/igdl', {
            params: {
              url: text
            }
          })
          const result = response.data.data[0]

          await ptz.sendFile(m.chat, result.url, '', `Downloader Instagram ✅️`, m)
        }
        break
      case 'twitter':
      case 'twdl':
        {
          if (!text) return m.reply(`mau download apa?\n\nExample: ${prefix}${command} https://twitter.com/9GAG/status/1661175429859012608`)
          const response = await api.get('/d/twitter', {
            params: {
              url: text
            }
          })
          const result = response.data.data

          await ptz.sendFile(
            m.chat,
            result.downloadLink,
            '',
            `┌ ◦ *Title:* ${result.videoTitle}\n└ ◦ *Description:* ${result.videoDescription}`,
            m
          )
        }
        break
      case 'soundclouddl':
      case 'scldl':
        {
          if (!text)
            return m.reply(`mau download apa?\n\nExample: ${prefix}${command} https://m.soundcloud.com/teguh-hariyadi-652597010/anji-dia`)
          const response = await api.get('/d/twitter', {
            params: {
              url: text
            }
          })
          const result = response.data.data

          await ptz.sendFile(m.chat, result.url, '', ``, m)
        }
        break
      case 'capcutdl':
      case 'cpcdl':
        {
          if (!text) return m.reply(`mau download apa?\n\nExample: ${prefix}${command} https://www.capcut.com/t/Zs8MPAKjG`)
          const response = await api.get('/downloader/capcut', {
            params: {
              text: text
            }
          })
          const result = response.data.data

          await ptz.sendFile(
            m.chat,
            result.originalVideoUrl,
            '',
            `┌ ◦ *Title:* ${result.title}\n│ ◦ *Views* ${result.usage}\n└ ◦ *Description:* ${result.description}`,
            m
          )
        }
        break
      case 'facebookdl':
      case 'fbdl':
        {
          if (!text)
            return m.reply(
              `mau download apa?\n\nExample: ${prefix}${command} https://www.facebook.com/alanwalkermusic/videos/277641643524720`
            )
          const response = await api.get('/downloader/facebook', {
            params: {
              text: text
            }
          })
          const result = response.data.data

          await ptz.sendFile(
            m.chat,
            result.sd,
            '',
            `┌ ◦ *Title:* ${result.title}\n└ ◦ *Duration:* ${new Date(result.duration_ms).toISOString().substr(11, 8)}`,
            m
          )
        }
        break
      case 'pinterestdl':
      case 'pindl':
        {
          if (!text) return m.reply(`mau download apa?\n\nExample: ${prefix}${command} https://id.pinterest.com/pin/862439397377053654/`)
          const response = await api.get('/downloader/pinterest', {
            params: {
              text: text
            }
          })
          const result = response.data.data

          await ptz.sendFile(m.chat, result.url, '', `┌ ◦ *ID:* ${result.id}\n└ ◦ *Createf at:* ${result.created_at}`, m)
        }
        break
      case 'stalkig':
        {
          if (!text) return m.reply(`mau stalking profil Instagram siapa?\n\nExample: ${prefix}${command} jokowi`)
          const response = await api.get('/stalker/instagram', {
            params: {
              text: text
            }
          })
          const result = response.data.data
          await ptz.sendMessage(m.chat, {
            text: `* *Profile*\n┌ ◦ *Username:* ${result.username}\n└ ◦ *Description:* ${result.description}\n\n* *Statistik*\n┌ ◦ *Total Postingan:* ${result.stats.posts}\n│ ◦ *Followers:* ${result.stats.followers}\n└ ◦ *Following:* ${result.stats.following}`,
            contextInfo: {
              externalAdReply: {
                title: result.username,
                body: 'Stalker Instagram',
                thumbnailUrl: result.profileImageUrl,
                sourceUrl: 'https://Instagram.com/' + text,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          })
        }
        break
      case 'stalktt':
        {
          if (!text) return m.reply(`mau stalking profil tiktok siapa?\n\nExample: ${prefix}${command} mrbeast`)
          const response = await api.get('/stalker/tiktok', {
            params: {
              text: text
            }
          })
          const result = response.data.data
          await ptz.sendMessage(m.chat, {
            text: `* *Profile*\n┌ ◦ *Username:* ${result.user.nickname}\n│ ◦ *Verified:* ${result.user.verified ? 'Yes' : 'No'}\n│ ◦ *Private Account:* ${result.user.privateAccount ? 'Yes' : 'No'}\n└ ◦ *Signature:* ${result.user.signature}\n\n* *Statistik*\n┌ ◦ *Total Postingan:* ${result.stats.videoCount}\n│ ◦ *Followers:* ${result.stats.followerCount}\n└ ◦ *Following:* ${result.stats.followingCount}`,
            contextInfo: {
              externalAdReply: {
                title: result.user.nickname,
                body: 'Stalker Tiktok',
                thumbnailUrl: result.user.avatarThumb,
                sourceUrl: 'https://www.tiktok.com/@' + result.user.uniqueId,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          })
        }
        break
      case 'stalkgh':
        {
          if (!text) return m.reply(`mau stalking profil tiktok siapa?\n\nExample: ${prefix}${command} dikaardnt`)
          const response = await api.get('/stalker/github', {
            params: {
              text: text
            }
          })
          const result = response.data.data
          await ptz.sendMessage(m.chat, {
            text: `* *Profile*\n┌ ◦ *Username:* ${result.username}\n│ ◦ *Repository Public:* ${result.public_repo}\n│ ◦ *Gist Public:* ${result.public_gists}\n└ ◦ *Bio:* ${result.bio}\n\n* *Statistik*\n┌ ◦ *Created at:* ${result.ceated_at}\n│ ◦ *Followers:* ${result.followers}\n└ ◦ *Following:* ${result.following}`,
            contextInfo: {
              externalAdReply: {
                title: result.username,
                body: 'Stalker Github User',
                thumbnailUrl: result.profile_pic,
                sourceUrl: result.url,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          })
        }
        break
      case 'meme':
        {
          api
            .get('/r/lahelu')
            .then(async ({data}) => {
              const result = data.data
              const randomMeme = result[Math.floor(Math.random() * result.length)]
              const mediaUrl = randomMeme.media
              const createdAt = new Date(randomMeme.createTime).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })

              await ptz.sendFile(
                m.chat,
                mediaUrl,
                '',
                `┌ ◦ *Title:* ${randomMeme.title}
│ ◦ *Upvotes:* ${randomMeme.totalUpvotes}
└ ◦ *Created:* ${createdAt}`,
                m
              )
            })
            .catch(err => {
              console.error(err)
              m.reply('Maaf Sayang~ Gagal ngambil meme, coba lagi nanti ya!')
            })
        }
        break
      case 'an1':
        {
          if (!text) return m.reply(`Mau nyari apa di an1? Misalnya: ${prefix}${command} pou`)

          const response = await api.get('/apk/an1', {params: {search: text}})
          if (Array.isArray(response.data.data)) {
            const res = response.data.data
            const firstImage = res[0].image

            let message = ''
            for (const item of res) {
              message += `┌ ◦ *Title:* ${item.title}
│ ◦ *Developer:* ${item.developer}
│ ◦ *Rating:* ${item.rating.value} (${item.rating.percentage}%)
└ ◦ *Link:* ${item.link}\n\n`
            }

            await ptz.sendFile(m.chat, firstImage, '', message, m)
          } else {
            m.reply('No data found')
          }
        }
        break
      case 'happymod':
        {
          if (!text) return m.reply(`Mau nyari apa di HappyMod? Misalnya: ${prefix}${command} pou`)

          const response = await api.get('/apk/happymod', {params: {search: text}})
          if (Array.isArray(response.data.data)) {
            const res = response.data.data
            const firstImage = res[0].image || '' // fallback kalau ga ada gambar

            let message = ''
            for (const item of res) {
              const rating =
                typeof item.rating === 'object' ? `${item.rating.value || 'N/A'} (${item.rating.percentage || '0'}%)` : item.rating || 'N/A'
              const mod = Array.isArray(item.modFeatures) ? item.modFeatures.join(', ') : item.modFeatures || 'N/A'
              const version = item.version || 'N/A'

              message += `┌ ◦ *Title:* ${item.title}
│ ◦ *Versi:* ${version}
│ ◦ *Rating:* ${rating}
│ ◦ *Fitur Mod:* ${mod}
└ ◦ *Link:* ${item.link}\n\n`
            }

            await ptz.sendFile(m.chat, firstImage, '', message, m)
          } else {
            m.reply('Data nggak ditemukan, Sayang~ Coba kata kunci lain ya!')
          }
        }
        break
      default:
        if (budy.startsWith('$')) {
          if (!isCreator) return
          exec(budy.slice(2), (err, stdout) => {
            if (err) return m.reply(`${err}`)
            if (stdout) return m.reply(stdout)
          })
        }
    }
  } catch (err) {
    console.log(util.format(err))
  }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Update ${__filename}`)
  delete require.cache[file]
  require(file)
})
