const {cmd , commands} = require('../command')
const fg = require('api-dylux')
const yts = require('yt-search')

// Function to extract the video ID from youtu.be or YouTube links
function extractYouTubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|playlist\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to convert any YouTube URL to a full YouTube watch URL
function convertYouTubeLink(q) {
    const videoId = extractYouTubeId(q);
    if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return q;
}

cmd({
    pattern: "song3",
    desc: "To download songs.",
    react: "🎵",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return reply("Please give me a URL or title.");

        q = convertYouTubeLink(q);
        const search = await yts(q);
        const data = search.videos[0];
        const url = data.url;

        let desc = `
╭───────────────────╮
*│✘🎧YT-SONG-DOWNLOADER-ZAZIE🎧✘*│
├───────────────────╯
*│➢♠ ᴛɪᴛʟᴇ*:- ${data.title}
*│➢👀 ᴠɪᴇᴡꜱ*:- ${data.views}
*│➢⏱️ ᴅᴜʀᴀᴛɪᴏɴ*:- ${data.timestamp}
*│➢⏳ ᴛɪᴍᴇ ᴀɢᴏ*:- ${data.ago}
*│➢📎 ᴜʀʟ*:- ${data.url}
│
*│⬇️ To Downlaod Send:*
│
│ 1.Audio 🎧
│ 2.Document 📁
│
╰─────────────────◉◉►
`;

        // Send the initial message and store the message ID
        const sentMsg = await conn.sendMessage(from, {
            text: desc,
            contextInfo: {
                externalAdReply: {
                    title: data.title,
                    body: data.ago,
                    thumbnailUrl: data.thumbnail,
                    sourceUrl: data.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
        const messageID = sentMsg.key.id; // Save the message ID for later reference


        // Listen for the user's response
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;
            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const from = mek.key.remoteJid;
            const sender = mek.key.participant || mek.key.remoteJid;

            // Check if the message is a reply to the previously sent message
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                // React to the user's reply (the "1" or "2" message)
                await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

                const down = await fg.yta(url);
                const downloadUrl = down.dl_url;

                // React to the upload (sending the file)
                await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

                if (messageType === '1') {
                    // Handle option 1 (Audio File)
                    await conn.sendMessage(from, { audio: { url: downloadUrl }, mimetype: "audio/mpeg" }, { quoted: mek });
                } else if (messageType === '2') {
                    // Handle option 2 (Document File)
                    await conn.sendMessage(from, {
                        document: { url: downloadUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${data.title}.mp3`,
                        caption: "> Qᴜᴇᴇɴ-ᴢᴀᴢɪᴇ-ᴍᴅ"
                    }, { quoted: mek });
                }

                // React to the successful completion of the task
                await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

                console.log("Response sent successfully");
            }
        });

    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});