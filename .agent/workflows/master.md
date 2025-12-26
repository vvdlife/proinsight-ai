---
description: ProInsight AI React Workflows
---

# ⚛️ Master Workflows (React/TS)

## 1. 초기 설정 (Setup)

프로젝트 구동을 위한 의존성 설치. `pnpm` 사용을 권장하나 상황에 따라 `npm` 사용.

```bash
# 의존성 설치 (CI 환경에서는 clean install 권장)
npm ci || npm install
```

## 2. 검증 (Verification)

코드 품질을 보장하기 위한 수단.

```bash
# 1. Type Check (컴파일 오류 확인)
# 빌드 없이 타입만 빠르게 체크. 오류 0건 필수.
npx tsc --noEmit

# 2. Linting (코드 스타일 & 잠재적 오류)
npm run lint -- --fix

# 3. Test
# Unit Test가 설정되어 있다면 실행
npm run test -- --passWithNoTests
```

## 3. 개발 및 빌드 (Dev & Build)

### Development Server

```bash
# // turbo
npm run dev
```

### Production Build

```bash
# 빌드 후 번들 사이즈 분석이 가능하다면 리포트 확인 권장
npm run build
```

## 4. 유지보수 (Maintenance)

```bash
# 보안 취약점 점검
npm audit

# 사용하지 않는 패키지/파일 정리 (Knip 등 도구 사용 권장)
# npx knip
```

## 5. 문서화 (Documentation)

모든 프로젝트 산출물(`walkthrough`, `plan`, `task` 등)은 **한국어** 작성을 원칙으로 합니다.

- **Implementation Plan**: 작업 전 반드시 한글 계획서 작성 (`task_boundary` 활용)
- **Walkthrough**: 작업 완료 후 한글 완료 보고서 작성
