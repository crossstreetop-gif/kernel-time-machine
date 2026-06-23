# Kernel Time Machine

Samsung Android dumpstate 로그(드라이버 커널 패닉/watchdog, 소모전류 이슈)를 넣으면,
커널 이벤트를 추출해 **시간순 인과 타임라인**으로 재구성하고 root cause를 짚어주는 디버깅 재생 도구.

## 분석 엔진 2단계

### 1) 룰 기반 분석 — 무료 · 오프라인 · 어디서든 (기본)
인터넷도 API 키도 필요 없습니다. `kernel_time_machine.html`을 그냥 브라우저로 열면
(파일 더블클릭 OK) "룰 기반 인과 분석" 버튼이 바로 동작합니다.
- 알려진 커널 장애 패턴을 결정론적으로 매칭
- root cause · 인과 체인 · 근거 라인 · 수정 제안 제공
- ChatGPT/Claude 등 어떤 환경이든 무관하게 100% 작동

### 2) AI 심화 분석 — 선택
더 깊은 해석이 필요할 때만. 아래 두 환경에서 작동합니다.
- Claude.ai 아티팩트 안에서 실행 → 추가 비용 없음 (Claude 구독으로 충분)
- 로컬 프록시 + Anthropic API 키 → proxy_server.js 사용 (소액 크레딧 필요)

AI 심화가 안 되는 환경이어도 1)번 룰 분석은 항상 그대로 동작합니다.

## 파일
- kernel_time_machine.html — 메인 앱 (파서 + 타임라인 + 룰엔진 + AI옵션)
- proxy_server.js — AI 심화를 로컬에서 쓸 때만 필요한 프록시 서버
- sample_watchdog.txt / sample_current.txt — 데모용 샘플 로그

## 빠른 시작 (룰 분석만, 비용 0)
1. kernel_time_machine.html 더블클릭으로 열기
2. 상단에서 시나리오 선택 (Watchdog / 소모전류)
3. "룰 기반 인과 분석" 클릭 → 결과 확인
4. 타임라인 카드 클릭 또는 근거 "line N" 클릭 → 원본 로그로 점프

## AI 심화를 로컬에서 쓰려면 (선택)
Node.js 설치 + Anthropic API 키(https://console.anthropic.com) 발급 후:

  # macOS / Linux
  ANTHROPIC_API_KEY=sk-ant-... node proxy_server.js
  # Windows PowerShell
  $env:ANTHROPIC_API_KEY="sk-ant-..."; node proxy_server.js

브라우저에서 http://localhost:8787/ 접속 → "+ AI 심화 분석" 버튼 사용.

## ChatGPT Plus 사용자 안내
ChatGPT Plus 구독은 OpenAI API와 별개라, 그것만으로는 AI 심화가 안 됩니다.
하지만 룰 기반 분석은 키 없이 그대로 작동하니 리뷰/데모에 바로 쓸 수 있습니다.
OpenAI API로 AI 심화를 붙이려면 HTML의 호출 부분(엔드포인트/요청 형식/응답 파싱)을 수정해야 합니다.

## 동작 원리
1. 결정론적 파서: 커널 dmesg 타임스탬프를 suspend UTC 앵커로 절대시각 변환, 이벤트 추출
2. 룰 엔진: 이벤트 시퀀스를 알려진 인과 패턴과 매칭 (LLM 불필요)
3. AI 옵션: 구조화된 이벤트만 모델에 전송(환각 방지), JSON 다단계 복구 파싱
