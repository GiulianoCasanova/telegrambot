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
// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Añadir Gasto', callback_data: 'add_expense' }],
        [{ text: 'Quitar Gasto', callback_data: 'remove_expense' }],
        [{ text: 'Listar Gastos', callback_data: 'list_expenses' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Bienvenido! Selecciona una opción:', inlineKeyboard);
});

// Manejo de callback_query
// Manejo de callback_query
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === 'add_expense') {
    bot.sendMessage(chatId, 'Has seleccionado "Añadir Gasto". Por favor, ingresa los detalles del gasto.');
    bot.once('message', (msg) => {
      const match = msg.text.match(/(\w+) (\d+(\.\d{1,2})?)/);
      if (match) {
        añadirgasto(msg, match);
      } else {
        bot.sendMessage(chatId, 'Formato incorrecto. Por favor, usa el formato: NombreGrupo Monto');
      }
    });
  } else if (data === 'remove_expense') {
    bot.sendMessage(chatId, 'Has seleccionado "Quitar Gasto".');
    quitargasto(message);
  } else if (data === 'list_expenses') {
    bot.sendMessage(chatId, 'Has seleccionado "Listar Gastos".');
    listarGastos(message);
  }
  // Responder al callback para evitar que el botón quede en espera
  bot.answerCallbackQuery(callbackQuery.id);
});



// Comando /añadirgasto
bot.onText(/\/añadirgasto (\w+) (\d+(\.\d{1,2})?)/, (msg, match) => {
  añadirgasto(msg, match);
});

function añadirgasto(msg, match){
  const chatId = msg.chat.id;
  const iduser = msg.from.id;
  const nombre_grupo = match[1];
  const monto = parseFloat(match[2]);

  // Primero, insertar el grupo de gasto
  const queryGrupo = 'INSERT INTO MasterGrupoGastos (idchat, iduser, nombre_grupo, fecha_inicio, gasto_cerrado) VALUES (?, ?, ?, CURDATE(), ?)';
  connection.query(queryGrupo, [chatId, iduser, nombre_grupo, false], (err, results) => {
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
          bot.sendMessage(chatId, `Gasto añadido: Monto ${monto}, Grupo: ${nombre_grupo}, ChatId: ${chatId}, idUser: ${iduser}`);
        }
      });
    }
  });
}

// Comando /quitargasto
// Comando /quitargasto
bot.onText(/\/quitargasto/, (msg) => {
  quitargasto(msg);
});

function quitargasto(msg){
  const chatId = msg.chat.id;
  const query = 'SELECT nombre_grupo, idgrupo_gasto FROM MasterGrupoGastos WHERE idchat = ?';

  connection.query(query, [chatId], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error recuperando la lista de grupos de gastos.');
      console.error(err);
    } else {
      if (results.length > 0) {
        let message = 'Escribe el ID del grupo de gastos que deseas eliminar,o escribe "especifico" para eliminar un gasto específico dentro de un grupo.\n';
        results.forEach((grupo) => {
          message += `ID: ${grupo.idgrupo_gasto}, Nombre: ${grupo.nombre_grupo}\n`;
        });
        bot.sendMessage(chatId, message);
        bot.once('message', (msg) => {
          const text = msg.text.trim().toLowerCase();
          if (text === 'especifico') {
            bot.sendMessage(chatId, 'Escribe el ID del grupo de gastos del que deseas eliminar un gasto específico:');
            bot.once('message', (msg) => {
              const idgrupo_gasto = parseInt(msg.text);
              if (!isNaN(idgrupo_gasto)) {
                const queryGastos = 'SELECT idgasto, monto FROM gastos WHERE idgrupo_gasto = ?';
                connection.query(queryGastos, [idgrupo_gasto], (err, results) => {
                  if (err) {
                    bot.sendMessage(chatId, 'Error recuperando los gastos.');
                    console.error(err);
                  } else {
                    if (results.length > 0) {
                      let message = 'Selecciona un gasto enviando el ID correspondiente:\n';
                      results.forEach((gasto) => {
                        message += `ID: ${gasto.idgasto}, Monto: ${gasto.monto}\n`;
                      });
                      bot.sendMessage(chatId, message);
                      bot.once('message', (msg) => {
                        const idgasto = parseInt(msg.text);
                        if (!isNaN(idgasto)) {
                          const query = 'DELETE FROM gastos WHERE idgasto = ?';
                          connection.query(query, [idgasto], (err, results) => {
                            if (err) {
                              bot.sendMessage(chatId, 'Error quitando gasto.');
                              console.error(err);
                            } else {
                              bot.sendMessage(chatId, `Gasto quitado: Id ${idgasto}`);
                            }
                          });
                        } else {
                          bot.sendMessage(chatId, 'ID de gasto no válido.');
                        }
                      });
                    } else {
                      bot.sendMessage(chatId, 'No hay gastos registrados para este grupo.');
                    }
                  }
                });
              } else {
                bot.sendMessage(chatId, 'ID de grupo de gastos no válido.');
              }
            });
          } else {
            const idgrupo_gasto = parseInt(text);
            if (!isNaN(idgrupo_gasto)) {
              const deleteGastos = 'DELETE FROM gastos WHERE idgrupo_gasto = ?';
              connection.query(deleteGastos, [idgrupo_gasto], (err, results) => {
                if (err) {
                  bot.sendMessage(chatId, 'Error quitando los gastos del grupo.');
                  console.error(err);
                } else {
                  const deleteGrupo = 'DELETE FROM MasterGrupoGastos WHERE idgrupo_gasto = ?';
                  connection.query(deleteGrupo, [idgrupo_gasto], (err, results) => {
                    if (err) {
                      bot.sendMessage(chatId, 'Error quitando el grupo de gastos.');
                      console.error(err);
                    } else {
                      bot.sendMessage(chatId, `Grupo de gastos y sus gastos asociados han sido eliminados: Id ${idgrupo_gasto}`);
                    }
                  });
                }
              });
            } else {
              bot.sendMessage(chatId, 'ID de grupo de gastos no válido.');
            }
          }
        });
      } else {
        bot.sendMessage(chatId, 'No hay grupos de gastos registrados.');
      }
    }
  });
}

// Comando /listargastos
bot.onText(/\/listargastos/, (msg) => {
  listarGastos(msg);
});

function listarGastos(msg){
  const chatId = msg.chat.id;
  const query = 'SELECT nombre_grupo, idgrupo_gasto FROM MasterGrupoGastos WHERE idchat = ?';
  connection.query(query, [chatId], (err, results) => {
    if (err) {
      bot.sendMessage(chatId, 'Error recuperando la lista de grupos de gastos.');
      console.error(err);
    } else {
      if (results.length > 0) {
        let message = 'Selecciona un grupo de gastos enviando el ID correspondiente:\n';
        results.forEach((grupo) => {
          message += `IDgrupo: ${grupo.idgrupo_gasto}, NombreGrupo: ${grupo.nombre_grupo}\n`;
        });
        bot.sendMessage(chatId, message);

        bot.once('message', (msg) => {
          const idgrupo_gasto = parseInt(msg.text);
          if (!isNaN(idgrupo_gasto)) {
            const queryGastos = 'SELECT * FROM gastos WHERE idgrupo_gasto = ? AND idchat = ?';
            connection.query(queryGastos, [idgrupo_gasto, chatId], (err, results) => {
              if (err) {
                bot.sendMessage(chatId, 'Error recuperando los gastos.');
                console.error(err);
              } else {
                if (results.length > 0) {
                  let message = 'Lista de gastos:\n';
                  results.forEach((gasto) => {
                    message += `- Id: ${gasto.idgasto}, Monto: ${gasto.monto}, Saldado: ${gasto.gasto_saldado}\n`;
                  });
                  bot.sendMessage(chatId, message);
                } else {
                  bot.sendMessage(chatId, 'No hay gastos registrados para este grupo.');
                }
              }
            });
          } else {
            bot.sendMessage(chatId, 'ID de grupo de gastos no válido.');
          }
        });
      } else {
        bot.sendMessage(chatId, 'No hay grupos de gastos registrados.');
      }
    }
  });
}