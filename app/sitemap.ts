import type { MetadataRoute } from "next";

const SITE_URL = "https://www.jipsurimoa.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },

    // 종합 집수리
    {
      url: `${SITE_URL}/services/repair`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 싱크볼 리폼
    {
      url: `${SITE_URL}/services/sink`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 쿡탑 설치
    {
      url: `${SITE_URL}/services/cooktop`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 철거·원상복구
    {
      url: `${SITE_URL}/services/demolition`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 벌목·조경
    {
      url: `${SITE_URL}/services/tree`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 욕실 수리
    {
      url: `${SITE_URL}/services/bathroom`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 전기·조명
    {
      url: `${SITE_URL}/services/electrical`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 에어컨
    {
      url: `${SITE_URL}/services/aircon`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 수전 교체
    {
      url: `${SITE_URL}/services/faucet`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 누수·수도설비
    {
      url: `${SITE_URL}/services/plumbing`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 펫도어 설치
    {
      url: `${SITE_URL}/services/petdoor`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 냉장고 철거
    {
      url: `${SITE_URL}/services/refrigerator`,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // 기타 시공
    {
      url: `${SITE_URL}/services/other`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
