/* =========================================
   집수리모아 전국 법정동 데이터

   파일:
   app/data/legal-dongs.ts

   데이터 출처:
   행정표준코드관리시스템
   https://www.code.go.kr

   기능:
   - 공식 법정동 전체자료 ZIP 자동 다운로드
   - EUC-KR TXT 자동 해석
   - 폐지 지역 제외
   - 읍 / 면 / 동만 추출
   - 전국 법정동 자동 반환

   예:
   서울특별시 종로구 청운동

   경기도 수원시 장안구 파장동
   → district = 수원시
   → neighborhood = 파장동

   충청남도 천안시 서북구 불당동
   → district = 천안시
   → neighborhood = 불당동
========================================= */

export type LegalDong = {
  code: string;

  /*
    예:
    서울특별시
    경기도
    충청남도
  */
  region: string;

  /*
    예:
    종로구
    수원시
    천안시

    수원시 장안구처럼
    일반구가 있는 경우에도
    집수리모아 기존 URL 구조에 맞춰
    수원시까지만 district로 사용
  */
  district: string;

  /*
    예:
    청운동
    불당동
    조치원읍
  */
  neighborhood: string;

  /*
    공식 전체 주소

    예:
    경기도 수원시 팔달구 인계동
  */
  fullName: string;
};

/* =========================================
   공식 법정동 전체자료 다운로드 주소
========================================= */

const LEGAL_DONG_DOWNLOAD_URL =
  "https://www.code.go.kr/etc/codeFullDown.do";

/* =========================================
   메모리 캐시

   같은 서버 인스턴스에서는
   공식 데이터를 계속 다시 받지 않도록 함
========================================= */

let memoryCache:
  | {
      createdAt: number;
      data: LegalDong[];
    }
  | null = null;

/*
  24시간
*/

const MEMORY_CACHE_TIME =
  1000 * 60 * 60 * 24;

/* =========================================
   ArrayBuffer → Uint8Array
========================================= */

function toBytes(
  buffer: ArrayBuffer
): Uint8Array {
  return new Uint8Array(
    buffer
  );
}

/* =========================================
   ZIP 숫자 읽기
========================================= */

function readUInt16LE(
  bytes: Uint8Array,
  offset: number
): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8)
  );
}

function readUInt32LE(
  bytes: Uint8Array,
  offset: number
): number {
  return (
    (
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)
    ) >>>
    0
  );
}

/* =========================================
   ZIP EOCD 찾기

   ZIP 파일의 맨 뒤쪽에서
   Central Directory 위치를 찾는다.
========================================= */

function findEndOfCentralDirectory(
  bytes: Uint8Array
): number {
  /*
    EOCD signature:

    50 4B 05 06
  */

  const minimumLength = 22;

  if (
    bytes.length <
    minimumLength
  ) {
    return -1;
  }

  /*
    ZIP comment 최대 길이 고려
  */

  const start =
    Math.max(
      0,
      bytes.length -
        65557
    );

  for (
    let i =
      bytes.length - 22;
    i >= start;
    i--
  ) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      return i;
    }
  }

  return -1;
}

/* =========================================
   ZIP 안의 TXT 파일 찾기
========================================= */

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

function findTxtEntry(
  bytes: Uint8Array
): ZipEntry {
  const eocdOffset =
    findEndOfCentralDirectory(
      bytes
    );

  if (
    eocdOffset === -1
  ) {
    throw new Error(
      "법정동 ZIP 파일 구조를 확인할 수 없습니다."
    );
  }

  /*
    EOCD + 10:
    전체 Central Directory entry 수
  */

  const totalEntries =
    readUInt16LE(
      bytes,
      eocdOffset + 10
    );

  /*
    EOCD + 16:
    Central Directory 시작 위치
  */

  let offset =
    readUInt32LE(
      bytes,
      eocdOffset + 16
    );

  const utf8Decoder =
    new TextDecoder(
      "utf-8"
    );

  for (
    let i = 0;
    i < totalEntries;
    i++
  ) {
    /*
      Central Directory signature

      50 4B 01 02
    */

    if (
      bytes[offset] !== 0x50 ||
      bytes[offset + 1] !== 0x4b ||
      bytes[offset + 2] !== 0x01 ||
      bytes[offset + 3] !== 0x02
    ) {
      break;
    }

    const compressionMethod =
      readUInt16LE(
        bytes,
        offset + 10
      );

    const compressedSize =
      readUInt32LE(
        bytes,
        offset + 20
      );

    const uncompressedSize =
      readUInt32LE(
        bytes,
        offset + 24
      );

    const fileNameLength =
      readUInt16LE(
        bytes,
        offset + 28
      );

    const extraLength =
      readUInt16LE(
        bytes,
        offset + 30
      );

    const commentLength =
      readUInt16LE(
        bytes,
        offset + 32
      );

    const localHeaderOffset =
      readUInt32LE(
        bytes,
        offset + 42
      );

    const fileNameBytes =
      bytes.slice(
        offset + 46,
        offset +
          46 +
          fileNameLength
      );

    /*
      한글 파일명은 깨질 수 있지만
      .txt 확장자는 정상적으로 읽힘
    */

    const fileName =
      utf8Decoder.decode(
        fileNameBytes
      );

    if (
      fileName
        .toLowerCase()
        .endsWith(
          ".txt"
        )
    ) {
      return {
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
      };
    }

    offset +=
      46 +
      fileNameLength +
      extraLength +
      commentLength;
  }

  throw new Error(
    "법정동 전체자료 ZIP에서 TXT 파일을 찾지 못했습니다."
  );
}

/* =========================================
   ZIP Entry 압축 해제
========================================= */

async function extractZipEntry(
  zipBytes: Uint8Array,
  entry: ZipEntry
): Promise<Uint8Array> {
  const offset =
    entry.localHeaderOffset;

  /*
    Local file header signature

    50 4B 03 04
  */

  if (
    zipBytes[offset] !== 0x50 ||
    zipBytes[offset + 1] !== 0x4b ||
    zipBytes[offset + 2] !== 0x03 ||
    zipBytes[offset + 3] !== 0x04
  ) {
    throw new Error(
      "법정동 ZIP 내부 파일 헤더가 올바르지 않습니다."
    );
  }

  const fileNameLength =
    readUInt16LE(
      zipBytes,
      offset + 26
    );

  const extraLength =
    readUInt16LE(
      zipBytes,
      offset + 28
    );

  const dataStart =
    offset +
    30 +
    fileNameLength +
    extraLength;

  const compressedData =
    zipBytes.slice(
      dataStart,
      dataStart +
        entry.compressedSize
    );

  /*
    compressionMethod 0
    = 압축 없음
  */

  if (
    entry.compressionMethod ===
    0
  ) {
    return compressedData;
  }

  /*
    compressionMethod 8
    = Deflate
  */

  if (
    entry.compressionMethod !==
    8
  ) {
    throw new Error(
      `지원하지 않는 ZIP 압축 방식입니다: ${entry.compressionMethod}`
    );
  }

  /*
    Node / Vercel Web API의
    DecompressionStream 사용
  */

  const stream =
    new Blob([
      compressedData,
    ])
      .stream()
      .pipeThrough(
        new DecompressionStream(
          "deflate-raw"
        )
      );

  const buffer =
    await new Response(
      stream
    ).arrayBuffer();

  const result =
    new Uint8Array(
      buffer
    );

  /*
    파일 크기 간단 검증
  */

  if (
    entry.uncompressedSize >
      0 &&
    result.length === 0
  ) {
    throw new Error(
      "법정동 TXT 압축 해제에 실패했습니다."
    );
  }

  return result;
}

/* =========================================
   공식 ZIP 다운로드
========================================= */

async function downloadOfficialZip(): Promise<Uint8Array> {
  /*
    공식 전체자료 다운로드는
    POST 방식 사용

    codeseId = 법정동코드
  */

  const body =
    new URLSearchParams();

  body.set(
    "codeseId",
    "법정동코드"
  );

  const response =
    await fetch(
      LEGAL_DONG_DOWNLOAD_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",

          "User-Agent":
            "jipsurimoa/1.0",
        },

        body:
          body.toString(),

        /*
          Next.js 서버 캐시

          하루마다 최신 자료 확인
        */

        next: {
          revalidate:
            86400,
        },
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `법정동 전체자료 다운로드 실패: ${response.status}`
    );
  }

  const buffer =
    await response.arrayBuffer();

  const bytes =
    toBytes(
      buffer
    );

  /*
    ZIP signature 검사

    PK
  */

  if (
    bytes.length < 4 ||
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b
  ) {
    throw new Error(
      "행정표준코드 서버에서 ZIP 파일이 아닌 응답을 받았습니다."
    );
  }

  return bytes;
}

/* =========================================
   EUC-KR TXT 읽기
========================================= */

function decodeLegalDongText(
  bytes: Uint8Array
): string {
  try {
    /*
      공식 TXT 파일은
      EUC-KR 계열 인코딩
    */

    return new TextDecoder(
      "euc-kr"
    ).decode(
      bytes
    );
  } catch {
    /*
      혹시 환경에서 EUC-KR Decoder가
      실패할 경우 UTF-8 fallback
    */

    return new TextDecoder(
      "utf-8"
    ).decode(
      bytes
    );
  }
}

/* =========================================
   법정동 주소 → 집수리모아 데이터 변환
========================================= */

function parseLegalDongLine(
  line: string
): LegalDong | null {
  const trimmed =
    line.trim();

  if (
    !trimmed
  ) {
    return null;
  }

  const columns =
    trimmed
      .split("\t")
      .map(
        (value) =>
          value.trim()
      );

  if (
    columns.length <
    2
  ) {
    return null;
  }

  const code =
    columns[0];

  const fullName =
    columns[1];

  const status =
    columns[2] ?? "";

  /*
    헤더 제거
  */

  if (
    code ===
      "법정동코드" ||
    fullName ===
      "법정동명"
  ) {
    return null;
  }

  /*
    코드 10자리만 인정
  */

  if (
    !/^\d{10}$/.test(
      code
    )
  ) {
    return null;
  }

  /*
    폐지 지역 제외

    전체자료의 일반적인 값:
    존재 / 폐지
  */

  if (
    status &&
    status !== "존재"
  ) {
    return null;
  }

  const parts =
    fullName
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length <
    2
  ) {
    /*
      서울특별시처럼
      시·도 자체 행은 제외
    */

    return null;
  }

  const region =
    parts[0];

  const neighborhood =
    parts[
      parts.length - 1
    ];

  /*
    리 단위 제외

    읍 / 면 / 동만 사용
  */

  if (
    !/(읍|면|동)$/.test(
      neighborhood
    )
  ) {
    return null;
  }

  /*
    세종특별자치시는
    시군구 단계가 없는 경우가 있음
  */

  let district = "";

  if (
    region ===
    "세종특별자치시"
  ) {
    district = "";
  } else {
    /*
      서울특별시 종로구 청운동
      → 종로구

      경기도 수원시 팔달구 인계동
      → 수원시

      충청남도 천안시 서북구 불당동
      → 천안시

      전라남도 해남군 해남읍
      → 해남군
    */

    district =
      parts[1] ?? "";
  }

  return {
    code,
    region,
    district,
    neighborhood,
    fullName,
  };
}

/* =========================================
   TXT → LegalDong[]
========================================= */

function parseLegalDongText(
  text: string
): LegalDong[] {
  const result =
    new Map<
      string,
      LegalDong
    >();

  const lines =
    text.split(
      /\r?\n/
    );

  for (
    const line of
    lines
  ) {
    const item =
      parseLegalDongLine(
        line
      );

    if (
      !item
    ) {
      continue;
    }

    /*
      같은 지역 중복 제거

      key에는 전체주소 사용
    */

    result.set(
      item.fullName,
      item
    );
  }

  return [
    ...result.values(),
  ].sort(
    (a, b) =>
      a.fullName.localeCompare(
        b.fullName,
        "ko"
      )
  );
}

/* =========================================
   전국 법정동 불러오기

   다른 파일에서는 이것만 사용하면 됨.

   const legalDongs =
     await loadLegalDongs();
========================================= */

export async function loadLegalDongs(): Promise<
  LegalDong[]
> {
  /*
    메모리 캐시 확인
  */

  if (
    memoryCache &&
    Date.now() -
      memoryCache.createdAt <
      MEMORY_CACHE_TIME
  ) {
    return memoryCache.data;
  }

  /*
    1.
    공식 전체자료 ZIP 다운로드
  */

  const zipBytes =
    await downloadOfficialZip();

  /*
    2.
    ZIP 안 TXT 찾기
  */

  const txtEntry =
    findTxtEntry(
      zipBytes
    );

  /*
    3.
    TXT 압축 해제
  */

  const txtBytes =
    await extractZipEntry(
      zipBytes,
      txtEntry
    );

  /*
    4.
    EUC-KR → 문자열
  */

  const text =
    decodeLegalDongText(
      txtBytes
    );

  /*
    5.
    현존하는 읍면동만 추출
  */

  const data =
    parseLegalDongText(
      text
    );

  if (
    data.length ===
    0
  ) {
    throw new Error(
      "법정동 데이터를 불러왔지만 읍·면·동을 찾지 못했습니다."
    );
  }

  /*
    메모리 캐시 저장
  */

  memoryCache = {
    createdAt:
      Date.now(),

    data,
  };

  return data;
}

/* =========================================
   특정 시·군·구의 읍면동 조회

   예:

   await getLegalNeighborhoods(
     "충청남도",
     "천안시"
   );

   →
   불당동
   성정동
   쌍용동
   ...
========================================= */

export async function getLegalNeighborhoods(
  region: string,
  district: string
): Promise<string[]> {
  const data =
    await loadLegalDongs();

  const neighborhoods =
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

    neighborhoods.add(
      item.neighborhood
    );
  }

  return [
    ...neighborhoods,
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ko"
      )
  );
}

/* =========================================
   특정 시·도의 읍면동 조회

   세종 같은 지역에서 사용 가능
========================================= */

export async function getRegionNeighborhoods(
  region: string
): Promise<string[]> {
  const data =
    await loadLegalDongs();

  const neighborhoods =
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

    neighborhoods.add(
      item.neighborhood
    );
  }

  return [
    ...neighborhoods,
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ko"
      )
  );
}
