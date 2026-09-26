/* =====================================
   집수리모아 전국 지역 공통 타입
===================================== */

export type Neighborhood = {
  slug: string;
  name: string;
};

export type DistrictArea = {
  slug: string;
  name: string;
  neighborhoods: Neighborhood[];
};

export type ProvinceArea = {
  slug: string;
  name: string;
  aliases: string[];
  districts: DistrictArea[];
};

/* =====================================
   지역명 정규화
===================================== */

export function normalizeAreaName(value: string): string {
  return decodeURIComponent(value)
    .replace(/\s+/g, "")
    .trim();
}

/* =====================================
   읍·면·동 URL slug 생성

   예:
   불당동 → 불당동
   쌍용1동 → 쌍용1동

   한글 slug를 사용하는 이유:
   임의 영문 로마자 변환으로
   잘못된 행정구역 URL이 생기는 것을 방지한다.
===================================== */

export function makeNeighborhoodSlug(
  name: string
): string {
  return normalizeAreaName(name);
}

/* =====================================
   읍·면·동 여부
===================================== */

export function isNeighborhoodName(
  value: string
): boolean {
  const name = normalizeAreaName(value);

  return /^[가-힣0-9·]+(?:동|읍|면)$/.test(name);
}

/* =====================================
   지역 URL 생성
===================================== */

export function makeAreaPath(
  service: string,
  province?: string,
  district?: string,
  neighborhood?: string
): string {
  const parts = [
    "services",
    service,
    province,
    district,
    neighborhood,
  ].filter(
    (value): value is string =>
      typeof value === "string" &&
      value.length > 0
  );

  return `/${parts
    .map((value) => encodeURIComponent(value))
    .join("/")}`;
}

/* =====================================
   읍·면·동 찾기
===================================== */

export function findNeighborhood(
  district: DistrictArea,
  value: string
): Neighborhood | undefined {
  const normalized = normalizeAreaName(value);

  return district.neighborhoods.find(
    (item) =>
      normalizeAreaName(item.slug) === normalized ||
      normalizeAreaName(item.name) === normalized
  );
}

/* =====================================
   지역 찾기
===================================== */

export function findProvince(
  areas: ProvinceArea[],
  value: string
): ProvinceArea | undefined {
  const normalized = normalizeAreaName(value);

  return areas.find(
    (province) =>
      province.slug === normalized ||
      province.name === normalized ||
      province.aliases.some(
        (alias) =>
          normalizeAreaName(alias) === normalized
      )
  );
}

export function findDistrict(
  province: ProvinceArea,
  value: string
): DistrictArea | undefined {
  const normalized = normalizeAreaName(value);

  return province.districts.find(
    (district) =>
      district.slug === normalized ||
      normalizeAreaName(district.name) ===
        normalized
  );
}

/* =====================================
   실제 전국 행정구역 데이터

   이 배열은 별도 생성 데이터 파일에서 가져온다.

   page.tsx / sitemap에서 직접 행정구역을
   중복 관리하지 않도록 하기 위한 공통 구조.
===================================== */

export const AREAS: ProvinceArea[] = [];
