<?php
// Конфигурация
$botToken = '8038672019:AAHBiM7K6ITxgg9s1IW_3JrxwaVe3XCrVP8';
$crmToken = 'g1jtKt4VVxSrLoN1w7pVYKLeVxiBORlW8ou1SqwIY1JfkPbohNU4mW7DRIBO';
$statusIdsToCount = [3, 837, 838, 839];

// Получаем входящие данные от Telegram
$content = file_get_contents("php://input");
$update = json_decode($content, true);

// Без входящих данных — выход
if (!$update || !isset($update["message"])) {
    exit("No input");
}

$chatId = $update["message"]["chat"]["id"];
$text = $update["message"]["text"];

// Ответ по команде
if ($text === '/count') {
    $count = 0;
    $page = 1;

    do {
        $url = "https://stickcrm.by/api/orders?api_token={$crmToken}&page={$page}";
        $response = @file_get_contents($url);
        $data = json_decode($response, true);

        if (!isset($data['data'])) {
            sendMessage($chatId, "Ошибка при получении данных от CRM.");
            exit;
        }

        foreach ($data['data'] as $order) {
            if (in_array($order['status_id'], $statusIdsToCount)) {
                $count++;
            }
        }

        $nextPageUrl = $data['next_page_url'];
        $page++;
    } while (!empty($nextPageUrl));

    $message = "Заявок со статусами 3, 837, 838, 839: $count";
} else {
    $message = "Отправь /count, чтобы узнать количество заявок.";
}

// Отправка сообщения пользователю
sendMessage($chatId, $message);

function sendMessage($chatId, $text) {
    global $botToken;
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $data = [
        'chat_id' => $chatId,
        'text' => $text
    ];

    $options = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type:application/x-www-form-urlencoded\r\n",
            'content' => http_build_query($data)
        ]
    ];

    file_get_contents($url, false, stream_context_create($options));
}
