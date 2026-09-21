
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
   메인 카테고리 → 시공 서브페이지 연결
===================================== */

const SERVICE_PAGE_LINKS: Record<string, string> = {
  "종합 집수리": "/services/repair",
  "싱크볼 리폼": "/services/sink",
  "쿡탑 설치": "/services/cooktop",
  "벌목·조경": "/services/tree",
  "에어컨": "/services/aircon",
  "수전 교체": "/services/faucet",
  "펫도어 설치": "/services/petdoor",
  "냉장고 철거": "/services/refrigerator",
};

/* =====================================
   전국 시·도 / 시·군·구
===================================== */

type Province = {
  name: string;
  aliases: string[];
  districts: string[];
};

const PROVINCES: Province[] = [
  {
    name: "서울특별시",
    aliases: ["서울특별시", "서울시", "서울"],
    districts: [
      "강남구", "강동구", "강북구", "강서구",
      "관악구", "광진구", "구로구", "금천구",
      "노원구", "도봉구", "동대문구", "동작구",
      "마포구", "서대문구", "서초구", "성동구",
      "성북구", "송파구", "양천구", "영등포구",
      "용산구", "은평구", "종로구", "중구",
      "중랑구",
    ],
  },
  {
    name: "부산광역시",
    aliases: ["부산광역시", "부산시", "부산"],
    districts: [
      "강서구", "금정구", "기장군", "남구",
      "동구", "동래구", "부산진구", "북구",
      "사상구", "사하구", "서구", "수영구",
      "연제구", "영도구", "중구", "해운대구",
    ],
  },
  {
    name: "대구광역시",
    aliases: ["대구광역시", "대구시", "대구"],
    districts: [
      "군위군", "남구", "달서구", "달성군",
      "동구", "북구", "서구", "수성구", "중구",
    ],
  },
  {
    name: "인천광역시",
    aliases: ["인천광역시", "인천시", "인천"],
    districts: [
      "강화군", "계양구", "남동구", "동구",
      "미추홀구", "부평구", "서구", "연수구",
      "옹진군", "중구",
    ],
  },
  {
    name: "광주광역시",
    aliases: ["광주광역시", "광주광역", "광주"],
    districts: [
      "광산구", "남구", "동구", "북구", "서구",
    ],
  },
  {
    name: "대전광역시",
    aliases: ["대전광역시", "대전시", "대전"],
    districts: [
      "대덕구", "동구", "서구", "유성구", "중구",
    ],
  },
  {
    name: "울산광역시",
    aliases: ["울산광역시", "울산시", "울산"],
    districts: [
      "남구", "동구", "북구", "울주군", "중구",
    ],
  },
  {
    name: "세종특별자치시",
    aliases: [
      "세종특별자치시",
      "세종시",
      "세종",
    ],
    districts: [],
  },
  {
    name: "경기도",
    aliases: ["경기도", "경기"],
    districts: [
      "가평군", "고양시", "과천시", "광명시",
      "광주시", "구리시", "군포시", "김포시",
      "남양주시", "동두천시", "부천시", "성남시",
      "수원시", "시흥시", "안산시", "안성시",
      "안양시", "양주시", "양평군", "여주시",
      "연천군", "오산시", "용인시", "의왕시",
      "의정부시", "이천시", "파주시", "평택시",
      "포천시", "하남시", "화성시",
    ],
  },
  {
    name: "강원특별자치도",
    aliases: [
      "강원특별자치도",
      "강원도",
      "강원",
    ],
    districts: [
      "강릉시", "고성군", "동해시", "삼척시",
      "속초시", "양구군", "양양군", "영월군",
      "원주시", "인제군", "정선군", "철원군",
      "춘천시", "태백시", "평창군", "홍천군",
      "화천군", "횡성군",
    ],
  },
  {
    name: "충청북도",
    aliases: ["충청북도", "충북"],
    districts: [
      "괴산군", "단양군", "보은군", "영동군",
      "옥천군", "음성군", "제천시", "증평군",
      "진천군", "청주시", "충주시",
    ],
  },
  {
    name: "충청남도",
    aliases: ["충청남도", "충남"],
    districts: [
      "계룡시", "공주시", "금산군", "논산시",
      "당진시", "보령시", "부여군", "서산시",
      "서천군", "아산시", "예산군", "천안시",
      "청양군", "태안군", "홍성군",
    ],
  },
  {
    name: "전북특별자치도",
    aliases: [
      "전북특별자치도",
      "전라북도",
      "전북",
    ],
    districts: [
      "고창군", "군산시", "김제시", "남원시",
      "무주군", "부안군", "순창군", "완주군",
      "익산시", "임실군", "장수군", "전주시",
      "정읍시", "진안군",
    ],
  },
  {
    name: "전라남도",
    aliases: ["전라남도", "전남"],
    districts: [
      "강진군", "고흥군", "곡성군", "광양시",
      "구례군", "나주시", "담양군", "목포시",
      "무안군", "보성군", "순천시", "신안군",
      "여수시", "영광군", "영암군", "완도군",
      "장성군", "장흥군", "진도군", "함평군",
      "해남군", "화순군",
    ],
  },
  {
    name: "경상북도",
    aliases: ["경상북도", "경북"],
    districts: [
      "경산시", "경주시", "고령군", "구미시",
      "김천시", "문경시", "봉화군", "상주시",
      "성주군", "안동시", "영덕군", "영양군",
      "영주시", "영천시", "예천군", "울릉군",
      "울진군", "의성군", "청도군", "청송군",
      "칠곡군", "포항시",
    ],
  },
  {
    name: "경상남도",
    aliases: ["경상남도", "경남"],
    districts: [
      "거제시", "거창군", "고성군", "김해시",
      "남해군", "밀양시", "사천시", "산청군",
      "양산시", "의령군", "진주시", "창녕군",
      "창원시", "통영시", "하동군", "함안군",
      "함양군", "합천군",
    ],
  },
  {
    name: "제주특별자치도",
    aliases: [
      "제주특별자치도",
      "제주도",
      "제주",
    ],
    districts: ["서귀포시", "제주시"],
  },
];

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
   업체 이미지
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
   검색어 및 지역명 정리
===================================== */

function normalizeKeyword(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function compact(
  value: string
): string {
  return value.replace(/\s+/g, "").trim();
}

function getProvince(
  provinceName: string
): Province | undefined {
  return PROVINCES.find(
    (item) => item.name === provinceName
  );
}

function isNationwide(
  value: string
): boolean {
  return [
    "전국",
    "전국전체",
    "전국전지역",
    "전국시공",
  ].includes(compact(value));
}

function isCapitalArea(
  value: string
): boolean {
  return [
    "수도권",
    "수도권전체",
    "수도권전지역",
  ].includes(compact(value));
}

/* =====================================
   지역 문자열을 시·도와 비교
===================================== */

function regionStartsWithProvince(
  region: string,
  province: Province
): boolean {
  const value = compact(region);

  return province.aliases.some((alias) =>
    value.startsWith(alias)
  );
}

function isWholeProvince(
  region: string,
  province: Province
): boolean {
  const value = compact(region);

  return province.aliases.some((alias) =>
    [
      alias,
      `${alias}전체`,
      `${alias}전지역`,
      `${alias}전역`,
    ].includes(value)
  );
}

/* =====================================
   업체의 시·도 서비스 가능 여부
===================================== */

function servesProvince(
  company: CompanyWithWebsite,
  provinceName: string
): boolean {
  const province = getProvince(provinceName);

  if (!province) {
    return false;
  }

  return company.regions.some((region) => {
    if (isNationwide(region)) {
      return true;
    }

    if (
      [
        "서울특별시",
        "경기도",
        "인천광역시",
      ].includes(provinceName) &&
      isCapitalArea(region)
    ) {
      return true;
    }

    return regionStartsWithProvince(
      region,
      province
    );
  });
}

/* =====================================
   업체의 시·군·구 서비스 가능 여부
===================================== */

function servesDistrict(
  company: CompanyWithWebsite,
  provinceName: string,
  districtName: string
): boolean {
  const province = getProvince(provinceName);

  if (!province) {
    return false;
  }

  const targetDistrict = compact(districtName);

  return company.regions.some((region) => {
    const value = compact(region);

    if (
      isNationwide(region) ||
      isWholeProvince(region, province)
    ) {
      return true;
    }

    if (
      [
        "서울특별시",
        "경기도",
        "인천광역시",
      ].includes(provinceName) &&
      isCapitalArea(region)
    ) {
      return true;
    }

    if (
      !regionStartsWithProvince(
        region,
        province
      )
    ) {
      return false;
    }

    const matchedAlias = [
      ...province.aliases,
    ]
      .sort((a, b) => b.length - a.length)
      .find((alias) =>
        value.startsWith(alias)
      );

    if (!matchedAlias) {
      return false;
    }

    const remaining = value.slice(
      matchedAlias.length
    );

    if (remaining === targetDistrict) {
      return true;
    }

    return remaining.startsWith(
      targetDistrict
    );
  });
}

/* =====================================
   시공 종류별 실제 시공 사진

   public 폴더에 업로드한 사진 사용
===================================== */

const serviceImages: Record<string, string> = {
  "종합 집수리": "/IMG_3406.jpeg",

  "싱크볼 리폼": "/IMG_1096.jpeg",

  "쿡탑 설치": "/IMG_2972.jpeg",

  "철거·원상복구": "/IMG_3095.jpeg",

  "벌목·조경": "/IMG_4137.jpeg",

  "욕실 수리": "/IMG_3510.jpeg",

  "전기·조명": "/IMG_3216.jpeg",

  "에어컨": "/IMG_2756.jpeg",

  "수전 교체": "/IMG_3424.jpeg",

  "펫도어 설치": "/IMG_3489.jpeg",

  "냉장고 철거": "/IMG_3095.jpeg",

  "기타 시공": "/IMG_3193.jpeg",
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
     전국 지역 선택 상태
  ===================================== */

  const [selectedProvince, setSelectedProvince] =
    useState("");

  const [selectedDistrict, setSelectedDistrict] =
    useState("");

  const [showRegionFinder, setShowRegionFinder] =
    useState(false);

  const currentProvince = useMemo(
    () => getProvince(selectedProvince),
    [selectedProvince]
  );

  function scrollToResults() {
    document
      .getElementById("results")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function openRegionFinder() {
    setShowRegionFinder(true);

    requestAnimationFrame(() => {
      document
        .getElementById("region-finder")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  function selectProvince(value: string) {
    setSelectedProvince(value);
    setSelectedDistrict("");
    setRegion("");
  }

  function clearRegionSelection() {
    setSelectedProvince("");
    setSelectedDistrict("");
    setRegion("");
  }

  function showRegionResults() {
    setRegion("");
    setKeyword("");
    setKeywordInput("");
    scrollToResults();
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
      const allRows: CompanyRow[] = [];
      const pageSize = 500;
      let offset = 0;

      while (true) {
        const query = new URLSearchParams({
          select:
            "id,name,description,phone,regions,services,images,website_url",
          order: "id.asc",
          limit: String(pageSize),
          offset: String(offset),
        });

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/approved_companies?${query.toString()}`,
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

        const pageRows = rows as CompanyRow[];

        allRows.push(...pageRows);

        if (pageRows.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      setCompanies(allRows.map(toCompany));
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
        console.error("검색어 기록 오류:", err);
      }
    },
    [loadPopularKeywords]
  );

  /* =====================================
     검색 실행
  ===================================== */

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
     업체 필터링
  ===================================== */

  const filtered = useMemo(() => {
    return companies.filter((company) => {
      const matchProvince =
        !selectedProvince ||
        (
          selectedDistrict
            ? servesDistrict(
                company,
                selectedProvince,
                selectedDistrict
              )
            : servesProvince(
                company,
                selectedProvince
              )
        );

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
        matchProvince &&
        matchRegion &&
        matchService &&
        matchKeyword
      );
    });
  }, [
    companies,
    selectedProvince,
    selectedDistrict,
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
            onClick={openRegionFinder}
            style={{
              padding: "8px 11px",
              border: "1px solid #dbeafe",
              borderRadius: "9px",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            📍 지역별 찾기
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
              onChange={(event) => {
                setRegion(event.target.value);
                setSelectedProvince("");
                setSelectedDistrict("");
              }}
              aria-label="기존 지역 검색"
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

          <button
            type="button"
            onClick={openRegionFinder}
            style={{
              marginTop: "16px",
              padding: "10px 4px",
              border: "none",
              background: "transparent",
              color: "#1d4ed8",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            📍 시·도 / 시·군·구로 업체 찾기 →
          </button>
        </div>
      </section>

      {/* =====================================
         전국 지역별 업체 찾기
      ===================================== */}

      <section
        id="region-finder"
        className="section container"
        style={{
          scrollMarginTop: "20px",
        }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "22px",
            background: "#ffffff",
            boxShadow:
              "0 5px 20px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: 800,
                  marginBottom: "6px",
                }}
              >
                FIND BY LOCATION
              </span>

              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "23px",
                }}
              >
                📍 지역별 업체 찾기
              </h2>

              <p
                style={{
                  marginBottom: 0,
                  color: "#64748b",
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                전국 시·도와 시·군·구를
                선택해 보세요.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowRegionFinder(
                  (previous) => !previous
                )
              }
              aria-expanded={showRegionFinder}
              style={{
                padding: "10px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                background: "#f8fafc",
                color: "#334155",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showRegionFinder
                ? "접기 ▲"
                : "지역 선택 ▼"}
            </button>
          </div>

          {showRegionFinder && (
            <div
              style={{
                marginTop: "22px",
                paddingTop: "20px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
                  gap: "12px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  01. 시·도 선택

                  <select
                    value={selectedProvince}
                    onChange={(event) =>
                      selectProvince(event.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "11px",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "15px",
                    }}
                  >
                    <option value="">
                      전국 전체
                    </option>

                    {PROVINCES.map((province) => (
                      <option
                        key={province.name}
                        value={province.name}
                      >
                        {province.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  02. 시·군·구 선택

                  <select
                    value={selectedDistrict}
                    disabled={
                      !selectedProvince ||
                      !currentProvince ||
                      currentProvince.districts.length === 0
                    }
                    onChange={(event) => {
                      setSelectedDistrict(
                        event.target.value
                      );
                      setRegion("");
                    }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "11px",
                      background:
                        selectedProvince &&
                        currentProvince &&
                        currentProvince.districts.length > 0
                          ? "#ffffff"
                          : "#f1f5f9",
                      color: "#0f172a",
                      fontSize: "15px",
                    }}
                  >
                    <option value="">
                      {!selectedProvince
                        ? "시·도를 먼저 선택"
                        : currentProvince?.districts.length === 0
                        ? "시·도 전체"
                        : "시·군·구 전체"}
                    </option>

                    {currentProvince?.districts.map(
                      (district) => (
                        <option
                          key={district}
                          value={district}
                        >
                          {district}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "18px",
                }}
              >
                <button
                  type="button"
                  onClick={showRegionResults}
                  style={{
                    flex: "1 1 180px",
                    padding: "14px 18px",
                    border: "none",
                    borderRadius: "11px",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {selectedDistrict
                    ? `${selectedDistrict} 업체 보기 →`
                    : selectedProvince
                    ? `${selectedProvince} 전체 업체 보기 →`
                    : "전국 업체 보기 →"}
                </button>

                <button
                  type="button"
                  onClick={clearRegionSelection}
                  style={{
                    padding: "14px 18px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "11px",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  지역 초기화
                </button>
              </div>

              <p
                style={{
                  marginBottom: 0,
                  marginTop: "14px",
                  color: "#64748b",
                  fontSize: "12px",
                  lineHeight: 1.7,
                }}
              >
                선택한 지역에서 작업하는
                등록 업체를 보여줍니다.
                업체가 없는 지역도 선택할 수 있습니다.
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
                      clearRegionSelection();
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
                          overflowWrap: "anywhere",
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
          {services.map((item) => {
            const pageHref = SERVICE_PAGE_LINKS[item];

            const cardContent = (
              <>
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
              </>
            );

            const cardStyle = {
              padding: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column" as const,
              justifyContent: "flex-start",
              background: "#ffffff",
              textDecoration: "none",
            };

            if (pageHref) {
              return (
                <Link
                  key={item}
                  href={pageHref}
                  className="serviceCard"
                  style={cardStyle}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
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
                style={cardStyle}
              >
                {cardContent}
              </button>
            );
          })}
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

          {selectedProvince && (
            <p
              style={{
                color: "#2563eb",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              📍 {selectedProvince}
              {selectedDistrict
                ? ` · ${selectedDistrict}`
                : " 전체"}
            </p>
          )}
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

                      <h3>{company.name}</h3>

                      <p>{company.description}</p>

                      <div className="companyInfo">
                        <span>
                          📍 {company.regions.join(", ")}
                        </span>

                        <span>
                          🛠️ {company.services.join(", ")}
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
                  : "선택한 지역과 검색 조건에 맞는 등록 업체가 없습니다."}
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
