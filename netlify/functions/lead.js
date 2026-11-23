exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Форма ещё не настроена. Пожалуйста, свяжитесь с нами по телефону." })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (_) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Некорректные данные формы." }) };
  }

  // Простая ловушка для автоматического спама.
  if (String(data.website || "").trim()) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  const clean = (value, max) => String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
  const name = clean(data.name, 100);
  const phone = clean(data.phone, 40);
  const car = clean(data.car, 120);
  const year = clean(data.year, 10);
  const condition = clean(data.condition, 80);
  const city = clean(data.city, 100);
  const details = clean(data.details, 1500);

  if (!name || !phone) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Укажите имя и телефон." }) };
  }

  const message = [
    "🚗 Новая заявка с сайта LUX AUTO10",
    "",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Автомобиль: ${car || "не указан"}`,
    `Год выпуска: ${year || "не указан"}`,
    `Состояние: ${condition || "не указано"}`,
    `Город: ${city || "не указан"}`,
    `Комментарий: ${details || "нет"}`
  ].join("\n");

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });

    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Не удалось доставить заявку в Telegram. Попробуйте ещё раз или позвоните нам." })
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (_) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "Ошибка связи. Попробуйте ещё раз или позвоните нам." })
    };
  }
};
