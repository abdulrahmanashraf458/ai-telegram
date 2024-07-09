const TelegramBot = require('node-telegram-bot-api');
const { Hercai } = require('hercai');
const Tesseract = require('tesseract.js');
const fetch = require('node-fetch');
const { telegramToken } = require('./config.json');

const herc = new Hercai();
const bot = new TelegramBot(telegramToken, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  let fullContent = msg.text || '';

  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const imageUrl = `https://api.telegram.org/file/bot${telegramToken}/${file.file_path}`;
    
    try {
      const extractedText = await extractTextFromImage(imageUrl);
      await bot.sendMessage(chatId, `Extracted Text: ${extractedText}`);
      fullContent += ` [Image Content: ${extractedText}]`;
    } catch (error) {
      await bot.sendMessage(chatId, 'Sorry, I had trouble reading that image.');
      return;
    }
  }

  try {
    const response = await herc.question({ model: "v3-beta", content: fullContent });
    await bot.sendMessage(chatId, response.reply);
  } catch (error) {
    await bot.sendMessage(chatId, 'Sorry, I ran into a bit of trouble trying to respond.');
  }
});

async function extractTextFromImage(url) {
  try {
    const image = await fetch(url).then(res => res.buffer());
    const textFromImage = await Tesseract.recognize(image, 'eng');
    return textFromImage.data.text;
  } catch (error) {
    return "Error"
  }
}

console.log('Bot is running...');
