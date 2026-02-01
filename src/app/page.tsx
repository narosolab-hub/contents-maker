"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Copy,
  Check,
  Flame,
  BookOpen,
  Coffee,
  Sparkles,
  ImageIcon,
  RefreshCw,
  Hash,
  Type,
  BookText,
  Lightbulb,
  Layers,
  PenLine,
} from "lucide-react";
import { useTheme } from "next-themes";

// 글 유형 정의
type PostType = "challenge" | "info" | "daily" | "ebook";

const POST_TYPES = {
  challenge: {
    name: "부업 도전기",
    emoji: "🔥",
    icon: Flame,
    description: "내가 시도하고 있는 부업 경험담, 후기, 수익 공개",
    placeholder: {
      keyword: "미리캔버스 부업",
      context:
        "40개 올렸는데 아직 수익 0원, 그래도 하루 10개씩 꾸준히 하는 중. AI로 만들어서 등록하고 있음. 심사 반려 3번 당했는데 해상도 문제였음.",
    },
  },
  info: {
    name: "정보/가이드",
    emoji: "📚",
    icon: BookOpen,
    description: "내 경험 기반의 방법론, 팁, 노하우 정리",
    placeholder: {
      keyword: "미리캔버스 콘텐츠 등록 방법",
      context:
        "40개 올려봤는데 3개 반려당함. 반려 사유는 해상도 부족. 600x600 이상으로 하니까 통과됨. SNS템플릿 카테고리가 경쟁 적은 편.",
    },
  },
  daily: {
    name: "일상/에세이",
    emoji: "☕",
    icon: Coffee,
    description: "일상 기록, 생각 정리, 감정 표현",
    placeholder: {
      keyword: "퇴근 후 부업 루틴",
      context: "요즘 퇴근하고 2시간씩 부업하는데 피곤하지만 뿌듯함. 작은 성과라도 있으면 힘이 남.",
    },
  },
  ebook: {
    name: "전자책",
    emoji: "📖",
    icon: BookText,
    description: "유료 전자책용 챕터 작성 (워크북 포함)",
    placeholder: {
      keyword: "업무 인수분해 기술",
      context:
        "도매 플랫폼 총괄 맡았을 때 사수도 인수인계서도 없었음. Why-Output-Task 3단계로 쪼개서 한 달 만에 첫 주문 성공. 개발팀은 명확한 Task 덕에 속도 냈고, 영업팀은 눈에 보이는 결과물에 신뢰하기 시작.",
    },
  },
};

// 전자책 내용 추천 가이드
const EBOOK_CONTENT_RECOMMENDATIONS = [
  "실패 경험과 극복 과정이 있으면 신뢰도가 높아져요",
  "구체적인 숫자/기간을 넣으면 설득력이 올라가요",
  "독자가 바로 적용할 수 있는 액션 아이템을 포함하세요",
  "\"좋은 예 vs 나쁜 예\" 대비 구조가 이해를 도와요",
  "비유나 스토리텔링으로 개념을 풀어주세요",
];

const IMAGE_RECOMMENDATIONS: Record<PostType, string[]> = {
  challenge: [
    "수익/정산 화면 스크린샷",
    "작업 중인 화면 캡처",
    "실제 작업물 사진",
  ],
  info: ["단계별 진행 스크린샷", "설정 화면 캡처", "예시 이미지"],
  daily: ["직접 찍은 일상 사진", "오늘의 풍경/음식", "감성 소품 사진"],
  ebook: ["개념 설명 다이어그램", "단계별 프로세스 도식", "워크시트 이미지"],
};

// AI 추천 타입
interface AISuggestions {
  framework: string | null;
  improve: string | null;
  images: string[];
}

// AI 추천 파싱 함수
const parseAISuggestions = (content: string): { body: string; suggestions: AISuggestions } => {
  const marker = "<!-- AI_SUGGESTIONS -->";
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    return {
      body: content,
      suggestions: { framework: null, improve: null, images: [] }
    };
  }

  const body = content.substring(0, markerIndex).trim();
  const suggestionsText = content.substring(markerIndex + marker.length);

  const frameworkMatch = suggestionsText.match(/FRAMEWORK:\s*(.+?)(?=\n|IMPROVE:|IMAGES:|$)/s);
  const improveMatch = suggestionsText.match(/IMPROVE:\s*(.+?)(?=\n|FRAMEWORK:|IMAGES:|$)/s);
  const imagesMatch = suggestionsText.match(/IMAGES:\s*(.+?)(?=\n|FRAMEWORK:|IMPROVE:|$)/s);

  const framework = frameworkMatch?.[1]?.trim();
  const improve = improveMatch?.[1]?.trim();
  const imagesRaw = imagesMatch?.[1]?.trim();

  return {
    body,
    suggestions: {
      framework: framework && framework !== "없음" ? framework : null,
      improve: improve || null,
      images: imagesRaw ? imagesRaw.split(",").map(s => s.trim()).filter(Boolean) : []
    }
  };
};

export default function Home() {
  const { setTheme, theme } = useTheme();

  // 상태 관리
  const [postType, setPostType] = useState<PostType>("challenge");
  const [keyword, setKeyword] = useState("");
  const [context, setContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTitleCopied, setIsTitleCopied] = useState(false);
  const [isKeywordsCopied, setIsKeywordsCopied] = useState(false);
  const [error, setError] = useState("");

  // 글 생성
  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError("키워드/주제를 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError("");
    setGeneratedContent("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postType,
          keyword: keyword.trim(),
          context: context.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "생성 중 오류가 발생했습니다");
      }

      // 스트리밍 응답 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let content = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value);
          setGeneratedContent(content);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  };

  // 제목 추출
  const extractTitle = () => {
    const match = generatedContent.match(/<h2[^>]*>(.*?)<\/h2>/i);
    return match ? match[1].replace(/<[^>]*>/g, "") : "";
  };

  // 추천 키워드 생성 (메인 키워드 기반)
  const generateKeywords = () => {
    const base = keyword.trim();
    if (!base) return [];

    const variations = [
      base,
      `${base} 후기`,
      `${base} 방법`,
      `${base} 수익`,
      `${base} 현실`,
      `${base} 팁`,
    ];
    return variations.slice(0, 5);
  };

  // HTML을 순수 텍스트로 변환 (줄바꿈 유지)
  const htmlToPlainText = (html: string) => {
    let text = html;
    // 제목 태그 앞뒤로 줄바꿈
    text = text.replace(/<h[1-6][^>]*>/gi, "\n\n");
    text = text.replace(/<\/h[1-6]>/gi, "\n");
    // p 태그 뒤에 줄바꿈
    text = text.replace(/<p[^>]*>/gi, "");
    text = text.replace(/<\/p>/gi, "\n\n");
    // li 태그를 "- "로 변환
    text = text.replace(/<li[^>]*>/gi, "- ");
    text = text.replace(/<\/li>/gi, "\n");
    // br 태그를 줄바꿈으로
    text = text.replace(/<br\s*\/?>/gi, "\n");
    // 나머지 태그 제거
    text = text.replace(/<[^>]*>/g, "");
    // HTML 엔티티 디코딩
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&amp;/g, "&");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&quot;/g, '"');
    // 연속 줄바꿈 정리 (3개 이상 → 2개)
    text = text.replace(/\n{3,}/g, "\n\n");
    // 앞뒤 공백 제거
    return text.trim();
  };

  // 복사 함수들
  const handleCopyContent = async () => {
    try {
      // AI 추천 부분 제외하고 본문만 복사
      const { body } = parseAISuggestions(generatedContent);
      const plainText = htmlToPlainText(body);
      await navigator.clipboard.writeText(plainText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleCopyTitle = async () => {
    const title = extractTitle();
    if (title) {
      await navigator.clipboard.writeText(title);
      setIsTitleCopied(true);
      setTimeout(() => setIsTitleCopied(false), 2000);
    }
  };

  const handleCopyKeywords = async () => {
    const keywords = generateKeywords().join(", ");
    await navigator.clipboard.writeText(keywords);
    setIsKeywordsCopied(true);
    setTimeout(() => setIsKeywordsCopied(false), 2000);
  };

  // 초기화
  const handleReset = () => {
    setKeyword("");
    setContext("");
    setGeneratedContent("");
    setError("");
  };

  const currentType = POST_TYPES[postType];
  const extractedTitle = extractTitle();
  const recommendedKeywords = generateKeywords();

  // AI 추천 파싱 (전자책)
  const { body: parsedBody, suggestions: aiSuggestions } = parseAISuggestions(generatedContent);

  // 전자책이고 AI 추천 이미지가 있으면 사용, 아니면 기본 추천
  const displayImages = postType === "ebook" && aiSuggestions.images.length > 0
    ? aiSuggestions.images
    : IMAGE_RECOMMENDATIONS[postType];

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">부업 블로그 글쓰기</h1>
              <p className="text-sm text-muted-foreground">
                내 경험을 블로그 글로 만들어보세요
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 입력 영역 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 글 유형 선택 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">글 유형</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Object.entries(POST_TYPES) as [PostType, typeof POST_TYPES.challenge][]).map(
                  ([type, config]) => {
                    const Icon = config.icon;
                    const isSelected = postType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setPostType(type)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-4 h-4 ${
                              isSelected ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">{config.name}</span>
                        </div>
                      </button>
                    );
                  }
                )}
              </CardContent>
            </Card>

            {/* 주제 입력 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">주제 입력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword" className="text-sm">키워드 *</Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={currentType.placeholder.keyword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context" className="text-sm">
                    내 상황/경험 <span className="text-muted-foreground">(상세히)</span>
                  </Label>
                  <Textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={currentType.placeholder.context}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    구체적으로 쓸수록 좋은 글이 나와요
                  </p>
                </div>

                {/* 전자책 내용 추천 가이드 */}
                {postType === "ebook" && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">이런 내용을 추가하면 좋아요</span>
                    </div>
                    <ul className="space-y-1">
                      {EBOOK_CONTENT_RECOMMENDATIONS.map((rec, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      글 생성하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 결과 영역 */}
          <div className="lg:col-span-2 space-y-4">
            {generatedContent ? (
              <>
                {/* 제목 & 키워드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 추출된 제목 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4 text-primary" />
                          <CardTitle className="text-sm">추출된 제목</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyTitle}
                          className="h-7 px-2"
                        >
                          {isTitleCopied ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium text-sm">
                        {extractedTitle || "제목을 추출할 수 없습니다"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 추천 키워드 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-primary" />
                          <CardTitle className="text-sm">추천 키워드</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyKeywords}
                          className="h-7 px-2"
                        >
                          {isKeywordsCopied ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {recommendedKeywords.map((kw, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 생성된 본문 */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">생성된 본문</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerate}
                          disabled={isLoading}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          다시 생성
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyContent}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              전체 복사
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* 스타일이 적용된 미리보기 */}
                    <div
                      className="blog-preview p-6 bg-white dark:bg-zinc-900 rounded-lg border overflow-auto max-h-[600px]"
                      dangerouslySetInnerHTML={{ __html: parsedBody }}
                    />
                  </CardContent>
                </Card>

                {/* AI 추천 (전자책일 때만) */}
                {postType === "ebook" && (aiSuggestions.framework || aiSuggestions.improve) && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm">AI 추천</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {aiSuggestions.framework && (
                        <div className="flex items-start gap-2">
                          <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-primary">추천 프레임워크</p>
                            <p className="text-sm">{aiSuggestions.framework}</p>
                          </div>
                        </div>
                      )}
                      {aiSuggestions.improve && (
                        <div className="flex items-start gap-2">
                          <PenLine className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-primary">보완 포인트</p>
                            <p className="text-sm">{aiSuggestions.improve}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 이미지 추천 */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm">추천 이미지</CardTitle>
                      {postType === "ebook" && aiSuggestions.images.length > 0 && (
                        <Badge variant="secondary" className="text-xs">AI 추천</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {displayImages.map((rec, idx) => (
                        <Badge key={idx} variant="outline">
                          {rec}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      직접 찍은 사진/스크린샷이 AI 이미지보다 효과적이에요
                    </p>
                  </CardContent>
                </Card>

                {/* 새 글 쓰기 */}
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="w-full"
                >
                  새 글 쓰기
                </Button>
              </>
            ) : (
              /* 빈 상태 */
              <Card className="h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>왼쪽에서 주제를 입력하고</p>
                  <p>글 생성하기를 눌러주세요</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
