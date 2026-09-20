
import type { Metadata } from "next";
import "./globals.css";

/* =====================================
   집수리모아 대표 도메인
===================================== */

const SITE_URL = "https://www.jipsurimoa.com";

const SITE_NAME = "집수리모아";

const SITE_TITLE =
  "집수리모아 | 전국 집수리 업체 찾기 및 업체 등록";

const SITE_DESCRIPTION =
  "집수리모아에서 서울·경기·인천·충남·충북 등 전국 집수리 업체를 찾아보세요. 싱크볼 리폼, 쿡탑 설치, 철거, 벌목, 욕실 수리, 전기·조명 등 다양한 시공 분야의 업체 정보를 확인하고 홈페이지 및 전화로 문의할 수 있습니다.";

/* =====================================
   검색엔진 메타데이터
===================================== */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  /* 네이버 서치어드바이저 소유확인 */

  verification: {
    other: {
      "naver-site-verification":
        "2196f8953200f9512d5e75a419802445ec28014",
    },
  },

  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "집수리모아",
    "집수리 업체",
    "집수리 업체 찾기",
    "집수리 업체 등록",
    "전국 집수리 업체",
    "서울 집수리",
    "경기 집수리",
    "인천 집수리",
    "충남 집수리",
    "충북 집수리",
    "싱크볼 리폼",
    "사각싱크볼 교체",
    "쿡탑 설치",
    "쿡탑 교체",
    "철거 업체",
    "벌목 업체",
    "욕실 수리",
    "전기 조명 시공",
    "수전 교체",
    "펫도어 설치",
    "냉장고 철거",
  ],

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

/* =====================================
   전체 홈페이지 레이아웃
===================================== */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
