// =======================================================
// CODE.GS - XỬ LÝ SERVER
// Tác giả: Le Hoang Minh
// =======================================================

/**
 * 1. LẤY API KEY TỪ SCRIPT PROPERTIES (BẢO MẬT)
 * Để dùng được, bạn cần vào trình soạn thảo Apps Script:
 * Chọn Cài đặt (Bánh răng) -> Kéo xuống mục "Script Properties" (Thuộc tính kịch bản)
 * Nhấn "Add script property":
 * - Property: GEMINI_API_KEY
 * - Value: [Dán Key AIza... của bạn vào đây]
 */
function getGeminiKey() {
  return PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
}

// 2. HIỂN THỊ GIAO DIỆN WEB
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Hộ Chiếu Tương Lai')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

// 3. HÀM GỌI AI (SERVER-SIDE)
function callGeminiAI(prompt) {
  var key = getGeminiKey();
  if (!key) {
    return { status: 'error', message: 'Chưa cấu hình API Key trong Script Properties!' };
  }

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key;
    
    var payload = {
      "contents": [{
        "parts": [{ "text": prompt }]
      }]
    };

    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());

    if (json.candidates && json.candidates.length > 0) {
      return { 
        status: 'success', 
        text: json.candidates[0].content.parts[0].text 
      };
    } else {
      return { status: 'error', message: 'AI không phản hồi: ' + JSON.stringify(json) };
    }

  } catch (e) {
    return { status: 'error', message: 'Lỗi Server: ' + e.toString() };
  }
}

// 4. HÀM GỬI EMAIL
function sendEmailReport(data) {
  try {
    if (!data.email) return { status: 'error', message: 'Thiếu email' };

    var subject = "Kết quả Hướng nghiệp: Hộ Chiếu Tương Lai - " + data.name;
    var body = "Xin chào " + data.name + ",\n\n" +
               "Đây là kết quả phân tích hướng nghiệp AI của bạn:\n" +
               "--------------------------------\n" +
               data.result + "\n" +
               "--------------------------------\n" +
               "Chúc bạn sớm tìm được hướng đi phù hợp!\n\n" +
               "Trân trọng,\nBan Tổ Chức.";
               
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });

    return { status: 'success', message: 'Đã gửi mail' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}
