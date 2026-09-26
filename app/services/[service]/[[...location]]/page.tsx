import type { Metadata } from "next";
import Link from "next/link";
import {
  notFound,
  permanentRedirect,
} from "next/navigation";
import { cache } from "react";

import {
  getLegalNeighborhoods,
  getRegionNeighborhoods,
} from "../../../data/legal-dongs";

/* =====================================
   기본 설정
===================================== */

const SITE_URL =
  "https://www.jipsurimoa.com";

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_KEY =
  process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/* =====================================
   타입 정의
===================================== */

type Service = {
  slug: string;
  name: string;
  keyword: string;
  matches: string[];
  description: string;
};

type Region = {
  slug: string;
  name: string;

  /*
    행정표준코드 데이터에서 사용하는
    공식 시·도 이름
  */
  officialName: string;

  aliases: string[];
  districts: string;
};

type District = {
  slug: string;
  name: string;
};

type Company = {
  id: string | number;
  name: string | null;
  description: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
  website_url: string | null;
};

type CompanyResult = {
  companies: Company[];
  success: boolean;
};

type PageProps = {
  params: Promise<{
    service: string;
    location?: string[];
  }>;
};

/* =====================================
   서비스 카테고리
   총 13개
===================================== */

const SERVICES: Service[] = [
  {
    slug: "repair",
    name: "종합 집수리",
    keyword: "집수리",
    matches: [
      "집수리",
      "종합수리",
    ],
    description:
      "주택과 상가의 집수리 업체를 찾아보세요.",
  },

  {
    slug: "sink",
    name: "싱크볼 리폼",
    keyword: "싱크볼교체",
    matches: [
      "싱크볼",
      "싱크대",
      "싱크",
    ],
    description:
      "싱크볼 설치·교체 및 주방 리폼 업체를 찾아보세요.",
  },

  {
    slug: "cooktop",
    name: "쿡탑 설치·교체",
    keyword: "쿡탑교체",
    matches: [
      "쿡탑",
      "인덕션",
      "가스레인지",
      "가스렌지",
    ],
    description:
      "쿡탑·인덕션·가스레인지 설치 및 교체 업체를 찾아보세요.",
  },

  {
    slug: "demolition",
    name: "철거·원상복구",
    keyword: "철거 원상복구",
    matches: [
      "철거",
      "원상복구",
      "폐기물",
    ],
    description:
      "주택과 상가의 철거 및 원상복구 업체를 찾아보세요.",
  },

  {
    slug: "tree",
    name: "벌목·조경",
    keyword: "벌목",
    matches: [
      "벌목",
      "조경",
      "나무제거",
      "위험목",
    ],
    description:
      "벌목 및 조경 업체를 찾아보세요.",
  },

  {
    slug: "bathroom",
    name: "욕실 수리",
    keyword: "욕실수리",
    matches: [
      "욕실",
      "화장실",
      "변기",
      "세면대",
      "샤워부스",
      "욕조",
    ],
    description:
      "욕실과 화장실 수리 업체를 찾아보세요.",
  },

  {
    slug: "electrical",
    name: "전기·조명",
    keyword: "전기 조명 시공",
    matches: [
      "전기",
      "조명",
      "콘센트",
      "스위치",
      "차단기",
      "실링팬",
    ],
    description:
      "전기 및 조명 설치·교체 업체를 찾아보세요.",
  },

  {
    slug: "aircon",
    name: "에어컨",
    keyword: "에어컨시공",
    matches: [
      "에어컨",
    ],
    description:
      "에어컨 관련 시공 업체를 찾아보세요.",
  },

  {
    slug: "faucet",
    name: "수전 교체",
    keyword: "수전교체",
    matches: [
      "수전",
    ],
    description:
      "주방과 욕실 수전 교체 업체를 찾아보세요.",
  },

  {
    slug: "plumbing",
    name: "누수·수도설비",
    keyword: "누수 수도설비",
    matches: [
      "누수",
      "누수탐지",
      "누수공사",
      "수도설비",
      "수도배관",
      "수도수리",
      "수도공사",
      "배관",
      "배관수리",
      "배관누수",
      "수도관",
      "수도관교체",
    ],
    description:
      "누수탐지, 수도설비, 수도배관 및 각종 배관 수리 업체를 찾아보세요.",
  },

  {
    slug: "petdoor",
    name: "펫도어 설치",
    keyword: "펫도어설치",
    matches: [
      "펫도어",
    ],
    description:
      "펫도어 설치 업체를 찾아보세요.",
  },

  {
    slug: "refrigerator",
    name: "냉장고 철거",
    keyword: "냉장고철거",
    matches: [
      "냉장고철거",
      "냉장고장철거",
    ],
    description:
      "냉장고 및 냉장고장 철거 업체를 찾아보세요.",
  },

  {
    slug: "other",
    name: "기타 시공",
    keyword: "기타 집수리 시공",
    matches: [
      "기타 시공",
      "기타시공",
      "기타 집수리",
      "기타집수리",
    ],
    description:
      "다양한 기타 집수리 및 시공 업체를 찾아보세요.",
  },
];

/* =====================================
   전국 지역 데이터
===================================== */

const REGIONS: Region[] = [
  {
    slug: "seoul",
    name: "서울",
    officialName: "서울특별시",
    aliases: [
      "서울",
      "서울시",
      "서울특별시",
    ],
    districts:
      "gangnam:강남구,gangdong:강동구,gangbuk:강북구,gangseo:강서구,gwanak:관악구,gwangjin:광진구,guro:구로구,geumcheon:금천구,nowon:노원구,dobong:도봉구,dongdaemun:동대문구,dongjak:동작구,mapo:마포구,seodaemun:서대문구,seocho:서초구,seongdong:성동구,seongbuk:성북구,songpa:송파구,yangcheon:양천구,yeongdeungpo:영등포구,yongsan:용산구,eunpyeong:은평구,jongno:종로구,jung:중구,jungnang:중랑구",
  },

  {
    slug: "gyeonggi",
    name: "경기",
    officialName: "경기도",
    aliases: [
      "경기",
      "경기도",
    ],
    districts:
      "gapyeong:가평군,goyang:고양시,gwacheon:과천시,gwangmyeong:광명시,gwangju:광주시,guri:구리시,gunpo:군포시,gimpo:김포시,namyangju:남양주시,dongducheon:동두천시,bucheon:부천시,seongnam:성남시,suwon:수원시,siheung:시흥시,ansan:안산시,anseong:안성시,anyang:안양시,yangju:양주시,yangpyeong:양평군,yeoju:여주시,yeoncheon:연천군,osan:오산시,yongin:용인시,uiwang:의왕시,uijeongbu:의정부시,icheon:이천시,paju:파주시,pyeongtaek:평택시,pocheon:포천시,hanam:하남시,hwaseong:화성시",
  },

  {
    slug: "incheon",
    name: "인천",
    officialName: "인천광역시",
    aliases: [
      "인천",
      "인천시",
      "인천광역시",
    ],
    districts:
      "ganghwa:강화군,gyeyang:계양구,namdong:남동구,michuhol:미추홀구,bupyeong:부평구,yeonsu:연수구,ongjin:옹진군,jemulpo:제물포구,yeongjong:영종구,seohae:서해구,geomdan:검단구",
  },

  {
    slug: "busan",
    name: "부산",
    officialName: "부산광역시",
    aliases: [
      "부산",
      "부산시",
      "부산광역시",
    ],
    districts:
      "gangseo:강서구,geumjeong:금정구,gijang:기장군,nam:남구,dong:동구,dongnae:동래구,busanjin:부산진구,buk:북구,sasang:사상구,saha:사하구,seo:서구,suyeong:수영구,yeonje:연제구,yeongdo:영도구,jung:중구,haeundae:해운대구",
  },

  {
    slug: "daegu",
    name: "대구",
    officialName: "대구광역시",
    aliases: [
      "대구",
      "대구시",
      "대구광역시",
    ],
    districts:
      "gunwi:군위군,nam:남구,dalseo:달서구,dalseong:달성군,dong:동구,buk:북구,seo:서구,suseong:수성구,jung:중구",
  },

  {
    slug: "gwangju",
    name: "광주",
    officialName: "광주광역시",
    aliases: [
      "광주",
      "광주광역시",
    ],
    districts:
      "gwangsan:광산구,nam:남구,dong:동구,buk:북구,seo:서구",
  },

  {
    slug: "daejeon",
    name: "대전",
    officialName: "대전광역시",
    aliases: [
      "대전",
      "대전시",
      "대전광역시",
    ],
    districts:
      "daedeok:대덕구,dong:동구,seo:서구,yuseong:유성구,jung:중구",
  },

  {
    slug: "ulsan",
    name: "울산",
    officialName: "울산광역시",
    aliases: [
      "울산",
      "울산시",
      "울산광역시",
    ],
    districts:
      "nam:남구,dong:동구,buk:북구,ulju:울주군,jung:중구",
  },

  {
    slug: "sejong",
    name: "세종",
    officialName: "세종특별자치시",
    aliases: [
      "세종",
      "세종시",
      "세종특별자치시",
    ],
    districts: "",
  },

  {
    slug: "gangwon",
    name: "강원",
    officialName: "강원특별자치도",
    aliases: [
      "강원",
      "강원도",
      "강원특별자치도",
    ],
    districts:
      "gangneung:강릉시,goseong:고성군,donghae:동해시,samcheok:삼척시,sokcho:속초시,yanggu:양구군,yangyang:양양군,yeongwol:영월군,wonju:원주시,inje:인제군,jeongseon:정선군,cheorwon:철원군,chuncheon:춘천시,taebaek:태백시,pyeongchang:평창군,hongcheon:홍천군,hwacheon:화천군,hoengseong:횡성군",
  },

  {
    slug: "chungbuk",
    name: "충북",
    officialName: "충청북도",
    aliases: [
      "충북",
      "충청북도",
    ],
    districts:
      "goesan:괴산군,danyang:단양군,boeun:보은군,yeongdong:영동군,okcheon:옥천군,eumseong:음성군,jecheon:제천시,jeungpyeong:증평군,jincheon:진천군,cheongju:청주시,chungju:충주시",
  },

  {
    slug: "chungnam",
    name: "충남",
    officialName: "충청남도",
    aliases: [
      "충남",
      "충청남도",
    ],
    districts:
      "gyeryong:계룡시,gongju:공주시,geumsan:금산군,nonsan:논산시,dangjin:당진시,boryeong:보령시,buyeo:부여군,seosan:서산시,seocheon:서천군,asan:아산시,yesan:예산군,cheonan:천안시,cheongyang:청양군,taean:태안군,hongseong:홍성군",
  },

  {
    slug: "jeonbuk",
    name: "전북",
    officialName: "전북특별자치도",
    aliases: [
      "전북",
      "전라북도",
      "전북특별자치도",
    ],
    districts:
      "gochang:고창군,gunsan:군산시,gimje:김제시,namwon:남원시,muju:무주군,buan:부안군,sunchang:순창군,wanju:완주군,iksan:익산시,imsil:임실군,jangsu:장수군,jeonju:전주시,jeongeup:정읍시,jinan:진안군",
  },

  {
    slug: "jeonnam",
    name: "전남",
    officialName: "전라남도",
    aliases: [
      "전남",
      "전라남도",
    ],
    districts:
      "gangjin:강진군,goheung:고흥군,gokseong:곡성군,gwangyang:광양시,gurye:구례군,naju:나주시,damyang:담양군,mokpo:목포시,muan:무안군,boseong:보성군,suncheon:순천시,sinan:신안군,yeosu:여수시,yeonggwang:영광군,yeongam:영암군,wando:완도군,jangseong:장성군,jangheung:장흥군,jindo:진도군,hampyeong:함평군,haenam:해남군,hwasun:화순군",
  },

  {
    slug: "gyeongbuk",
    name: "경북",
    officialName: "경상북도",
    aliases: [
      "경북",
      "경상북도",
    ],
    districts:
      "gyeongsan:경산시,gyeongju:경주시,goryeong:고령군,gumi:구미시,gimcheon:김천시,mungyeong:문경시,bonghwa:봉화군,sangju:상주시,seongju:성주군,andong:안동시,yeongdeok:영덕군,yeongyang:영양군,yeongju:영주시,yeongcheon:영천시,yecheon:예천군,ulleung:울릉군,uljin:울진군,uiseong:의성군,cheongdo:청도군,cheongsong:청송군,chilgok:칠곡군,pohang:포항시",
  },

  {
    slug: "gyeongnam",
    name: "경남",
    officialName: "경상남도",
    aliases: [
      "경남",
      "경상남도",
    ],
    districts:
      "geoje:거제시,geochang:거창군,goseong:고성군,gimhae:김해시,namhae:남해군,miryang:밀양시,sacheon:사천시,sancheong:산청군,yangsan:양산시,uiryeong:의령군,jinju:진주시,changnyeong:창녕군,changwon:창원시,tongyeong:통영시,hadong:하동군,haman:함안군,hamyang:함양군,hapcheon:합천군",
  },

  {
    slug: "jeju",
    name: "제주",
    officialName: "제주특별자치도",
    aliases: [
      "제주",
      "제주도",
      "제주특별자치도",
    ],
    districts:
      "seogwipo:서귀포시,jeju:제주시",
  },
];

/* =====================================
   공통 함수
===================================== */

function getDistricts(
  region: Region
): District[] {
  if (!region.districts) {
    return [];
  }

  return region.districts
    .split(",")
    .map((entry) => {
      const [
        slug,
        name,
      ] = entry.split(":");

      return {
        slug,
        name,
      };
    })
    .filter(
      (item) =>
        item.slug &&
        item.name
    );
}

function normalize(
  value: string
): string {
  return value
    .replace(/\s+/g, "")
    .trim();
}

function decode(
  value: string
): string {
  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}

function makePath(
  service: string,
  location: string[] = []
): string {
  return `/services/${service}${
    location.length
      ? "/" +
        location
          .map(
            encodeURIComponent
          )
          .join("/")
      : ""
  }`;
}

/* =====================================
   공식 읍면동 캐시
===================================== */

const getOfficialNeighborhoods =
  cache(
    async (
      region: Region,
      district?: District
    ): Promise<string[]> => {
      try {
        /*
          세종은 시군구 단계 없음
        */

        if (
          region.slug ===
          "sejong"
        ) {
          return await getRegionNeighborhoods(
            region.officialName
          );
        }

        if (!district) {
          return [];
        }

        return await getLegalNeighborhoods(
          region.officialName,
          district.name
        );
      } catch (error) {
        console.error(
          "공식 읍면동 조회 실패:",
          error
        );

        return [];
      }
    }
  );

/* =====================================
   페이지 기본 정보

   일반 지역:
   /service/시도/시군구/동

   세종:
   /service/sejong/동
===================================== */

function getPageInfo(
  serviceSlug: string,
  rawLocation: string[] = []
) {
  const service =
    SERVICES.find(
      (item) =>
        item.slug ===
        serviceSlug
    );

  const location =
    rawLocation.map(
      decode
    );

  const region =
    REGIONS.find(
      (item) =>
        item.slug ===
          location[0] ||
        item.aliases.includes(
          location[0]
        )
    );

  /*
    세종은

    /services/sink/sejong/조치원읍

    구조 사용
  */

  if (
    region?.slug ===
    "sejong"
  ) {
    const neighborhood =
      location[1];

    const valid =
      !!service &&
      location.length <= 2 &&
      (location.length === 1 ||
        (location.length === 2 &&
          /^[가-힣0-9·]+(?:동|읍|면)$/.test(
            neighborhood
          )));

    const canonicalLocation =
      [
        region.slug,
        neighborhood,
      ].filter(
        (
          value
        ): value is string =>
          !!value
      );

    return {
      service,
      region,
      district:
        undefined as
          | District
          | undefined,
      neighborhood,
      location,
      canonicalLocation,
      valid,
    };
  }

  const district =
    region
      ? getDistricts(
          region
        ).find(
          (item) =>
            item.slug ===
              location[1] ||
            item.name ===
              location[1]
        )
      : undefined;

  const neighborhood =
    location[2];

  const valid =
    !!service &&
    location.length <= 3 &&
    (location.length === 0 ||
      !!region) &&
    (location.length < 2 ||
      !!district) &&
    (location.length < 3 ||
      (!!district &&
        /^[가-힣0-9·]+(?:동|읍|면)$/.test(
          neighborhood
        )));

  const canonicalLocation =
    [
      region?.slug,
      district?.slug,
      neighborhood,
    ].filter(
      (
        value
      ): value is string =>
        !!value
    );

  return {
    service,
    region,
    district,
    neighborhood,
    location,
    canonicalLocation,
    valid,
  };
}

/* =====================================
   지역명
===================================== */

function getAreaName(
  region?: Region,
  district?: District,
  neighborhood?: string
): string {
  if (!region) {
    return "";
  }

  /*
    세종
  */

  if (
    region.slug ===
    "sejong"
  ) {
    return neighborhood
      ? `${region.name} ${neighborhood}`
      : region.name;
  }

  if (!district) {
    return region.name;
  }

  const shortName =
    district.name.endsWith(
      "시"
    ) ||
    district.name.endsWith(
      "군"
    )
      ? district.name.slice(
          0,
          -1
        )
      : district.name;

  const duplicateCount =
    REGIONS.filter(
      (item) =>
        getDistricts(
          item
        ).some(
          (candidate) =>
            candidate.name ===
            district.name
        )
    ).length;

  const area =
    duplicateCount > 1
      ? `${region.name} ${shortName}`
      : shortName;

  return neighborhood
    ? `${area} ${neighborhood}`
    : area;
}

function getTitle(
  service: Service,
  region?: Region,
  district?: District,
  neighborhood?: string
): string {
  const area =
    getAreaName(
      region,
      district,
      neighborhood
    );

  return area
    ? `${area} ${service.keyword}`
    : `${service.keyword} 업체 찾기`;
}

/* =====================================
   Supabase 승인 업체 조회
===================================== */

const loadCompanies =
  cache(
    async (): Promise<CompanyResult> => {
      if (
        !SUPABASE_URL ||
        !SUPABASE_KEY
      ) {
        console.error(
          "Supabase 환경변수를 확인하세요."
        );

        return {
          companies: [],
          success: false,
        };
      }

      const companies:
        Company[] = [];

      const pageSize =
        500;

      try {
        for (
          let offset = 0;
          ;
          offset += pageSize
        ) {
          const params =
            new URLSearchParams(
              {
                select:
                  "id,name,description,regions,services,images,website_url",

                limit:
                  String(
                    pageSize
                  ),

                offset:
                  String(
                    offset
                  ),
              }
            );

          const response =
            await fetch(
              `${SUPABASE_URL}/rest/v1/approved_companies?${params.toString()}`,
              {
                headers: {
                  apikey:
                    SUPABASE_KEY,

                  Authorization:
                    `Bearer ${SUPABASE_KEY}`,
                },

                next: {
                  revalidate:
                    300,
                },
              }
            );

          if (
            !response.ok
          ) {
            console.error(
              "업체 조회 실패:",
              response.status
            );

            return {
              companies: [],
              success: false,
            };
          }

          const rows =
            (await response.json()) as Company[];

          companies.push(
            ...rows
          );

          if (
            rows.length <
            pageSize
          ) {
            break;
          }
        }

        return {
          companies,
          success: true,
        };
      } catch (
        error
      ) {
        console.error(
          "업체 조회 오류:",
          error
        );

        return {
          companies: [],
          success: false,
        };
      }
    }
  );

/* =====================================
   업체 서비스 일치
===================================== */

function matchesService(
  company: Company,
  service: Service
): boolean {
  return (
    company.services ?? []
  ).some(
    (registered) =>
      service.matches.some(
        (keyword) =>
          normalize(
            registered
          ).includes(
            normalize(
              keyword
            )
          )
      )
  );
}

/* =====================================
   지역 업체 필터
===================================== */

function isWholeArea(
  value: string
): boolean {
  return [
    "",
    "전체",
    "전지역",
    "전역",
  ].includes(value);
}

function getRegionRemainder(
  registered: string,
  region: Region
): string | null {
  const value =
    normalize(
      registered
    );

  const alias =
    [
      ...region.aliases,
      region.officialName,
    ]
      .sort(
        (a, b) =>
          b.length -
          a.length
      )
      .find(
        (name) =>
          value.startsWith(
            normalize(
              name
            )
          )
      );

  if (!alias) {
    return null;
  }

  return value.slice(
    normalize(
      alias
    ).length
  );
}

function matchesRegion(
  company: Company,
  region?: Region,
  district?: District,
  neighborhood?: string
): boolean {
  if (!region) {
    return true;
  }

  return (
    company.regions ?? []
  ).some(
    (registered) => {
      const value =
        normalize(
          registered
        );

      if (
        [
          "전국",
          "전국전체",
          "전국전지역",
        ].includes(value)
      ) {
        return true;
      }

      if (
        [
          "seoul",
          "gyeonggi",
          "incheon",
        ].includes(
          region.slug
        ) &&
        [
          "수도권",
          "수도권전체",
          "수도권전지역",
        ].includes(
          value
        )
      ) {
        return true;
      }

      const remainder =
        getRegionRemainder(
          registered,
          region
        );

      if (
        remainder ===
        null
      ) {
        return false;
      }

      if (
        isWholeArea(
          remainder
        )
      ) {
        return true;
      }

      /*
        세종

        시군구 단계 없이
        바로 읍면동 비교
      */

      if (
        region.slug ===
        "sejong"
      ) {
        if (
          !neighborhood
        ) {
          return true;
        }

        return (
          remainder ===
            normalize(
              neighborhood
            ) ||
          isWholeArea(
            remainder
          )
        );
      }

      if (
        !district
      ) {
        return true;
      }

      if (
        !remainder.startsWith(
          normalize(
            district.name
          )
        )
      ) {
        return false;
      }

      const afterDistrict =
        remainder.slice(
          normalize(
            district.name
          ).length
        );

      if (
        !neighborhood
      ) {
        return true;
      }

      if (
        isWholeArea(
          afterDistrict
        )
      ) {
        return true;
      }

      /*
        등록값에 일반구가 들어간 경우도 대응

        예:
        충남 천안시 서북구 불당동

        neighborhood = 불당동
      */

      return (
        afterDistrict ===
          normalize(
            neighborhood
          ) ||
        afterDistrict.endsWith(
          normalize(
            neighborhood
          )
        )
      );
    }
  );
}

/* =====================================
   실제 공식 동인지 검증
===================================== */

async function validateNeighborhood(
  region?: Region,
  district?: District,
  neighborhood?: string
): Promise<boolean> {
  if (
    !region ||
    !neighborhood
  ) {
    return true;
  }

  const neighborhoods =
    await getOfficialNeighborhoods(
      region,
      district
    );

  /*
    공식 데이터 서버에 문제가 생겨
    목록을 못 가져온 경우
    사이트 전체를 404 처리하지 않음
  */

  if (
    neighborhoods.length ===
    0
  ) {
    return true;
  }

  return neighborhoods.includes(
    neighborhood
  );
}

/* =====================================
   SEO 메타데이터
===================================== */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolved =
    await params;

  const info =
    getPageInfo(
      resolved.service,
      resolved.location
    );

  if (
    !info.valid ||
    !info.service
  ) {
    return {
      title:
        "페이지를 찾을 수 없습니다 | 집수리모아",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  if (
    info.neighborhood
  ) {
    const validNeighborhood =
      await validateNeighborhood(
        info.region,
        info.district,
        info.neighborhood
      );

    if (
      !validNeighborhood
    ) {
      return {
        title:
          "페이지를 찾을 수 없습니다 | 집수리모아",

        robots: {
          index: false,
          follow: false,
        },
      };
    }
  }

  const title =
    getTitle(
      info.service,
      info.region,
      info.district,
      info.neighborhood
    );

  const canonical =
    SITE_URL +
    makePath(
      info.service.slug,
      info.canonicalLocation
    );

  const description =
    `${title} 업체를 집수리모아에서 찾아보세요. ` +
    `${info.service.description} ` +
    "시공 가능 지역, 업체 소개, 시공 사진 및 홈페이지를 확인할 수 있습니다.";

  const result =
    await loadCompanies();

  const matched =
    result.companies.filter(
      (company) =>
        matchesService(
          company,
          info.service!
        ) &&
        matchesRegion(
          company,
          info.region,
          info.district,
          info.neighborhood
        )
    );

  /*
    업체가 없는 동 페이지는
    검색엔진 품질상 noindex 유지

    업체가 생기면 자동 index
  */

  const allowIndex =
    !result.success ||
    matched.length > 0;

  return {
    title: {
      absolute:
        `${title} | 집수리모아`,
    },

    description,

    alternates: {
      canonical,
    },

    openGraph: {
      title:
        `${title} | 집수리모아`,

      description,

      url:
        canonical,

      siteName:
        "집수리모아",

      locale:
        "ko_KR",

      type:
        "website",
    },

    robots: {
      index:
        allowIndex,

      follow:
        true,
    },
  };
}

/* =====================================
   화면 스타일
===================================== */

const pageStyle = {
  minHeight: "100vh",
  background: "#f7f9fc",
  color: "#172033",
  padding:
    "28px 16px 70px",
} as const;

const panelStyle = {
  background:
    "#ffffff",

  border:
    "1px solid #e5eaf1",

  borderRadius:
    18,

  padding:
    22,

  marginBottom:
    20,
} as const;

const linkStyle = {
  display:
    "inline-block",

  padding:
    "10px 14px",

  border:
    "1px solid #dce5f0",

  borderRadius:
    10,

  color:
    "#263b59",

  background:
    "#ffffff",

  textDecoration:
    "none",

  fontSize:
    14,

  fontWeight:
    600,
} as const;

/* =====================================
   지역별 서비스 페이지
===================================== */

export default async function ServiceLocationPage({
  params,
}: PageProps) {
  const resolved =
    await params;

  const info =
    getPageInfo(
      resolved.service,
      resolved.location
    );

  if (
    !info.valid ||
    !info.service
  ) {
    notFound();
  }

  const service =
    info.service;

  /* =====================================
     실제 공식 읍면동 확인
  ===================================== */

  if (
    info.neighborhood
  ) {
    const validNeighborhood =
      await validateNeighborhood(
        info.region,
        info.district,
        info.neighborhood
      );

    if (
      !validNeighborhood
    ) {
      notFound();
    }
  }

  /* =====================================
     canonical redirect
  ===================================== */

  const correctPath =
    makePath(
      service.slug,
      info.canonicalLocation
    );

  const requestedPath =
    makePath(
      service.slug,
      info.location
    );

  if (
    requestedPath !==
    correctPath
  ) {
    permanentRedirect(
      correctPath
    );
  }

  /* =====================================
     업체 조회
  ===================================== */

  const result =
    await loadCompanies();

  const companies =
    result.companies;

  const serviceCompanies =
    companies.filter(
      (company) =>
        matchesService(
          company,
          service
        )
    );

  const matchedCompanies =
    serviceCompanies.filter(
      (company) =>
        matchesRegion(
          company,
          info.region,
          info.district,
          info.neighborhood
        )
    );

  /* =====================================
     공식 읍면동 목록

     더 이상 업체 등록정보에서
     동 목록을 만들지 않음
  ===================================== */

  let neighborhoods:
    string[] = [];

  if (
    info.region
  ) {
    if (
      info.region.slug ===
      "sejong" &&
      !info.neighborhood
    ) {
      neighborhoods =
        await getOfficialNeighborhoods(
          info.region
        );
    } else if (
      info.district &&
      !info.neighborhood
    ) {
      neighborhoods =
        await getOfficialNeighborhoods(
          info.region,
          info.district
        );
    }
  }

  const title =
    getTitle(
      service,
      info.region,
      info.district,
      info.neighborhood
    );

  return (
    <main
      style={
        pageStyle
      }
    >
      <div
        style={{
          maxWidth:
            1100,

          margin:
            "0 auto",
        }}
      >
        {/* =================================
            상단
        ================================= */}

        <header
          style={
            panelStyle
          }
        >
          <Link
            href="/"
            style={
              linkStyle
            }
          >
            ← 집수리모아 홈
          </Link>

          <p
            style={{
              marginTop:
                24,

              color:
                "#4568a0",

              fontWeight:
                700,
            }}
          >
            지역별 시공 업체 찾기
          </p>

          <h1
            style={{
              fontSize:
                "clamp(26px, 5vw, 38px)",

              lineHeight:
                1.35,

              marginBottom:
                12,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color:
                "#586579",

              lineHeight:
                1.8,
            }}
          >
            {service.description} 등록 업체의
            시공 분야, 서비스 지역과 시공
            사진을 확인해 보세요.
          </p>
        </header>

        {/* =================================
            카테고리
        ================================= */}

        <section
          style={
            panelStyle
          }
        >
          <h2
            style={{
              marginTop:
                0,
            }}
          >
            시공 종류 선택
          </h2>

          <div
            style={{
              display:
                "flex",

              flexWrap:
                "wrap",

              gap:
                9,
            }}
          >
            {SERVICES.map(
              (item) => (
                <Link
                  key={
                    item.slug
                  }
                  href={makePath(
                    item.slug,
                    info.canonicalLocation
                  )}
                  style={{
                    ...linkStyle,

                    background:
                      item.slug ===
                      service.slug
                        ? "#eaf2ff"
                        : "#ffffff",
                  }}
                >
                  {
                    item.name
                  }
                </Link>
              )
            )}
          </div>
        </section>

        {/* =================================
            지역
        ================================= */}

        <section
          style={
            panelStyle
          }
        >
          <h2
            style={{
              marginTop:
                0,
            }}
          >
            지역 선택
          </h2>

          <div
            style={{
              display:
                "flex",

              flexWrap:
                "wrap",

              gap:
                9,

              marginBottom:
                18,
            }}
          >
            <Link
              href={makePath(
                service.slug
              )}
              style={
                linkStyle
              }
            >
              전국
            </Link>

            {info.region && (
              <Link
                href={makePath(
                  service.slug,
                  [
                    info
                      .region
                      .slug,
                  ]
                )}
                style={
                  linkStyle
                }
              >
                {
                  info
                    .region
                    .name
                }
              </Link>
            )}

            {info.region &&
              info.district && (
                <Link
                  href={makePath(
                    service.slug,
                    [
                      info
                        .region!
                        .slug,

                      info
                        .district!
                        .slug,
                    ]
                  )}
                  style={
                    linkStyle
                  }
                >
                  {
                    info
                      .district
                      .name
                  }
                </Link>
              )}

            {info.neighborhood && (
              <span
                style={{
                  ...linkStyle,

                  background:
                    "#eaf2ff",
                }}
              >
                {
                  info.neighborhood
                }
              </span>
            )}
          </div>

          {/* 전국 → 시도 */}

          {!info.region && (
            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap:
                  9,
              }}
            >
              {REGIONS.map(
                (region) => (
                  <Link
                    key={
                      region.slug
                    }
                    href={makePath(
                      service.slug,
                      [
                        region.slug,
                      ]
                    )}
                    style={
                      linkStyle
                    }
                  >
                    {
                      region.name
                    }
                  </Link>
                )
              )}
            </div>
          )}

          {/* 시도 → 시군구 */}

          {info.region &&
            !info.district &&
            info.region.slug !==
              "sejong" && (
              <div
                style={{
                  display:
                    "flex",

                  flexWrap:
                    "wrap",

                  gap:
                    9,
                }}
              >
                {getDistricts(
                  info.region
                ).map(
                  (
                    district
                  ) => (
                    <Link
                      key={
                        district.slug
                      }
                      href={makePath(
                        service.slug,
                        [
                          info
                            .region!
                            .slug,

                          district.slug,
                        ]
                      )}
                      style={
                        linkStyle
                      }
                    >
                      {
                        district.name
                      }
                    </Link>
                  )
                )}
              </div>
            )}

          {/* =================================
              일반지역 읍면동
          ================================= */}

          {info.region &&
            info.district &&
            !info.neighborhood && (
              <>
                <h3>
                  읍·면·동 선택
                </h3>

                {neighborhoods.length >
                0 ? (
                  <div
                    style={{
                      display:
                        "flex",

                      flexWrap:
                        "wrap",

                      gap:
                        9,
                    }}
                  >
                    {neighborhoods.map(
                      (
                        neighborhood
                      ) => (
                        <Link
                          key={
                            neighborhood
                          }
                          href={makePath(
                            service.slug,
                            [
                              info
                                .region!
                                .slug,

                              info
                                .district!
                                .slug,

                              neighborhood,
                            ]
                          )}
                          style={
                            linkStyle
                          }
                        >
                          {
                            neighborhood
                          }
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <p
                    style={{
                      color:
                        "#586579",
                    }}
                  >
                    읍·면·동 정보를
                    불러오는 중이거나 현재
                    지역 데이터가 없습니다.
                  </p>
                )}
              </>
            )}

          {/* =================================
              세종 읍면동
          ================================= */}

          {info.region?.slug ===
            "sejong" &&
            !info.neighborhood && (
              <>
                <h3>
                  읍·면·동 선택
                </h3>

                {neighborhoods.length >
                0 ? (
                  <div
                    style={{
                      display:
                        "flex",

                      flexWrap:
                        "wrap",

                      gap:
                        9,
                    }}
                  >
                    {neighborhoods.map(
                      (
                        neighborhood
                      ) => (
                        <Link
                          key={
                            neighborhood
                          }
                          href={makePath(
                            service.slug,
                            [
                              "sejong",

                              neighborhood,
                            ]
                          )}
                          style={
                            linkStyle
                          }
                        >
                          {
                            neighborhood
                          }
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <p
                    style={{
                      color:
                        "#586579",
                    }}
                  >
                    읍·면·동 정보를
                    불러오는 중이거나 현재
                    지역 데이터가 없습니다.
                  </p>
                )}
              </>
            )}
        </section>

        {/* =================================
            업체 목록
        ================================= */}

        <section
          style={
            panelStyle
          }
        >
          <h2
            style={{
              marginTop:
                0,
            }}
          >
            {title} 업체 목록
          </h2>

          <p
            style={{
              color:
                "#586579",
            }}
          >
            조건에 맞는 등록 업체{" "}
            {
              matchedCompanies.length
            }
            곳
          </p>

          {!result.success ? (
            <div
              style={{
                padding:
                  24,

                borderRadius:
                  12,

                background:
                  "#fff7ed",

                textAlign:
                  "center",

                color:
                  "#9a3412",
              }}
            >
              업체 정보를 불러오지 못했습니다.
              잠시 후 다시 확인해 주세요.
            </div>
          ) : matchedCompanies.length ===
            0 ? (
            <div
              style={{
                padding:
                  24,

                borderRadius:
                  12,

                background:
                  "#f7f9fc",

                textAlign:
                  "center",

                color:
                  "#586579",
              }}
            >
              현재 조건에 맞는 등록 업체가
              없습니다.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",

                gap:
                  16,
              }}
            >
              {matchedCompanies.map(
                (
                  company
                ) => {
                  const image =
                    (
                      company.images ??
                      []
                    ).find(
                      (
                        value
                      ) =>
                        typeof value ===
                          "string" &&
                        /^https?:\/\//i.test(
                          value
                        )
                    );

                  const website =
                    company.website_url &&
                    /^https?:\/\//i.test(
                      company.website_url
                    )
                      ? company.website_url
                      : null;

                  return (
                    <article
                      key={String(
                        company.id
                      )}
                      style={{
                        border:
                          "1px solid #e5eaf1",

                        borderRadius:
                          16,

                        padding:
                          18,

                        overflow:
                          "hidden",
                      }}
                    >
                      {image && (
                        <div
                          style={{
                            height:
                              190,

                            overflow:
                              "hidden",

                            borderRadius:
                              12,

                            marginBottom:
                              16,

                            background:
                              "#edf1f7",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              image
                            }
                            alt={`${
                              company.name ??
                              "시공 업체"
                            } 대표 사진`}
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              objectFit:
                                "cover",
                            }}
                          />
                        </div>
                      )}

                      <h3
                        style={{
                          margin:
                            "0 0 10px",

                          fontSize:
                            21,
                        }}
                      >
                        {company.name ??
                          "등록 업체"}
                      </h3>

                      <p
                        style={{
                          color:
                            "#586579",

                          lineHeight:
                            1.7,

                          whiteSpace:
                            "pre-line",

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {company.description ||
                          "업체 소개가 등록되지 않았습니다."}
                      </p>

                      <p
                        style={{
                          color:
                            "#586579",

                          fontSize:
                            13,

                          lineHeight:
                            1.7,
                        }}
                      >
                        <strong>
                          시공 분야
                        </strong>
                        <br />

                        {(company.services ??
                          []).join(
                          " · "
                        ) ||
                          "미등록"}
                      </p>

                      <p
                        style={{
                          color:
                            "#586579",

                          fontSize:
                            13,

                          lineHeight:
                            1.7,
                        }}
                      >
                        <strong>
                          서비스 지역
                        </strong>
                        <br />

                        {(company.regions ??
                          []).join(
                          " · "
                        ) ||
                          "미등록"}
                      </p>

                      {website && (
                        <a
                          href={
                            website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            ...linkStyle,

                            display:
                              "block",

                            textAlign:
                              "center",

                            marginTop:
                              16,

                            background:
                              "#2563eb",

                            color:
                              "#ffffff",

                            borderColor:
                              "#2563eb",
                          }}
                        >
                          업체 홈페이지 바로가기 →
                        </a>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign:
              "center",

            paddingTop:
              14,
          }}
        >
          <Link
            href="/"
            style={
              linkStyle
            }
          >
            집수리모아 홈으로
          </Link>
        </footer>
      </div>
    </main>
  );
}
