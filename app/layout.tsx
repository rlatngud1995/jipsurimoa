
import type { Metadata } from "next";
import "./globals.css";

/* =====================================
   집수리모아 대표 주소
===================================== */

const SITE_URL = "https://www.jipsurimoa.com";

const SITE_NAME = "집수리모아";

const SITE_TITLE =
  "집수리모아 | 전국 집수리 업체 찾기 및 업체 등록";

/*
  네이버 사이트 간단 체크용 설명문
  80자 이내로 간결하게 작성
*/
const SITE_DESCRIPTION =
  "전국 집수리 업체를 지역과 시공 종류별로 찾아보세요. 쿡탑 교체, 싱크볼 리폼, 벌목 등 업체 정보를 확인할 수 있습니다.";

/* =====================================
   링크 미리보기 대표 이미지

   GitHub public 폴더에 업로드한
   집수리모아 이미지 파일명
===================================== */

const OG_IMAGE =
  "/E8D72AE4-157B-42E4-BBFC-A52615EB4A63.png";

/* =====================================
   검색엔진 메타데이터
===================================== */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

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

  /* =====================================
     문자·카카오톡 링크 미리보기
  ===================================== */

  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",

    images: [
      {
        url: OG_IMAGE,
        width: 1536,
        height: 1024,
        alt: "집수리모아 대표 이미지",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
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

   기존 globals.css 연결 유지
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
