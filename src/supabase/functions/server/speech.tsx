// 语音转文字 - 使用 Gemini API
export async function speechToText(audioBase64: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log('🎤 开始语音识别，音频大小:', audioBase64.length);

  try {
    // 使用 Gemini 2.0 Flash 进行音频识别
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: '请将这段音频转换为文字。只输出识别出的文字内容，不要添加任何其他说明。如果是中文，请输出中文。'
              },
              {
                inline_data: {
                  mime_type: 'audio/webm',
                  data: audioBase64
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API 错误:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Gemini 响应:', JSON.stringify(data).substring(0, 200));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('📝 识别结果:', text);

    return text.trim();
  } catch (error) {
    console.error('❌ 语音识别失败:', error);
    throw error;
  }
}
