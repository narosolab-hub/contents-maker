/**
 * 블로그 글 생성 API
 *
 * POST /api/generate
 *
 * 요청 본문:
 * {
 *   postType: 'challenge' | 'info' | 'daily',  // 글 유형
 *   keyword: string,                            // 키워드/주제
 *   context?: string                            // 내 상황/경험 (선택)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import {
    getAIModel,
    getSystemPrompt,
    PostType,
    AIProvider
} from '@/lib/ai-config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postType, keyword, context } = body;

        // 필수 파라미터 검증
        if (!postType || !keyword) {
            return NextResponse.json(
                { error: '글 유형과 키워드는 필수입니다.' },
                { status: 400 }
            );
        }

        // 유효한 글 유형 검증
        const validTypes: PostType[] = ['challenge', 'info', 'daily', 'ebook'];
        if (!validTypes.includes(postType)) {
            return NextResponse.json(
                { error: '유효하지 않은 글 유형입니다.' },
                { status: 400 }
            );
        }

        // 시스템 프롬프트 가져오기
        const systemPrompt = getSystemPrompt(postType as PostType);

        // 사용자 프롬프트 구성
        const userPrompt = buildUserPrompt(postType as PostType, keyword, context);

        // AI 모델 선택 및 텍스트 생성
        const model = getAIModel();

        const result = streamText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
        });

        // 스트리밍 응답 반환
        return result.toTextStreamResponse();

    } catch (error) {
        console.error('글 생성 오류:', error);

        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
            return NextResponse.json(
                { error: 'AI API 키가 설정되지 않았거나 유효하지 않습니다. .env.local 파일을 확인해주세요.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: `글 생성 중 오류가 발생했습니다: ${errorMessage}` },
            { status: 500 }
        );
    }
}

/**
 * 글 유형별 사용자 프롬프트 생성
 */
function buildUserPrompt(postType: PostType, keyword: string, context?: string): string {
    const contextSection = context
        ? `\n\n## 내 상황/경험 (이 내용을 반드시 글에 녹여주세요)\n${context}`
        : '';

    switch (postType) {
        case 'challenge':
            return `다음 주제로 부업 도전기/후기 블로그 글을 작성해주세요.

## 메인 키워드
${keyword}
${contextSection}

## 작성 가이드
- <h2> 제목에 키워드 "${keyword}" 포함
- <h3> 소제목 3-4개로 섹션 구분
- 총 분량: 1200~1800자 (충분히 길게)
- 키워드를 본문에 5-7회 자연스럽게 포함
- 잘된 점, 아쉬운 점, 앞으로의 계획 구성

## 정보 정확성 (매우 중요!)
- 내가 제공한 "내 상황/경험" 내용만 기반으로 작성
- 내가 언급하지 않은 수치나 결과를 임의로 만들지 말 것
- 저작권/정책 위반 조언 금지
- 검증 안 된 정보는 쓰지 말 것

## HTML 형식 (필수!)
- 이모지 사용 금지
- 마크다운 금지, HTML만 사용
- 각 <p> 태그는 2-3문장만 (짧게!)
- <h2>, <h3>, <p> 사이에 줄바꿈으로 여백 확보
- 예시:
<h2>제목</h2>

<p>첫 문단. 짧게 2-3문장.</p>

<p>두 번째 문단.</p>

<h3>소제목</h3>

<p>내용...</p>`;

        case 'info':
            return `다음 주제로 정보/가이드 블로그 글을 작성해주세요.

## 메인 키워드
${keyword}
${contextSection}

## 작성 가이드
- <h2> 제목에 키워드 "${keyword}" 포함 (검색 최적화)
- <h3> 소제목 4-5개로 섹션 구분
- 총 분량: 1500~2000자 (충분히 길게)
- 키워드를 본문에 5-7회 자연스럽게 포함
- 내 경험을 근거로 신뢰감 있게 작성

## 정보 정확성 (매우 중요!)
- 내가 제공한 "내 상황/경험" 내용만 기반으로 작성
- 저작권 위반 조언 절대 금지 (유료 콘텐츠 재판매, 타인 저작물 무단 사용 등)
- 플랫폼 정책 위반 조언 금지
- 검증 안 된 정보는 쓰지 말 것
- 뻔한 일반론 대신 내 경험 기반의 구체적인 내용만

## HTML 형식 (필수!)
- 이모지 사용 금지
- 마크다운 금지, HTML만 사용
- 각 <p> 태그는 2-3문장만 (짧게!)
- <h2>, <h3>, <p> 사이에 줄바꿈으로 여백 확보
- 예시:
<h2>제목</h2>

<p>첫 문단. 짧게 2-3문장.</p>

<p>두 번째 문단. 이렇게 나눠서.</p>

<h3>소제목</h3>

<p>내용...</p>`;

        case 'daily':
            return `다음 주제로 일상/에세이 블로그 글을 작성해주세요.

## 주제
${keyword}
${contextSection}

## 작성 가이드
- <h2> 제목 (감성적인 제목 OK)
- <h3> 소제목 2-3개로 흐름 구분
- 총 분량: 1000~1500자
- 감정과 생각 표현에 집중
- 내가 제공한 상황만 기반으로 작성

## HTML 형식 (필수!)
- 이모지 사용 금지
- 마크다운 금지, HTML만 사용
- 각 <p> 태그는 2-3문장만 (짧게!)
- <h2>, <h3>, <p> 사이에 줄바꿈으로 여백 확보
- 예시:
<h2>제목</h2>

<p>첫 문단. 짧게.</p>

<p>두 번째 문단.</p>

<h3>소제목</h3>

<p>내용...</p>`;

        case 'ebook':
            return `다음 주제로 전자책 챕터를 작성해주세요.

## 챕터 주제
${keyword}
${contextSection}

## 작성 가이드 (필수 구조)

### 1. 챕터 제목
- <h2>로 작성, 흥미를 끄는 제목
- 키워드 "${keyword}" 포함

### 2. 도입부 (300자 이상)
- 독자 공감 유도, 문제 제기
- "왜 이 내용이 중요한가?"

### 3. 본론 (800자 이상)
- 단계별 설명 (1단계, 2단계, 3단계 등)
- <h3>로 섹션 구분
- 대비 구조 활용 (잘못된 접근 vs 올바른 접근)
- 구체적인 예시 포함

### 4. [Real Story] 섹션 (400자 이상)
- 내가 제공한 경험을 스토리텔링으로 풀어내기
- <h3>[Real Story] 제목</h3> 형식
- 구체적인 상황, 감정, 결과 포함

### 5. 💡 Cheat Key (200자 이상)
- <h3>💡 Cheat Key</h3> 형식 (이모지 허용)
- 핵심 내용 3줄 요약
- 독자가 기억해야 할 포인트

### 6. 워크북 섹션 (필수!)
- <h3>📝 워크북: 실천하기</h3> 형식
- 자기 점검 질문 3~5개
- 오늘 당장 할 수 있는 실천 과제 1~2개

## 정보 정확성 (매우 중요!)
- 내가 제공한 "내 상황/경험" 내용만 기반으로 작성
- 내가 언급하지 않은 수치나 결과를 임의로 만들지 말 것
- 검증 안 된 정보는 쓰지 말 것

## HTML 형식 (필수!)
- 마크다운 금지, HTML만 사용
- 이모지는 Cheat Key, 워크북 제목에만 사용
- 각 <p> 태그는 2-4문장
- <h2>, <h3>, <p> 사이에 줄바꿈으로 여백 확보
- <ul>, <ol>, <li>, <strong>, <blockquote> 활용
- 총 분량: 1500~2500자 (밀도 있게)

## AI 추천 (본문 끝에 반드시 추가!)

본문 작성이 끝나면, 아래 형식으로 추천사항을 추가해주세요:

<!-- AI_SUGGESTIONS -->
FRAMEWORK: (내용이 단계별/구조화되어 있다면 적합한 프레임워크 추천. 예: "Why-Output-Task 3단계", "Before-After 구조" 등. 적합한 프레임워크가 없으면 "없음")
IMPROVE: (1) 사용자가 입력한 "내 상황/경험"에서 빠진 요소 분석 - 숫자/기간이 없다면? 실패 경험이 없다면? 감정 표현이 부족하다면? (2) 작성된 본문에서 더 강화하면 좋을 구체적인 부분 - 어떤 섹션을 보강하면 좋을지, 어떤 내용을 추가하면 좋을지. 이 두 가지를 합쳐서 1-2문장으로 구체적으로 제안. 예: "실패했던 경험을 추가하면 Real Story 섹션이 더 풍성해질 거예요", "구체적인 기간(며칠, 몇 주)을 넣으면 도입부 설득력이 올라가요"
IMAGES: (이 챕터에 어울리는 이미지 3개를 쉼표로 구분. 예: "3단계 프로세스 도식, 실제 작업 화면 캡처, 결과물 스크린샷")`;

        default:
            return `다음 주제로 블로그 글을 작성해주세요.

## 주제
${keyword}
${contextSection}

HTML 형식으로 출력해주세요. 이모지는 사용하지 마세요.`;
    }
}
