const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2');

// Configuración del bot de Telegram
const token = '6789802815:AAHhRFdjH0Mz6blnt8WUbV0xCRHS6SgtPWg';
const bot = new TelegramBot(token, { polling: true });

// Configuración de la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'finance_bot'
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos');
});

// Comando /start
// bot.onText(/\/start/, (msg) => {
//   bot.sendMessage(msg.chat.id, '¡Hola! Soy tu bot de finanzas. Usa /añadircliente <nombre> <apellido> <edad> o /quitarcliente <nombre> <apellido> o /listarclientes para gestionar tus clientes.');
// });
bot.onText(/\/start/, (msg) => {

  bot.sendMessage(msg.chat.id, "¡Hola! Soy tu bot de finanzas. Usa /añadircliente <nombre> <apellido> <edad> o /quitarcliente <nombre> <apellido> o /listarclientes para gestionar tus clientes.", {
  "reply_markup": {
      "keyboard": [["/añadircliente"],["/quitarcliente"], ["/listarclientes"]]
      }
  });
  
  });

// Comando /añadircliente
bot.onText(/\/añadircliente (\w+) (\w+) (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const nombre = match[1];
  const apellido = match[2];
  const edad = parseInt(match[3]);

  const query = 'INSERT INTO clientes (nombre, apellido, edad) VALUES (?, ?, ?)';
  connection.query(query, [nombre, apellido, edad], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error añadiendo cliente.');
      console.error(err);
    } else {
      bot.sendMessage(chatId, `Cliente añadido: ${nombre} ${apellido}, Edad: ${edad}`);
    }
  });
});

// Comando /quitarcliente
bot.onText(/\/quitarcliente (\w+) (\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const nombre = match[1];
  const apellido = match[2];

  const query = 'DELETE FROM clientes WHERE nombre = ? AND apellido = ?';
  connection.query(query, [nombre, apellido], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error quitando cliente.');
      console.error(err);
    } else {
      bot.sendMessage(chatId, `Cliente quitado: ${nombre} ${apellido}`);
    }
  });
});

// Comando /listarclientes
bot.onText(/\/listarclientes/, (msg) => {
  const chatId = msg.chat.id;

  const query = 'SELECT * FROM clientes';
  connection.query(query, (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error recuperando la lista de clientes.');
      console.error(err);
    } else {
      let message = 'Lista de clientes:\n';
      results.forEach((cliente) => {
        message += `- ${cliente.nombre} ${cliente.apellido}, Edad: ${cliente.edad}, Fecha: ${cliente.fecha}, Hora: ${cliente.hora}\n`;
      });
      bot.sendMessage(chatId, message);
    }
  });
});

bot.onText(/getLocation/, (msg) => {
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        [{text: 'Location', request_location: true}],
        [{text: 'Contact', request_contact: true}],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  };
  bot.sendMessage(msg.chat.id, 'Contact and Location request', opts);
});

bot.on('location', (msg) => {
  console.log(msg.location.latitude);
  console.log(msg.location.longitude);
});
