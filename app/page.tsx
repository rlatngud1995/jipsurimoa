
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { regions, services } from "./data";
import type { Company } from "./data";

/* =====================================
   기본 설정
===================================== */

const EASY_HOMECARE_URL =
  "https://easyhomecare.vercel.app/";

/* =====================================
   Supabase 연결
===================================== */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
    /\/rest\/v1\/?$/,
    ""
  ) ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type CompanyRow = {
  id: string;
  name: string | null;
  description: string | null;
  phone: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
};

function toCompany(row: CompanyRow): Company {
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
  };
}

/* =====================================
   업체별 홈페이지 연결
===================================== */

function getCompanyWebsite(
  company: Company
): string | null {
  const normalizedName = company.name
    .replace(/\s+/g, "")
    .trim();

  if (normalizedName === "이지종합건설") {
    return EASY_HOMECARE_URL;
  }

  return null;
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
   메인 홈페이지
===================================== */

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [region, setRegion] = useState("");
  const [service, setService] = useState("");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        `${SUPABASE_URL}/rest/v1/approved_companies?select=id,name,description,phone,regions,services,images`,
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

      const rows: unknown = await response.json();

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

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  /* =====================================
     업체 검색
  ===================================== */

  const filtered = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return companies.filter((company) => {
      const matchRegion =
        !region || company.regions.includes(region);

      const matchService =
        !service || company.services.includes(service);

      const searchableText = [
        company.name,
        company.description,
        ...company.services,
        ...company.regions,
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword =
        !normalizedKeyword ||
        searchableText.includes(normalizedKeyword);

      return (
        matchRegion &&
        matchService &&
        matchKeyword
      );
    });
  }, [companies, region, service, keyword]);

  function scrollToResults() {
    document
      .getElementById("results")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

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

        <nav>
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

          <div className="searchBox">
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
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  scrollToResults();
                }
              }}
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
              type="button"
              onClick={scrollToResults}
              className="primaryButton"
            >
              업체 검색하기
            </button>
          </div>
        </div>
      </section>

      {/* 시공 종류별 카테고리 */}

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

      {/* 업체 검색 결과 */}

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
                const website =
                  getCompanyWebsite(company);

                return (
                  <article
                    className="companyCard"
                    key={company.id}
                  >
                    <div className="companyImage">
                      {company.images.length > 0 ? (
                        <img
                          src={company.images[0]}
                          alt={`${company.name} 시공사례`}
                          loading="lazy"
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
                        {website ? (
                          <a
                            href={website}
                            className="outlineButton"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            상세보기
                          </a>
                        ) : (
                          <Link
                            href={`/companies/${company.id}`}
                            className="outlineButton"
                          >
                            상세보기
                          </Link>
                        )}

                        {company.phone && (
                          <a
                            href={`tel:${company.phone}`}
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

      {/* 하단 정보 */}

      <footer className="footer">
        <div className="container">
          <strong>
            집수리모아
          </strong>

          <p>
            전국 집수리 업체 검색 및 연결 플랫폼
          </p>

          <small>
            © 2026 집수리모아.
            All rights reserved.
          </small>
        </div>
      </footer>
    </main>
  );
}
