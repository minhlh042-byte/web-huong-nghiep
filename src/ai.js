import { readFileSync } from 'fs';

function getGeminiKey() {
  return readFileSync('src/key.txt', 'utf8');
}

async function callGeminiAI(prompt) {
  var key = getGeminiKey();
  if (!key) {
    return { status: 'error', message: 'Chưa cấu hình API Key trong Script Properties!' };
  }

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + key;
    
    const payload = {
      "contents": [{
        "parts": [{ "text": prompt }]
      }]
    };

    const options = {
      "method": "POST",
      "contentType": "application/json",
      "body": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    const response = await fetch(url, options);
    const json = await response.json();

    if (json.candidates && json.candidates.length > 0) {
      return { 
        status: 'success', 
        text: json.candidates[0].content.parts[0].text 
      };
    } else {
      console.error(json);
      return { status: 'error', message: 'AI không phản hồi: ' + JSON.stringify(json) };
    }

  } catch (e) {
    console.error(e);
    return { status: 'error', message: 'Lỗi Server: ' + e.toString() };
  }
}

async function testGeminiAI() {
  const prompt = `
  Đóng vai chuyên gia hướng nghiệp để tư vấn thiếu niên. Từ thông tin yêu thích nghề nghiệp của người dùng, đưa ra dự đoán dạng json:
1. tính cách (100-200 chữ)
2. sở thích (50-100 chữ)
3. môi trường làm việc phù hợp (50-100 chữ)
4. 5 nghề nên theo đuổi trong tương lai

Định dạng json:
{
  "tinh_cach": "",
  "so_thich": "",
  "moi_truong_lam_viec_phu_hop": "",
  "nghe_nen_theo_duoi": []
}
Lưu ý:
- CẤM chào, hỏi, hoặc đưa ra thông tin không liên quan!
- Sử dụng nền lý thuyết hướng nghiệp Holland 
--
Thông tin yêu thích:
Thích: Kỹ sư Robot, Chuyên viên Marketing, Thiết kế Đồ họa, Họa sĩ Minh họa, Nhà Khoa học Dữ liệu, Chủ quán Cà phê, Phi công
Trung lập: Hướng dẫn viên Du lịch, Kiến trúc sư Cảnh quan, Kế toán viên, Nhà Thiên văn học, Bác sĩ Thú y
Không thích: Đầu bếp chuyên nghiệp, Giáo viên Tiểu học, Nhạc sĩ, Thủ thư
  `

  const result = await callGeminiAI(prompt);
  console.log(result);
}

testGeminiAI();