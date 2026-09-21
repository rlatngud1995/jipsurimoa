
"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

import { regions, services } from "../data";
import Footer from "../Footer";

/* =====================================
   Supabase 설정
===================================== */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?.trim() ?? "";

const STORAGE_BUCKET =
  "company-application-images";

/* =====================================
   사진 업로드 설정
===================================== */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_WORK_IMAGES = 5;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type SelectedImage = {
  file: File;
  previewUrl: string;
};

/* =====================================
   신청서 데이터 타입
===================================== */

type ApplicationData = {
  name: string;
  owner: string;
  phone: string;
  website_url: string | null;
  description: string;
  regions: string[];
  services: string[];
  images: string[];
  status: string;
};

type SupabaseError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/* =====================================
   홈페이지 주소 확인
===================================== */

function normalizeWebsiteUrl(
  value: string
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(
    trimmed
  )
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (
      !["http:", "https:"].includes(
        parsed.protocol
      ) ||
      !parsed.hostname.includes(".") ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/* =====================================
   Supabase 오류 내용 읽기
===================================== */

async function getSupabaseError(
  response: Response
): Promise<string> {
  const responseText = await response.text();

  try {
    const parsedError = JSON.parse(
      responseText
    ) as SupabaseError;

    return [
      parsedError.message,
      parsedError.code
        ? `코드: ${parsedError.code}`
        : "",
      parsedError.details
        ? `상세: ${parsedError.details}`
        : "",
      parsedError.hint
        ? `힌트: ${parsedError.hint}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return (
      responseText ||
      `HTTP 오류 코드: ${response.status}`
    );
  }
}

/* =====================================
   파일 확장자 확인
===================================== */

function getFileExtension(
  file: File
): string {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "";
  }
}

/* =====================================
   이미지 파일 검사
===================================== */

function validateImage(
  file: File
): string | null {
  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type)
  ) {
    return (
      "JPG, PNG, WEBP 형식의 사진만 " +
      "첨부할 수 있습니다."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return (
      "사진 한 장의 크기는 " +
      "5MB 이하여야 합니다."
    );
  }

  if (file.size === 0) {
    return "비어 있는 파일은 첨부할 수 없습니다.";
  }

  return null;
}

/* =====================================
   업체 등록 페이지
===================================== */

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");

  const [websiteUrl, setWebsiteUrl] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [
    selectedRegions,
    setSelectedRegions,
  ] = useState<string[]>([]);

  const [
    selectedServices,
    setSelectedServices,
  ] = useState<string[]>([]);

  /* =====================================
     첨부 사진 상태
  ===================================== */

  const [logoImage, setLogoImage] =
    useState<SelectedImage | null>(null);

  const [workImages, setWorkImages] =
    useState<SelectedImage[]>([]);

  const logoInputRef =
    useRef<HTMLInputElement>(null);

  const workInputRef =
    useRef<HTMLInputElement>(null);

  const previewUrlsRef =
    useRef<string[]>([]);

  /* =====================================
     신청 상태
  ===================================== */

  const [preview, setPreview] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    submitProgress,
    setSubmitProgress,
  ] = useState("");

  const normalizedWebsiteUrl =
    normalizeWebsiteUrl(websiteUrl);

  /* =====================================
     미리보기 주소 정리
  ===================================== */

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );
    };
  }, []);

  function createPreviewUrl(
    file: File
  ): string {
    const url =
      URL.createObjectURL(file);

    previewUrlsRef.current.push(url);

    return url;
  }

  function releasePreviewUrl(
    url: string
  ) {
    URL.revokeObjectURL(url);

    previewUrlsRef.current =
      previewUrlsRef.current.filter(
        (item) => item !== url
      );
  }

  /* =====================================
     공통 함수
  ===================================== */

  function toggle(
    value: string,
    selected: string[],
    setter: (items: string[]) => void
  ) {
    setter(
      selected.includes(value)
        ? selected.filter(
            (item) => item !== value
          )
        : [...selected, value]
    );
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================
     회사 로고 선택
  ===================================== */

  function handleLogoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError =
      validateImage(file);

    if (validationError) {
      setErrorMessage(validationError);

      event.target.value = "";
      return;
    }

    if (logoImage) {
      releasePreviewUrl(
        logoImage.previewUrl
      );
    }

    setLogoImage({
      file,
      previewUrl:
        createPreviewUrl(file),
    });

    setErrorMessage("");

    event.target.value = "";
  }

  function removeLogo() {
    if (logoImage) {
      releasePreviewUrl(
        logoImage.previewUrl
      );
    }

    setLogoImage(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }

  /* =====================================
     시공사진 선택
  ===================================== */

  function handleWorkImagesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) {
      return;
    }

    const remainingSlots =
      MAX_WORK_IMAGES -
      workImages.length;

    if (
      files.length > remainingSlots
    ) {
      setErrorMessage(
        `시공사진은 최대 ${MAX_WORK_IMAGES}장까지 첨부할 수 있습니다. ` +
          `현재 ${remainingSlots}장을 더 첨부할 수 있습니다.`
      );

      event.target.value = "";
      return;
    }

    for (const file of files) {
      const validationError =
        validateImage(file);

      if (validationError) {
        setErrorMessage(
          `${file.name}: ${validationError}`
        );

        event.target.value = "";
        return;
      }
    }

    const newImages =
      files.map((file) => ({
        file,
        previewUrl:
          createPreviewUrl(file),
      }));

    setWorkImages((current) => [
      ...current,
      ...newImages,
    ]);

    setErrorMessage("");

    event.target.value = "";
  }

  function removeWorkImage(
    previewUrl: string
  ) {
    releasePreviewUrl(previewUrl);

    setWorkImages((current) =>
      current.filter(
        (item) =>
          item.previewUrl !==
          previewUrl
      )
    );
  }

  /* =====================================
     신청 내용 확인
  ===================================== */

  function handlePreview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !name.trim() ||
      !owner.trim() ||
      !phone.trim() ||
      !description.trim()
    ) {
      setErrorMessage(
        "필수 정보를 모두 입력해 주세요."
      );
      return;
    }

    if (
      selectedRegions.length === 0 ||
      selectedServices.length === 0
    ) {
      setErrorMessage(
        "서비스 지역과 시공 분야를 선택해 주세요."
      );
      return;
    }

    if (
      websiteUrl.trim() &&
      !normalizedWebsiteUrl
    ) {
      setErrorMessage(
        "홈페이지 주소를 확인해 주세요. 예: https://example.com"
      );
      return;
    }

    setErrorMessage("");
    setPreview(true);
    scrollToTop();
  }

  /* =====================================
     Supabase Storage 사진 업로드
  ===================================== */

  async function uploadImage(
    file: File,
    applicationFolder: string,
    order: number
  ): Promise<string> {
    const extension =
      getFileExtension(file);

    if (!extension) {
      throw new Error(
        "지원하지 않는 사진 형식입니다."
      );
    }

    const fileName =
      `${order}-${crypto.randomUUID()}.${extension}`;

    const storagePath =
      `applications/${applicationFolder}/${fileName}`;

    const uploadUrl =
      `${SUPABASE_URL}/storage/v1/object/` +
      `${STORAGE_BUCKET}/${storagePath}`;

    const response = await fetch(
      uploadUrl,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization:
            `Bearer ${SUPABASE_KEY}`,
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: file,
      }
    );

    if (!response.ok) {
      const details =
        await getSupabaseError(
          response
        );

      throw new Error(
        "사진 업로드에 실패했습니다.\n" +
          details
      );
    }

    return (
      `${SUPABASE_URL}/storage/v1/object/public/` +
      `${STORAGE_BUCKET}/${storagePath}`
    );
  }

  /* =====================================
     Supabase에 신청서 저장
  ===================================== */

  async function handleFinalSubmit() {
    if (
      submitting ||
      submitted
    ) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSubmitProgress("");

    try {
      if (
        !SUPABASE_URL ||
        !SUPABASE_KEY
      ) {
        throw new Error(
          "Supabase 연결 정보가 없습니다. " +
            "Vercel의 환경변수를 확인해 주세요."
        );
      }

      const applicationFolder =
        crypto.randomUUID();

      const uploadedImages:
        string[] = [];

      /* =====================================
         1. 로고 먼저 업로드

         images 배열 첫 번째 사진을
         메인 업체 대표 이미지로 사용
      ===================================== */

      if (logoImage) {
        setSubmitProgress(
          "회사 로고 업로드 중..."
        );

        const logoUrl =
          await uploadImage(
            logoImage.file,
            applicationFolder,
            0
          );

        uploadedImages.push(
          logoUrl
        );
      }

      /* =====================================
         2. 시공사진 업로드
      ===================================== */

      for (
        let index = 0;
        index < workImages.length;
        index++
      ) {
        setSubmitProgress(
          `시공사진 업로드 중... ` +
            `${index + 1}/${workImages.length}`
        );

        const imageUrl =
          await uploadImage(
            workImages[index].file,
            applicationFolder,
            index + 1
          );

        uploadedImages.push(
          imageUrl
        );
      }

      /* =====================================
         3. 신청서 저장
      ===================================== */

      setSubmitProgress(
        "업체 등록 신청서 저장 중..."
      );

      const application:
        ApplicationData = {
        name: name.trim(),
        owner: owner.trim(),
        phone: phone.trim(),

        website_url:
          normalizedWebsiteUrl,

        description:
          description.trim(),

        regions:
          selectedRegions,

        services:
          selectedServices,

        images:
          uploadedImages,

        status:
          "pending",
      };

      const apiUrl =
        `${SUPABASE_URL}` +
        "/rest/v1/company_applications";

      const response = await fetch(
        apiUrl,
        {
          method: "POST",
          headers: {
            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${SUPABASE_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal",
          },

          body:
            JSON.stringify(
              application
            ),
        }
      );

      if (!response.ok) {
        const details =
          await getSupabaseError(
            response
          );

        throw new Error(
          "신청서 저장에 실패했습니다.\n" +
            `HTTP 오류 코드: ${response.status}\n` +
            details
        );
      }

      setSubmitted(true);
      setPreview(false);
      setSubmitProgress("");
      scrollToTop();
    } catch (error) {
      console.error(
        "업체 등록 신청 오류:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다. 다시 시도해 주세요."
      );

      setSubmitProgress("");
      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================
     사진 미리보기 공통 화면
  ===================================== */

  function renderImagePreview(
    image: SelectedImage,
    label: string,
    onRemove?: () => void
  ) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "220px",
          border:
            "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "10px",
          background: "#ffffff",
        }}
      >
        <img
          src={image.previewUrl}
          alt={label}
          style={{
            width: "100%",
            height: "140px",
            objectFit: "contain",
            borderRadius: "8px",
            background: "#f8fafc",
          }}
        />

        <p
          style={{
            fontSize: "12px",
            marginTop: "8px",
            overflowWrap: "anywhere",
          }}
        >
          {label}
        </p>

        {onRemove && (
          <button
            type="button"
            className="outlineButton"
            onClick={onRemove}
            style={{
              marginTop: "8px",
            }}
          >
            사진 삭제
          </button>
        )}
      </div>
    );
  }

  /* =====================================
     화면
  ===================================== */

  return (
    <main>
      {/* 상단 메뉴 */}

      <header className="header">
        <Link
          href="/"
          className="logo"
        >
          🏠 집수리모아
        </Link>

        <Link href="/companies">
          업체 찾기
        </Link>
      </header>

      {/* 상단 소개 */}

      <section className="pageHero">
        <div className="container">
          <h1>
            집수리 업체 등록
          </h1>

          <p>
            집수리모아에 업체를 소개하고
            고객에게 시공 서비스를 알려보세요.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="registerCard">
          {submitted ? (
            /* =====================================
               신청 완료
            ===================================== */

            <div className="formGroup">
              <h2>
                등록 신청이 접수되었습니다! 🎉
              </h2>

              <p>
                업체 등록 신청이 정상적으로
                저장되었습니다. 관리자 확인 후
                등록 여부를 안내해 드리겠습니다.
              </p>

              <p>
                <strong>
                  업체명:
                </strong>{" "}
                {name}
              </p>

              <p>
                <strong>
                  연락처:
                </strong>{" "}
                {phone}
              </p>

              {normalizedWebsiteUrl && (
                <p>
                  <strong>
                    홈페이지:
                  </strong>{" "}

                  <a
                    href={
                      normalizedWebsiteUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    {
                      normalizedWebsiteUrl
                    }
                  </a>
                </p>
              )}

              <p>
                <strong>
                  첨부 사진:
                </strong>{" "}
                {(logoImage ? 1 : 0) +
                  workImages.length}
                장
              </p>

              <p className="formHint">
                신청서를 제출했다고 해서
                업체 목록에 즉시 공개되는 것은
                아닙니다. 관리자 승인 후
                공개됩니다.
              </p>

              <Link
                href="/"
                className="primaryButton"
              >
                홈페이지로 돌아가기
              </Link>
            </div>
          ) : preview ? (
            /* =====================================
               신청 내용 미리보기
            ===================================== */

            <div className="formGroup">
              <h2>
                등록 신청 내용 확인
              </h2>

              <p>
                아래 내용을 확인한 후
                등록 신청을 제출해 주세요.
              </p>

              <p>
                <strong>
                  업체명:
                </strong>{" "}
                {name}
              </p>

              <p>
                <strong>
                  대표자:
                </strong>{" "}
                {owner}
              </p>

              <p>
                <strong>
                  연락처:
                </strong>{" "}
                {phone}
              </p>

              <p>
                <strong>
                  홈페이지:
                </strong>{" "}

                {normalizedWebsiteUrl ? (
                  <a
                    href={
                      normalizedWebsiteUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    {
                      normalizedWebsiteUrl
                    }
                  </a>
                ) : (
                  "등록하지 않음"
                )}
              </p>

              <p>
                <strong>
                  지역:
                </strong>{" "}
                {selectedRegions.join(
                  ", "
                )}
              </p>

              <p>
                <strong>
                  시공 분야:
                </strong>{" "}
                {selectedServices.join(
                  ", "
                )}
              </p>

              <p>
                <strong>
                  소개:
                </strong>{" "}
                {description}
              </p>

              {/* 로고 미리보기 */}

              {logoImage && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <h3>
                    회사 로고
                  </h3>

                  {renderImagePreview(
                    logoImage,
                    "회사 로고"
                  )}
                </div>
              )}

              {/* 시공사진 미리보기 */}

              {workImages.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <h3>
                    시공사진
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
                      gap: "12px",
                    }}
                  >
                    {workImages.map(
                      (image, index) => (
                        <div
                          key={
                            image.previewUrl
                          }
                        >
                          {renderImagePreview(
                            image,
                            `시공사진 ${
                              index + 1
                            }`
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* 오류 표시 */}

              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    color: "#991b1b",
                    background:
                      "#fef2f2",
                    border:
                      "1px solid #fecaca",
                    padding: "14px",
                    borderRadius:
                      "10px",
                    marginBottom:
                      "16px",
                    whiteSpace:
                      "pre-wrap",
                    overflowWrap:
                      "anywhere",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>
                    등록 신청 오류
                  </strong>

                  <br />

                  {errorMessage}
                </div>
              )}

              {submitProgress && (
                <p
                  role="status"
                  style={{
                    color: "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  {submitProgress}
                </p>
              )}

              <button
                type="button"
                className="primaryButton fullButton"
                onClick={
                  handleFinalSubmit
                }
                disabled={
                  submitting
                }
              >
                {submitting
                  ? "사진 및 신청서 제출 중..."
                  : "등록 신청 제출하기"}
              </button>

              <button
                type="button"
                className="outlineButton"
                onClick={() => {
                  setErrorMessage("");
                  setPreview(false);
                }}
                disabled={
                  submitting
                }
                style={{
                  marginTop: "12px",
                }}
              >
                입력 내용 수정하기
              </button>
            </div>
          ) : (
            /* =====================================
               업체 등록 신청서
            ===================================== */

            <form
              onSubmit={
                handlePreview
              }
            >
              <h2>
                업체 기본정보
              </h2>

              {/* 업체명 */}

              <div className="formGroup">
                <label
                  htmlFor="companyName"
                >
                  업체명 *
                </label>

                <input
                  id="companyName"
                  required
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="업체명을 입력하세요"
                />
              </div>

              {/* 대표자명 */}

              <div className="formGroup">
                <label
                  htmlFor="ownerName"
                >
                  대표자명 *
                </label>

                <input
                  id="ownerName"
                  required
                  value={owner}
                  onChange={(event) =>
                    setOwner(
                      event.target.value
                    )
                  }
                  placeholder="대표자명"
                />
              </div>

              {/* 연락처 */}

              <div className="formGroup">
                <label
                  htmlFor="companyPhone"
                >
                  연락처 *
                </label>

                <input
                  id="companyPhone"
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="010-0000-0000"
                />
              </div>

              {/* 홈페이지 주소 */}

              <div className="formGroup">
                <label
                  htmlFor="companyWebsite"
                >
                  업체 홈페이지 주소 (선택)
                </label>

                <input
                  id="companyWebsite"
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={
                    websiteUrl
                  }
                  onChange={(event) =>
                    setWebsiteUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://example.com"
                />

                <p className="formHint">
                  홈페이지가 있다면 주소를
                  입력해 주세요. 홈페이지가
                  없다면 비워두셔도 됩니다.
                </p>
              </div>

              {/* 서비스 지역 */}

              <div className="formGroup">
                <label>
                  서비스 지역 *
                </label>

                <div className="checkGrid">
                  {regions.map(
                    (region) => (
                      <label
                        key={region}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedRegions.includes(
                              region
                            )
                          }
                          onChange={() =>
                            toggle(
                              region,
                              selectedRegions,
                              setSelectedRegions
                            )
                          }
                        />

                        {region}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* 시공 분야 */}

              <div className="formGroup">
                <label>
                  전문 시공 분야 *
                </label>

                <div className="checkGrid">
                  {services.map(
                    (service) => (
                      <label
                        key={service}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedServices.includes(
                              service
                            )
                          }
                          onChange={() =>
                            toggle(
                              service,
                              selectedServices,
                              setSelectedServices
                            )
                          }
                        />

                        {service}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* 업체 소개 */}

              <div className="formGroup">
                <label
                  htmlFor="description"
                >
                  업체 소개 *
                </label>

                <textarea
                  id="description"
                  required
                  rows={5}
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="업체의 전문 분야와 시공 서비스를 소개해 주세요."
                />
              </div>

              {/* =====================================
                 회사 로고 첨부
              ===================================== */}

              <div className="formGroup">
                <label
                  htmlFor="companyLogo"
                >
                  회사 로고 또는 대표사진
                  (선택 · 1장)
                </label>

                <input
                  ref={
                    logoInputRef
                  }
                  id="companyLogo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleLogoChange
                  }
                />

                <p className="formHint">
                  JPG, PNG, WEBP /
                  최대 5MB.
                  승인 후 업체 목록의
                  대표 이미지로 사용됩니다.
                </p>

                {logoImage && (
                  <div
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    {renderImagePreview(
                      logoImage,
                      "회사 로고 또는 대표사진",
                      removeLogo
                    )}
                  </div>
                )}
              </div>

              {/* =====================================
                 시공사진 첨부
              ===================================== */}

              <div className="formGroup">
                <label
                  htmlFor="workImages"
                >
                  시공사례 사진
                  (선택 · 최대 5장)
                </label>

                <input
                  ref={
                    workInputRef
                  }
                  id="workImages"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={
                    handleWorkImagesChange
                  }
                  disabled={
                    workImages.length >=
                    MAX_WORK_IMAGES
                  }
                />

                <p className="formHint">
                  JPG, PNG, WEBP /
                  사진당 최대 5MB.
                  현재 {workImages.length}/
                  {MAX_WORK_IMAGES}장 선택.
                  승인 후 업체 소개 페이지에
                  표시할 수 있습니다.
                </p>

                {workImages.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    {workImages.map(
                      (image, index) => (
                        <div
                          key={
                            image.previewUrl
                          }
                        >
                          {renderImagePreview(
                            image,
                            `시공사진 ${
                              index + 1
                            }`,
                            () =>
                              removeWorkImage(
                                image.previewUrl
                              )
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* 오류 표시 */}

              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    color: "#991b1b",
                    background:
                      "#fef2f2",
                    padding: "12px",
                    borderRadius: "8px",
                    whiteSpace:
                      "pre-wrap",
                    overflowWrap:
                      "anywhere",
                    marginBottom:
                      "16px",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="primaryButton fullButton"
              >
                등록 신청 내용 확인하기
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
