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
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "¡Hola! Soy tu bot de finanzas. Usa /añadirgasto <monto> <idgrupo_gasto> o /quitargasto <idgasto> o /listargastos para gestionar tus gastos.", {
    "reply_markup": {
      "keyboard": [["/añadirgasto"], ["/quitargasto"], ["/listargastos"]]
    }
  });
});

// Comando /añadirgasto
bot.onText(/\/añadirgasto (\w+) (\d+(\.\d{1,2})?)/, (msg, match) => {
  const chatId = msg.chat.id;
  const iduser = msg.from.id;
  const nombre_grupo = match[1];
  const monto = parseFloat(match[2]);

  // Primero, insertar el grupo de gasto
  const queryGrupo = 'INSERT INTO MasterGrupoGastos (iduser, nombre_grupo, fecha_inicio, gasto_cerrado) VALUES ( ?, ?, CURDATE(), ?)';
  connection.query(queryGrupo, [iduser, nombre_grupo, false], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error añadiendo el grupo de gasto.');
      console.error(err);
    } else {
      const idgrupo_gasto = results.insertId; // Obtener el id del grupo de gasto recién creado

      // Segundo, insertar el gasto usando el idgrupo_gasto
      const queryGasto = 'INSERT INTO gastos (idchat, iduser, idgrupo_gasto, monto, gasto_saldado) VALUES (?, ?, ?, ?, ?)';
      connection.query(queryGasto, [chatId, iduser, idgrupo_gasto, monto, false], (err, results) => {
        if (err) {
          bot.sendMessage(chatId, 'Error añadiendo gasto.');
          console.error(err);
        } else {
          bot.sendMessage(chatId, `Gasto añadido: Monto ${monto}, Grupo: ${nombre_grupo},ChatId: ${chatId}, idUser: ${iduser}`);
        }
      });
    }
  });
});
// Comando /quitargasto
bot.onText(/\/quitargasto (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const idgasto = parseInt(match[1]);

  const query = 'DELETE FROM gastos WHERE idgasto = ?';
  connection.query(query, [idgasto], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error quitando gasto.');
      console.error(err);
    } else {
      bot.sendMessage(chatId, `Gasto quitado: Id ${idgasto}`);
    }
  });
});

// Comando /listargastos
// ListarGastos partiendo del MasterGrupoGastos y que segun que seleccione el usuario,
// listar los datos segun el id del grupo gasto
bot.onText(/\/listargastos/, (msg) => {
  const chatId = msg.chat.id;
  // const queryNombre = 'SELECT nombre_grupo FROM MasterGrupoGastos as m WHERE '
  const query = 'SELECT * FROM gastos WHERE idchat = ?';
  connection.query(query, [chatId], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error recuperando la lista de gastos.');
      console.error(err);
    } else {
      console.log(results);
      if (results.length > 0) {
        let message = 'Lista de gastos:\n';
        results.forEach((gasto) => {
          message += `- Id: ${gasto.idgasto}, Monto: ${gasto.monto}, Id del grupo de gasto: ${gasto.nombre_grupo}, Saldado: ${gasto.gasto_saldado}\n`;
        });
        bot.sendMessage(chatId, message);
      } else {
        bot.sendMessage(chatId, `no hay gastos registrados ${chatId}`)
      }
    }
  });
});
