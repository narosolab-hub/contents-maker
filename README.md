# 부업 블로그 글쓰기 도우미

N잡러를 위한 블로그 글 생성 도구입니다.
내 경험과 상황을 입력하면 AI가 블로그 글 초안을 작성해줍니다.

## 주요 기능

### 글 유형 3가지
| 유형 | 설명 | 예시 |
|------|------|------|
| **부업 도전기** 🔥 | 내가 시도하고 있는 부업 경험담, 후기, 수익 공개 | "미리캔버스 2주차 후기" |
| **정보/가이드** 📚 | 내 경험 기반의 방법론, 팁, 노하우 정리 | "미리캔버스 콘텐츠 등록 방법" |
| **일상/에세이** ☕ | 일상 기록, 생각 정리, 감정 표현 | "퇴근 후 부업 루틴" |

### 사용 플로우
1. 글 유형 선택
2. 키워드/주제 입력
3. 내 상황/경험 입력 (선택)
4. AI 초안 생성
5. 복사해서 블로그에 붙여넣기

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```bash
# AI Provider 설정
AI_PROVIDER=google  # 'google' 또는 'openai'

# Google Gemini API 키 (https://aistudio.google.com/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# OpenAI API 키 (선택 - https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_api_key
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 기술 스택
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui
- **AI SDK**: Vercel AI SDK (Gemini / GPT-4o 지원)

## 배포

Vercel에 배포하면 어디서든 접속 가능합니다:

```bash
npm install -g vercel
vercel
```

## 폴더 구조

```
src/
├── app/
│   ├── api/
│   │   └── generate/      # 글 생성 API
│   ├── layout.tsx
│   └── page.tsx           # 메인 페이지
├── components/
│   └── ui/                # Shadcn UI 컴포넌트
└── lib/
    └── ai-config.ts       # AI 설정 및 프롬프트
```
