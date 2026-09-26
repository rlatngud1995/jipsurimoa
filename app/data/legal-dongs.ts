/* =========================================
   집수리모아 전국 법정동 데이터

   파일:
   app/data/legal-dongs.ts

   행정표준코드관리시스템(code.go.kr)
   법정동 전체자료를 기반으로 생성된
   공개 데이터에서 전국 지역을 읽는다.

   기존 문제:
   ZIP 내부 TXT 하나만 잘못 읽으면서
   천안시에서 불당동 등 일부만 노출됨.

   수정:
   전국 시·도별 전체 데이터 읽기
   → 시군구 구분
   → 법정동 / 읍 / 면 전체 추출

   예:
   충청남도 천안시 서북구 불당동
   → region: 충청남도
   → district: 천안시
   → neighborhood: 불당동

   충청남도 천안시 동남구 대흥동
   → district: 천안시
   → neighborhood: 대흥동

   경기도 수원시 팔달구 인계동
   → district: 수원시
   → neighborhood: 인계동
========================================= */

export type LegalDong = {
  region: string;
  district: string;
  neighborhood: string;
  fullName: string;
};

/* =========================================
   데이터 주소

   이 저장소 데이터는
   행정표준코드관리시스템
   법정동코드 전체자료를 기반으로 생성됨
========================================= */

const DATA_BASE_URL =
  "https://raw.githubusercontent.com/wellsa-ai/admincode-kr/main/kr";

/* =========================================
   전국 시·도

   기존 집수리모아 지역 구조와 맞춤
========================================= */

const REGION_FILES = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
] as const;

/* =========================================
   메모리 캐시
========================================= */

let memoryCache:
  | {
      createdAt: number;
      data: LegalDong[];
    }
  | null = null;

const CACHE_TIME =
  1000 * 60 * 60 * 24;

/* =========================================
   문자열 정리
========================================= */

function clean(
  value: string
): string {
  return value
    .replace(/\r/g, "")
    .trim();
}

/* =========================================
   시군구 헤더에서
   집수리모아 기준 district 추출

   예:

   종로구
   → 종로구

   천안시 동남구
   → 천안시

   천안시 서북구
   → 천안시

   수원시 팔달구
   → 수원시

   고양시 일산동구
   → 고양시
========================================= */

function getMainDistrict(
  heading: string
): string {
  const parts =
    heading
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "";
  }

  /*
    첫 번째가 시/군이면
    일반구가 뒤에 있더라도
    첫 번째 시군을 사용

    예:
    수원시 팔달구
    → 수원시
  */

  if (
    /(?:시|군)$/.test(
      parts[0]
    )
  ) {
    return parts[0];
  }

  /*
    서울 종로구,
    부산 해운대구처럼
    구 자체가 기초단위
  */

  return parts[0];
}

/* =========================================
   법정동 항목인지 확인

   데이터 예:

   불당동
   성정동
   직산읍
   입장면
   팔달로1가

   아래는 제외:

   직산읍 군동리
   성거읍 저리
   병천면 가전리

   즉 "리" 하위 주소는 제외하고
   읍면동/법정동 단위까지만 사용
========================================= */

function isNeighborhoodItem(
  value: string
): boolean {
  const text =
    clean(value);

  if (!text) {
    return false;
  }

  if (
    text.startsWith("(")
  ) {
    return false;
  }

  /*
    공백이 있다는 것은 대부분

    성환읍 성환리
    목천읍 신계리

    같은 리 단위이므로 제외
  */

  if (
    /\s/.test(text)
  ) {
    return false;
  }

  /*
    한글 법정동명,
    숫자가 들어간 동,
    '가' 지역까지 허용

    예:
    반포동
    팔달로1가
    충장로5가
  */

  return /^[가-힣0-9·]+$/.test(
    text
  );
}

/* =========================================
   시도별 Markdown 파싱
========================================= */

function parseRegionMarkdown(
  region: string,
  markdown: string
): LegalDong[] {
  const result:
    LegalDong[] = [];

  const lines =
    markdown
      .replace(/\r/g, "")
      .split("\n");

  let currentDistrict =
    "";

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const line =
      clean(
        lines[i]
      );

    /*
      ## 천안시
      ## 천안시 동남구
      ## 천안시 서북구
      ## 종로구
    */

    if (
      line.startsWith(
        "## "
      )
    ) {
      const heading =
        line
          .replace(
            /^##\s+/,
            ""
          )
          .trim();

      currentDistrict =
        getMainDistrict(
          heading
        );

      continue;
    }

    if (
      !currentDistrict
    ) {
      continue;
    }

    if (
      !line ||
      line.startsWith("#") ||
      line.startsWith("---") ||
      line.startsWith("sido:") ||
      line.startsWith("generated:") ||
      line.startsWith("source:") ||
      line.startsWith("sigungu_count:") ||
      line.startsWith("legal_dong_count:")
    ) {
      continue;
    }

    if (
      line.includes(
        "하위 법정동 없음"
      )
    ) {
      continue;
    }

    /*
      한 줄:

      불당동 · 성정동 · 두정동 · ...
    */

    const items =
      line
        .split("·")
        .map(
          (item) =>
            clean(item)
        )
        .filter(Boolean);

    for (
      const item of
      items
    ) {
      if (
        !isNeighborhoodItem(
          item
        )
      ) {
        continue;
      }

      result.push({
        region,

        district:
          currentDistrict,

        neighborhood:
          item,

        fullName:
          `${region} ${currentDistrict} ${item}`,
      });
    }
  }

  return result;
}

/* =========================================
   시도 파일 하나 다운로드
========================================= */

async function loadRegion(
  region: string
): Promise<LegalDong[]> {
  const url =
    `${DATA_BASE_URL}/${encodeURIComponent(
      region
    )}.md`;

  try {
    const response =
      await fetch(
        url,
        {
          next: {
            revalidate:
              86400,
          },
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        `법정동 데이터 조회 실패: ${region}`,
        response.status
      );

      return [];
    }

    const text =
      await response.text();

    return parseRegionMarkdown(
      region,
      text
    );
  } catch (
    error
  ) {
    console.error(
      `법정동 데이터 오류: ${region}`,
      error
    );

    return [];
  }
}

/* =========================================
   전국 데이터 로드
========================================= */

export async function loadLegalDongs(): Promise<
  LegalDong[]
> {
  /*
    메모리 캐시
  */

  if (
    memoryCache &&
    Date.now() -
      memoryCache.createdAt <
      CACHE_TIME
  ) {
    return memoryCache.data;
  }

  /*
    전국 시도 동시에 로드
  */

  const results =
    await Promise.all(
      REGION_FILES.map(
        (region) =>
          loadRegion(
            region
          )
      )
    );

  /*
    중복 제거

    일반구가 있는 도시:

    천안시 동남구
    천안시 서북구

    둘 다 district는 천안시로 합쳐지지만
    법정동 이름이 같을 수 있으므로
    중복 제거
  */

  const unique =
    new Map<
      string,
      LegalDong
    >();

  for (
    const regionData of
    results
  ) {
    for (
      const item of
      regionData
    ) {
      const key =
        [
          item.region,
          item.district,
          item.neighborhood,
        ].join("|");

      if (
        !unique.has(
          key
        )
      ) {
        unique.set(
          key,
          item
        );
      }
    }
  }

  const data =
    [
      ...unique.values(),
    ].sort(
      (a, b) => {
        const regionCompare =
          a.region.localeCompare(
            b.region,
            "ko"
          );

        if (
          regionCompare !==
          0
        ) {
          return regionCompare;
        }

        const districtCompare =
          a.district.localeCompare(
            b.district,
            "ko"
          );

        if (
          districtCompare !==
          0
        ) {
          return districtCompare;
        }

        return a.neighborhood.localeCompare(
          b.neighborhood,
          "ko"
        );
      }
    );

  if (
    data.length ===
    0
  ) {
    throw new Error(
      "전국 법정동 데이터를 불러오지 못했습니다."
    );
  }

  memoryCache = {
    createdAt:
      Date.now(),

    data,
  };

  return data;
}

/* =========================================
   특정 시군구의 전체 법정동 조회

   예:

   getLegalNeighborhoods(
     "충청남도",
     "천안시"
   )

   결과 예:

   구성동
   구룡동
   다가동
   대흥동
   두정동
   백석동
   불당동
   성거읍
   성남면
   성정동
   성환읍
   신부동
   쌍용동
   입장면
   직산읍
   청수동
   ...
========================================= */

export async function getLegalNeighborhoods(
  region: string,
  district: string
): Promise<string[]> {
  const data =
    await loadLegalDongs();

  const result =
    new Set<string>();

  for (
    const item of
    data
  ) {
    if (
      item.region !==
      region
    ) {
      continue;
    }

    if (
      item.district !==
      district
    ) {
      continue;
    }

    result.add(
      item.neighborhood
    );
  }

  return [
    ...result,
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ko"
      )
  );
}

/* =========================================
   시도 전체 읍면동/법정동

   세종용
========================================= */

export async function getRegionNeighborhoods(
  region: string
): Promise<string[]> {
  const data =
    await loadLegalDongs();

  const result =
    new Set<string>();

  for (
    const item of
    data
  ) {
    if (
      item.region !==
      region
    ) {
      continue;
    }

    result.add(
      item.neighborhood
    );
  }

  return [
    ...result,
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ko"
      )
  );
}
