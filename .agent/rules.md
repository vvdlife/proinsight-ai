# ⚛️ TypeScript & React Engineering Rules (ProInsight AI)

## 1. Core Philosophy: Scalability & Maintainability

프론트엔드 코드는 "작성"보다 "수정"되는 빈도가 훨씬 높습니다.
나중에 코드를 읽을 동료(혹은 미래의 나)가 **"예측 가능한"** 구조를 만드는 것이 핵심입니다.

## 2. Type System (Strict)

- **Zero `Any` Policy**: `any` 사용은 TS 사용 이유를 부정하는 행위입니다. 외부 데이터는 `unknown`으로 받고 Zod 등으로 검증(Narrowing) 후 사용하세요.
- **Props Interface**: 컴포넌트 Props는 반드시 `interface` 또는 `type`으로 명시적 선언하고 `export` 하세요. `React.FC` 사용은 지양합니다.
  - _Good_: `export interface ButtonProps { ... }`
- **Utility Types**: 중복 정의 대신 `Pick`, `Omit`, `Partial`을 적극 활용하여 타입의 **Single Source of Truth**를 지키세요.

## 3. State Management Strategy

- **Server State**: API 데이터는 **무조건** `TanStack Query (React Query)`를 사용합니다. `useEffect` 내부에서 `fetch` + `setState` 패턴은 금지됩니다. (Race Condition 및 캐싱 문제 해결)
- **Client State**: 전역 상태는 `Zustand` (또는 `Recoil/Redux` if verified)를 사용하고, 단순 Prop Drilling 방지용은 `Context API`를 사용하되 범위를 최소화하세요.
- **Immutability**: 상태 변경 시 불변성을 엄수하세요. (Spread Operator `...` 또는 `Immer` 활용)

## 4. Component Architecture

- **Atomic Design**: 컴포넌트 재사용성을 고려해 설계하세요.
- **Headless UI Patterns**: 로직(Hooks/Context)과 UI(JSX)를 분리하는 Headless 패턴을 지향합니다. UI 라이브러리 교체 시 유연성을 확보할 수 있습니다.
- **Render Optimization**: 무분별한 `React.memo` 사용보다, **컴포넌트 구조 분리(Composition)**를 통해 불필요한 리렌더링을 막으세요. 리스트 렌더링 시 `key`에 index 사용은 최후의 수단입니다.

## 5. Styling (TailwindCSS)

- **Class Hygiene**: 클래스 순서는 자동 정렬(Prettier plugin)에 맡기거나 일관된 규칙(Layout -> Box -> Typography -> Visual)을 따르세요.
- **No Magic Values**: 색상(`text-[#123456]`)이나 간격(`m-[13px]`)을 하드코딩하지 말고 `tailwind.config.js`의 Theme Token을 사용하세요.

## 6. Transition Strategy (Ratchet)

- 기존 파일 수정 시, 해당 파일의 `eslint-disable`이나 `// @ts-ignore` 주석을 하나라도 제거하는 것을 목표로 하세요(Boy Scout Rule).

## 7. Documentation & Artifacts Policy (Strict)

- **Language**: 모든 산출물(`walkthrough.md`, `implementation_plan.md`, `audit_report.md` 등)은 **반드시 한국어(Korean)**로 작성해야 합니다.
  - 기술 용어(Technical Terms)는 원어(영어)를 유지하되, 설명과 문맥은 한국어를 사용합니다. (e.g., "Singleton Pattern을 적용하여..." O, "Apply Singleton Pattern..." X)
- **Clarity**: 모든 계획과 보고서는 개발자가 아닌 이해관계자도 읽을 수 있도록 명확한 "배경(Why)"과 "결과(What)"를 포함해야 합니다.
