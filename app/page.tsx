
"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { regions, services } from "./data";

import type { Company } from "./data";

import Footer from "./Footer";

/* =====================================
   기본 설정
===================================== */

const EASY_HOMECARE_IMAGE = "/IMG_0778.png";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/* =====================================
   서울 25개 구

   기존에 만든 구별 쿡탑 페이지로 연결
===================================== */

const SEOUL_DISTRICTS = [
  { slug: "gangnam-gu", name: "강남구" },
  { slug: "gangdong-gu", name: "강동구" },
  { slug: "gangbuk-gu", name: "강북구" },
  { slug: "gangseo-gu", name: "강서구" },
  { slug: "gwanak-gu", name: "관악구" },
  { slug: "gwangjin-gu", name: "광진구" },
  { slug: "guro-gu", name: "구로구" },
  { slug: "geumcheon-gu", name: "금천구" },
  { slug: "nowon-gu", name: "노원구" },
  { slug: "dobong-gu", name: "도봉구" },
  { slug: "dongdaemun-gu", name: "동대문구" },
  { slug: "dongjak-gu", name: "동작구" },
  { slug: "mapo-gu", name: "마포구" },
  { slug: "seodaemun-gu", name: "서대문구" },
  { slug: "seocho-gu", name: "서초구" },
  { slug: "seongdong-gu", name: "성동구" },
  { slug: "seongbuk-gu", name: "성북구" },
  { slug: "songpa-gu", name: "송파구" },
  { slug: "yangcheon-gu", name: "양천구" },
  { slug: "yeongdeungpo-gu", name: "영등포구" },
  { slug: "yongsan-gu", name: "용산구" },
  { slug: "eunpyeong-gu", name: "은평구" },
  { slug: "jongno-gu", name: "종로구" },
  { slug: "jung-gu", name: "중구" },
  { slug: "jungnang-gu", name: "중랑구" },
] as const;

/* =====================================
   업체 데이터 타입
===================================== */

type CompanyWithWebsite = Company & {
  website_url: string | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
  description: string | null;
  phone: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
  website_url: string | null;
};

type PopularKeyword = {
  keyword: string;
  search_count: number;
};

function toCompany(
  row: CompanyRow
): CompanyWithWebsite {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    phone: row.phone ?? "",
    regions: Array.isArray(row.regions)
      ? row.regions
      : [],
    services: Array.isArray(row.services)
      ? row.services
      : [],
    images: Array.isArray(row.images)
      ? row.images
      : [],
    website_url: row.website_url ?? null,
  };
}

/* =====================================
   업체별 대표 이미지
===================================== */

function isEasyHomecare(
  company: CompanyWithWebsite
): boolean {
  return (
    company.name.replace(/\s+/g, "").trim() ===
    "이지종합건설"
  );
}

function getCompanyImage(
  company: CompanyWithWebsite
): string | null {
  if (isEasyHomecare(company)) {
    return EASY_HOMECARE_IMAGE;
  }

  return company.images.length > 0
    ? company.images[0]
    : null;
}

/* =====================================
   검색어 정리
===================================== */

function normalizeKeyword(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* =====================================
   시공 종류별 이미지
===================================== */

const serviceImages: Record<string, string> = {
  "종합 집수리":
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",

  "싱크볼 리폼":
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&auto=format&fit=crop&q=80",

  "쿡탑 설치":
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80",

  "철거·원상복구":
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80",

  "벌목·조경":
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80",

  "욕실 수리":
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&auto=format&fit=crop&q=80",

  "전기·조명":
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",

  "에어컨":
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&auto=format&fit=crop&q=80",

  "수전 교체":
    "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=600&auto=format&fit=crop&q=80",

  "펫도어 설치":
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop&q=80",

  "냉장고 철거":
    "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80",

  "기타 시공":
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80",
};

/* =====================================
   홈페이지
===================================== */

export default function Home() {
  const [companies, setCompanies] =
    useState<CompanyWithWebsite[]>([]);

  const [region, setRegion] = useState("");
  const [service, setService] = useState("");

  const [keywordInput, setKeywordInput] =
    useState("");

  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [popularKeywords, setPopularKeywords] =
    useState<PopularKeyword[]>([]);

  const [popularLoading, setPopularLoading] =
    useState(true);

  const [popularError, setPopularError] =
    useState("");

  /* =====================================
     서울 지역 선택 메뉴
  ===================================== */

  const [showSeoulDistricts, setShowSeoulDistricts] =
    useState(false);

  function openSeoulDistricts() {
    setShowSeoulDistricts(true);

    requestAnimationFrame(() => {
      document
        .getElementById("seoul-regions")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  /* =====================================
     승인 업체 불러오기
  ===================================== */

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setError(
        "업체 검색 설정을 확인할 수 없습니다."
      );

      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/approved_companies?select=id,name,description,phone,regions,services,images,website_url`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `업체 목록을 불러오지 못했습니다. (${response.status})`
        );
      }

      const rows: unknown =
        await response.json();

      if (!Array.isArray(rows)) {
        throw new Error(
          "업체 목록의 응답 형식이 올바르지 않습니다."
        );
      }

      setCompanies(
        (rows as CompanyRow[]).map(toCompany)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "업체 목록을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =====================================
     인기 검색어 불러오기
  ===================================== */

  const loadPopularKeywords =
    useCallback(async () => {
      setPopularLoading(true);
      setPopularError("");

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setPopularError(
          "인기 검색어 연결 설정을 확인할 수 없습니다."
        );

        setPopularLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/get_popular_keywords`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `인기 검색어를 불러오지 못했습니다. (${response.status})`
          );
        }

        const rows: unknown =
          await response.json();

        if (!Array.isArray(rows)) {
          throw new Error(
            "인기 검색어 응답 형식이 올바르지 않습니다."
          );
        }

        setPopularKeywords(
          (rows as PopularKeyword[]).filter(
            (item) =>
              typeof item.keyword === "string" &&
              typeof item.search_count === "number"
          )
        );
      } catch (err) {
        setPopularError(
          err instanceof Error
            ? err.message
            : "인기 검색어를 불러오지 못했습니다."
        );
      } finally {
        setPopularLoading(false);
      }
    }, []);

  /* =====================================
     최초 데이터 불러오기
  ===================================== */

  useEffect(() => {
    void loadCompanies();
    void loadPopularKeywords();
  }, [loadCompanies, loadPopularKeywords]);

  /* =====================================
     검색어 기록
  ===================================== */

  const recordKeyword = useCallback(
    async (value: string) => {
      const normalized =
        normalizeKeyword(value);

      if (
        normalized.length < 2 ||
        normalized.length > 50 ||
        !SUPABASE_URL ||
        !SUPABASE_KEY
      ) {
        return;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/record_search_keyword`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              p_keyword: normalized,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `검색어 저장 실패 (${response.status})`
          );
        }

        await loadPopularKeywords();
      } catch (err) {
        console.error(
          "검색어 기록 오류:",
          err
        );
      }
    },
    [loadPopularKeywords]
  );

  /* =====================================
     검색 결과 위치로 이동
  ===================================== */

  function scrollToResults() {
    document
      .getElementById("results")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function runSearch(value: string) {
    const normalized =
      normalizeKeyword(value);

    setKeywordInput(value);
    setKeyword(normalized);

    if (normalized) {
      void recordKeyword(normalized);
    }

    scrollToResults();
  }

  /* =====================================
     업체 검색
  ===================================== */

  const filtered = useMemo(() => {
    return companies.filter((company) => {
      const matchRegion =
        !region ||
        company.regions.includes(region);

      const matchService =
        !service ||
        company.services.includes(service);

      const searchableText = [
        company.name,
        company.description,
        ...company.services,
        ...company.regions,
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword =
        !keyword ||
        searchableText.includes(keyword);

      return (
        matchRegion &&
        matchService &&
        matchKeyword
      );
    });
  }, [
    companies,
    region,
    service,
    keyword,
  ]);

  /* =====================================
     화면
  ===================================== */

  return (
    <main>
      {/* 상단 메뉴 */}

      <header className="header">
        <Link href="/" className="logo">
          🏠 집수리모아
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={openSeoulDistricts}
            style={{
              padding: "8px 10px",
              border: "1px solid #2563eb",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            📍 지역 선택
          </button>

          <Link href="/companies">
            업체 찾기
          </Link>

          <Link href="/register">
            업체 등록
          </Link>
        </nav>
      </header>

      {/* 메인 검색 화면 */}

      <section className="hero">
        <div className="container">
          <span className="heroBadge">
            전국 집수리 업체 검색 플랫폼
          </span>

          <h1>
            우리 동네 집수리 전문가를
            <br />
            쉽고 빠르게 찾아보세요!
          </h1>

          <p>
            지역과 시공 종류를 선택하면
            원하는 집수리 업체를 찾아볼 수 있습니다.
          </p>

          <form
            className="searchBox"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch(keywordInput);
            }}
          >
            <select
              value={region}
              onChange={(event) =>
                setRegion(event.target.value)
              }
              aria-label="지역 선택"
            >
              <option value="">
                전체 지역
              </option>

              {regions.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <input
              type="search"
              placeholder="업체명 또는 시공 키워드"
              value={keywordInput}
              onChange={(event) =>
                setKeywordInput(event.target.value)
              }
              aria-label="업체명 또는 시공 키워드"
              maxLength={50}
            />

            <select
              value={service}
              onChange={(event) =>
                setService(event.target.value)
              }
              aria-label="시공 종류 선택"
            >
              <option value="">
                전체 시공 종류
              </option>

              {services.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="primaryButton"
            >
              업체 검색하기
            </button>
          </form>

          {/* 지역별 페이지 이동 버튼 */}

          <button
            type="button"
            onClick={openSeoulDistricts}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "520px",
              margin: "22px auto 0",
              padding: "16px 20px",
              border: "2px solid #2563eb",
              borderRadius: "14px",
              background: "#ffffff",
              color: "#1d4ed8",
              fontSize: "17px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow:
                "0 5px 18px rgba(37, 99, 235, 0.10)",
            }}
          >
            📍 서울 지역별 업체 찾기 →
          </button>
        </div>
      </section>

      {/* =====================================
         서울 25개 구 선택 메뉴
      ===================================== */}

      <section
        id="seoul-regions"
        className="section container"
        style={{
          scrollMarginTop: "20px",
        }}
      >
        <div
          style={{
            padding: "24px",
            border: "1px solid #bfdbfe",
            borderRadius: "18px",
            background: "#eff6ff",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#1e40af",
              fontSize: "24px",
            }}
          >
            📍 서울 지역별 업체 찾기
          </h2>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            서울 전체 또는 원하는 구를 선택해
            해당 지역의 쿡탑 설치·교체 업체를
            확인하세요.
          </p>

          <button
            type="button"
            onClick={() =>
              setShowSeoulDistricts(
                (previous) => !previous
              )
            }
            aria-expanded={showSeoulDistricts}
            aria-controls="seoul-district-list"
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "17px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {showSeoulDistricts
              ? "서울 25개 구 목록 닫기 ▲"
              : "서울 25개 구 선택하기 ▼"}
          </button>

          {showSeoulDistricts && (
            <div
              id="seoul-district-list"
              style={{
                marginTop: "18px",
              }}
            >
              <Link
                href="/seoul/cooktop"
                style={{
                  display: "block",
                  padding: "15px",
                  marginBottom: "12px",
                  borderRadius: "10px",
                  background: "#1d4ed8",
                  color: "#ffffff",
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                서울 전체 쿡탑 설치·교체 업체 →
              </Link>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
                  gap: "10px",
                }}
              >
                {SEOUL_DISTRICTS.map(
                  (district) => (
                    <Link
                      key={district.slug}
                      href={`/seoul/${district.slug}/cooktop`}
                      style={{
                        display: "block",
                        padding: "14px 10px",
                        border: "1px solid #bfdbfe",
                        borderRadius: "10px",
                        background: "#ffffff",
                        color: "#1d4ed8",
                        textAlign: "center",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      {district.name} →
                    </Link>
                  )
                )}
              </div>

              <p
                style={{
                  marginTop: "16px",
                  marginBottom: 0,
                  color: "#64748b",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                현재 지역별 바로가기는 기존에 만든
                쿡탑 설치·교체 페이지로 연결됩니다.
                동별 선택 메뉴는 실제 동 목록과
                페이지 오류를 정리한 뒤 연결합니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================
         인기 검색어 TOP 10
      ===================================== */}

      <section className="section container">
        <div
          style={{
            padding: "22px",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            background: "#ffffff",
            boxShadow:
              "0 4px 18px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#111827",
              }}
            >
              🔥 인기 검색어 TOP 10
            </h2>

            <span
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#fff7ed",
                color: "#c2410c",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              최근 30일
            </span>
          </div>

          <p
            style={{
              marginTop: "8px",
              marginBottom: "20px",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            집수리모아에서 실제로 검색된
            키워드 순위입니다. 검색어를 누르면
            관련 업체를 바로 찾아볼 수 있습니다.
          </p>

          {popularLoading ? (
            <div className="emptyBox">
              인기 검색어를 불러오는 중입니다...
            </div>
          ) : popularError ? (
            <div
              className="emptyBox"
              role="alert"
              style={{
                color: "#b91c1c",
              }}
            >
              <p>{popularError}</p>

              <button
                type="button"
                className="outlineButton"
                onClick={() => {
                  void loadPopularKeywords();
                }}
              >
                다시 불러오기
              </button>
            </div>
          ) : popularKeywords.length === 0 ? (
            <div className="emptyBox">
              아직 집계된 검색어가 없습니다.
              위 검색창에서 첫 검색을 해보세요!
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "10px",
              }}
            >
              {popularKeywords.map(
                (item, index) => (
                  <button
                    key={item.keyword}
                    type="button"
                    onClick={() => {
                      setRegion("");
                      setService("");
                      runSearch(item.keyword);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "#ffffff",
                      color: "#111827",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "24px",
                          color:
                            index < 3
                              ? "#ea580c"
                              : "#6b7280",
                          fontSize: "17px",
                        }}
                      >
                        {index + 1}
                      </strong>

                      <span
                        style={{
                          overflowWrap:
                            "anywhere",
                          fontSize: "15px",
                          fontWeight: 600,
                        }}
                      >
                        {item.keyword}
                      </span>
                    </span>

                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      {item.search_count}회
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              textAlign: "right",
            }}
          >
            <Link
              href="/companies"
              className="outlineButton"
            >
              전체 업체 찾아보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================
         시공 종류별 카테고리
      ===================================== */}

      <section className="section container">
        <div className="sectionTitle">
          <h2>
            어떤 시공이 필요하세요?
          </h2>

          <p>
            필요한 집수리 서비스를 선택해 보세요.
          </p>
        </div>

        <div className="serviceGrid">
          {services.map((item) => (
            <button
              type="button"
              key={item}
              className={
                service === item
                  ? "serviceCard selected"
                  : "serviceCard"
              }
              onClick={() => {
                setService(item);
                scrollToResults();
              }}
              style={{
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  overflow: "hidden",
                  background: "#eff6ff",
                }}
              >
                <img
                  src={serviceImages[item]}
                  alt={`${item} 시공 예시`}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
              </div>

              <strong
                style={{
                  padding: "12px 5px",
                  color: "#1e3a8a",
                  fontSize: "13px",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {item}
              </strong>
            </button>
          ))}
        </div>
      </section>

      {/* =====================================
         업체 검색 결과
      ===================================== */}

      <section
        id="results"
        className="section container"
      >
        <div className="sectionTitle">
          <h2>
            집수리 업체 둘러보기
          </h2>

          <p>
            {loading
              ? "업체 목록을 불러오는 중입니다..."
              : error
              ? "업체 목록을 불러오지 못했습니다."
              : `검색 조건에 맞는 업체 ${filtered.length}곳`}
          </p>
        </div>

        {error && (
          <div
            className="emptyBox"
            role="alert"
            style={{
              color: "#b91c1c",
            }}
          >
            {error}

            <div
              style={{
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  void loadCompanies();
                }}
                className="outlineButton"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        )}

        {!error && !loading && (
          <>
            <div className="companyGrid">
              {filtered.map((company) => {
                const companyImage =
                  getCompanyImage(company);

                return (
                  <article
                    className="companyCard"
                    key={company.id}
                  >
                    <div className="companyImage">
                      {companyImage ? (
                        <img
                          src={companyImage}
                          alt={`${company.name} 대표 이미지`}
                          loading="lazy"
                          style={
                            isEasyHomecare(company)
                              ? {
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  background: "#ffffff",
                                }
                              : undefined
                          }
                        />
                      ) : (
                        <span aria-hidden="true">
                          🏠
                        </span>
                      )}
                    </div>

                    <div className="companyContent">
                      <span className="companyBadge">
                        등록 업체
                      </span>

                      <h3>
                        {company.name}
                      </h3>

                      <p>
                        {company.description}
                      </p>

                      <div className="companyInfo">
                        <span>
                          📍{" "}
                          {company.regions.join(", ")}
                        </span>

                        <span>
                          🛠️{" "}
                          {company.services.join(", ")}
                        </span>
                      </div>

                      <div className="companyActions">
                        <Link
                          href={`/companies/${encodeURIComponent(
                            company.id
                          )}`}
                          className="outlineButton"
                        >
                          상세보기
                        </Link>

                        {company.phone && (
                          <a
                            href={`tel:${company.phone.replace(
                              /[^\d+]/g,
                              ""
                            )}`}
                            className="primaryButton"
                          >
                            📞 전화 문의
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="emptyBox">
                {companies.length === 0
                  ? "현재 공개된 업체가 없습니다. 업체 승인 후 이곳에 표시됩니다."
                  : "검색 조건에 맞는 등록 업체가 없습니다."}
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="emptyBox">
            업체 목록을 불러오는 중입니다...
          </div>
        )}
      </section>

      {/* 업체 등록 안내 */}

      <section className="registerBanner">
        <div className="container">
          <h2>
            집수리 업체를 운영하고 계신가요?
          </h2>

          <p>
            집수리모아에 업체를 등록하고
            고객에게 시공 서비스를 소개해 보세요.
          </p>

          <Link
            href="/register"
            className="whiteButton"
          >
            업체 등록 신청하기
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
