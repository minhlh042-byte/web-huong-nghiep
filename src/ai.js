// import { getSecret } from './secret.js';

// function getGeminiKey() {
//   return getSecret();
// }

const API_URL = 'https://webhuongnghiepbe.vercel.app/api/career-analyser';
// const API_URL = 'http://localhost:3002/api/career-analyser';

async function callGeminiAPI(prompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}

// async function callGeminiAI(prompt) {
//   var key = getGeminiKey();
//   if (!key) {
//     return { status: 'error', message: 'Chưa cấu hình API Key trong Script Properties!' };
//   }

//   try {
//     var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + key;
    
//     const payload = {
//       "contents": [{
//         "parts": [{ "text": prompt }]
//       }]
//     };

//     const options = {
//       "method": "POST",
//       "contentType": "application/json",
//       "body": JSON.stringify(payload),
//       "muteHttpExceptions": true
//     };

//     const response = await fetch(url, options);
//     const json = await response.json();

//     if (json.candidates && json.candidates.length > 0) {
//       return { 
//         status: 'success', 
//         text: json.candidates[0].content.parts[0].text 
//       };
//     } else {
//       console.error(json);
//       return { status: 'error', message: 'AI không phản hồi: ' + JSON.stringify(json) };
//     }

//   } catch (e) {
//     console.error(e);
//     return { status: 'error', message: 'Lỗi Server: ' + e.toString() };
//   }
// }

export async function testGeminiAI() {
  const prompt = `
  Đóng vai chuyên gia hướng nghiệp để tư vấn thiếu niên. Từ thông tin yêu thích nghề nghiệp của người dùng, đưa ra dự đoán dạng file json:
1. tính cách (20-50 chữ)
2. sở thích (15-30 chữ)
3. môi trường làm việc phù hợp (15-30 chữ)
4. 5 nghề nên theo đuổi trong tương lai

Định dạng file json:
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

  const result = await callGeminiAPI(prompt);
  // console.log(result);
  return result;
}

export async function runGeminiCareerPrediction() {
  const liked = Array.from(new Set(user.liked.map(i => i.nameVN))).join(', ');
  const neutral = Array.from(new Set(user.neutral.map(i => i.nameVN))).join(', ');
  const disliked = Array.from(new Set(user.disliked.map(i => i.nameVN))).join(', ');

  const prompt = `
  Đóng vai chuyên gia hướng nghiệp để tư vấn thiếu niên. Từ thông tin yêu thích nghề nghiệp của người dùng, đưa ra dự đoán dạng file json:
1. tính cách (20-50 chữ)
2. sở thích (15-30 chữ)
3. môi trường làm việc phù hợp (15-30 chữ)
4. 5 nghề nên theo đuổi trong tương lai

Định dạng file json:
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
Thích: ${liked}
Trung lập: ${neutral}
Không thích: ${disliked}
  `

  const result = await callGeminiAPI(prompt);
  // console.log(result);
  return result;
}

function extractCareerPredictionJSON(text) {
  // Remove unneeded chars
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
  const json = JSON.parse(cleanedText);
  return {
    personality: json.tinh_cach,
    interests: json.so_thich,
    work_environment: json.moi_truong_lam_viec_phu_hop,
    careers: json.nghe_nen_theo_duoi
  };
}

function generateHTMLReport(json) {
  return `
  <h3>Kết quả phân tích hướng nghiệp</h3>
  <p id="ai-result-personality"> <b>Tính cách:</b> ${json.personality}</p>
  <p id="ai-result-interests"> <b>Sở thích:</b> ${json.interests}</p>
  <p id="ai-result-work-environment"> <b>Môi trường làm việc phù hợp:</b> ${json.work_environment}</p>
  <p id="ai-result-careers"> <b>Nghề nên theo đuổi trong tương lai:</b> ${json.careers.join(', ')}</p>
  `;
}

export async function startAIAnalysis() {
  document.getElementById('btn-ai-analysis').innerText = "Đang phân tích...";
  document.getElementById('btn-ai-analysis').disabled = true;
  document.getElementById('ai-result-container').innerHTML = "<p>AI đang phân tích dữ liệu...</p>";
  try {
    const result = await runGeminiCareerPrediction();
    // const result = await testGeminiAI();
    if (result.status === 'success') {
      const htmlReport = generateHTMLReport(extractCareerPredictionJSON(result.text));
      document.getElementById('ai-result-container').innerHTML = htmlReport;
    } else {
      document.getElementById('ai-result-container').innerHTML = "Error: " + result.message;
    }
  } catch (e) {
    document.getElementById('ai-result-container').innerHTML = "Error: " + e.message;
  } finally {
    document.getElementById('btn-ai-analysis').innerText = "Phân tích bằng AI";
    document.getElementById('btn-ai-analysis').disabled = false;
  }
}

document.getElementById("btn-ai-analysis").addEventListener("click", () => {
  startAIAnalysis();
});
