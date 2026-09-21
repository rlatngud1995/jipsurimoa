
import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = "https://www.jipsurimoa.com";

const SITE_TITLE =
  "집수리모아 | 지역별 집수리·시공 업체 찾기";

const SITE_DESCRIPTION =
  "집수리모아에서 서울·경기·인천 등 전국 지역별 집수리 및 시공 업체를 찾아보세요. 쿡탑 설치·교체, 싱크볼 리폼, 벌목, 에어컨 시공, 수전 교체, 펫도어 설치, 냉장고 철거 등 서비스별 업체 정보와 시공 가능 지역을 확인할 수 있습니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: "%s | 집수리모아",
  },

  description: SITE_DESCRIPTION,

  applicationName: "집수리모아",

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "집수리모아",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
