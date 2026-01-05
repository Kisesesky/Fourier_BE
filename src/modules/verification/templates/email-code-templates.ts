// src/modules/verification/templates/email-code-templates.ts

export function getVerificationCodeTemplate(
  code: string,
  type: 'signup' | 'password' = 'signup'
) {
  const contextMessage =
    type === 'signup'
      ? '아래 <b style="color:#4D42B3;">6자리 인증번호</b>를 <br/><b style="color: #4D42B3;">회원가입 화면</b>에 입력해주세요.'
      : '아래 <b style="color:#4D42B3;">6자리 인증번호</b>를 <br/><b style="color: #4D42B3;">비밀번호 재설정 화면</b>에 입력해주세요.';

  const completeMessage =
    type === 'signup'
      ? '인증이 완료되면 회원가입을 계속 진행할 수 있습니다.'
      : '인증이 완료되면 비밀번호 재설정을 계속 진행할 수 있습니다.';

  return `
    <div style="max-width: 480px; margin: 40px auto; padding: 0; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #E3E6E9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 16px; box-shadow: 0 2px 16px rgba(77,66,179,0.08); overflow: hidden;">
        <tr>
          <td style="padding: 36px 12px 12px 12px;">
            <table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto 18px auto;">
              <tr>
                <td style="vertical-align: middle; text-align: center;">
                  <span style="font-size: 15px; color: #4D42B3; font-weight: 600; vertical-align: middle;">
                    본 서비스를 이용해주셔서 감사합니다.
                  </span>
                </td>
              </tr>
            </table>
            <h2 style="font-size:20px;font-weight:700;color:#4D42B3;margin:0 0 14px 0;letter-spacing:-1px;text-align:center;">
              이메일 인증번호 안내
            </h2>
            <p style="font-size: 15px; color: #444; margin-bottom: 30px; line-height: 1.7; text-align:center;">
              안녕하세요!<br>
              <span style="color: #4D42B3; font-weight: 600;"></span> 서비스를 이용해주셔서 감사합니다.<br>
              ${contextMessage}
            </p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;width:100%;max-width:220px;padding:16px 0;font-size:22px;font-weight:bold;letter-spacing:8px;color:#fff;border-radius:12px;background:linear-gradient(90deg,#4D42B3 0%,#AFC8FA 100%);">
                ${code}
              </div>
            </div>
            <p style="font-size:13px;color:#888;line-height:1.7;margin-bottom:0;text-align:center;">
              인증번호는 <b style="color:#4D42B3;">5분간만 유효</b>합니다.<br>
              ${completeMessage}<br>
              본인이 요청하지 않았다면 이 메일을 무시해 주세요.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#E3E6E9;padding:20px 12px 12px 12px;text-align:center;">
            <div style="font-size:12px;color:#888;line-height:1.7;">
              주식회사<br>
              서울특별시<br>
              Copyright ⓒ UMO. All Rights Reserved.
            </div>
            <div style="font-size:11px;color:#bbb;margin-top:10px;">
              ※ 본 메일은 발신 전용입니다. 회신하셔도 답변드릴 수 없습니다.
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}