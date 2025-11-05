# Citrea Market Demo

React + Vite로 구성된 Citrea 쇼핑몰 데모입니다. 메인 화면은 간단한 커머스 랜딩 페이지로 구성되어 있으며, 오른쪽 상단 `Connect Wallet` 버튼을 통해 아래 절차를 실행합니다.

1. WalletConnect / MetaMask 안내를 제공하거나,
2. NestJS 백엔드가 노출하는 `/auth` 패스를 통해 패스키(또는 비밀번호) 기반 로그인/회원가입을 진행합니다.
3. 패스키 등록 또는 로그인에 성공하면 세션 쿠키(`sid`)가 설정되고 메인 화면으로 돌아옵니다.

## 폴더 구조

```
.
├── src/                # React 애플리케이션
│   ├── components/     # Auth 모달, Wallet 모달, QR 컴포넌트
│   ├── features/       # 기존 Citrea 기능 샘플
│   └── lib/            # API 클라이언트, AA 유틸리티
├── public/
└── README.md
```

## 사전 준비

- Node.js 20 이상
- WebAuthn 테스트를 위한 HTTPS 환경 권장 (로컬에서는 `localhost`에서 동작)

## 환경 변수

### 프런트엔드 (`.env`)

`.env.example`을 복사해 프런트엔드 루트에 `.env`를 생성하고 값을 채워주세요.

```bash
cp .env.example .env
```

필수 항목:

- `VITE_CITREA_RPC`, `VITE_PIMLICO_URL`, `VITE_USDC`, `VITE_ENTRYPOINT_VERSION`: 기존 Citrea 데모용 설정
- `VITE_API_URL`: 백엔드 API 주소 (기본 `http://localhost:4000`)

### 백엔드 (`aa-server/.env`)

```bash
cd ../aa-server
cp .env.example .env # 백엔드 저장소에 제공된 템플릿이 있다고 가정
```

- `APP_ORIGIN`에 프런트엔드 주소를 설정합니다. 여러 개일 경우 쉼표로 구분합니다.
- `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `WEBAUTHN_ORIGIN`을 프런트엔드와 일치하도록 설정합니다.
- 세션 쿠키는 서버가 관리하므로 `SESSION_SECRET`은 백엔드에서만 보관합니다.

## 설치 및 실행

### 프런트엔드

```bash
npm install
npm run dev
```

### 백엔드 (NestJS 등 외부 서버)

- NestJS 인증 서버가 `/auth` 엔드포인트를 제공해야 합니다. (예시: `http://localhost:4000`).
- 프런트엔드에서는 `VITE_API_URL`을 해당 서버 주소로 설정하고, 모든 요청은 `credentials: 'include'` 헤더로 세션 쿠키(`sid`)를 공유합니다.

## 인증 플로우 요약

1. **회원가입**: 사용자가 이메일(및 표시 이름)을 입력하면 `/auth/signup`으로 사용자 스켈레톤을 생성합니다.
2. `/auth/webauthn/register/options`에서 passkey 등록 옵션을 받고 `@simplewebauthn/browser`의 `startRegistration`으로 credential을 생성합니다.
3. 생성된 credential JSON을 `/auth/webauthn/register/verify`에 전송하면 세션 쿠키(`sid`)가 발급됩니다.
4. **로그인**: `/auth/webauthn/login/options` → `startAuthentication` → `/auth/webauthn/login/verify` 순으로 패스키 로그인이 진행됩니다.
5. 로그인 이후 `/auth/me` 응답을 통해 현재 세션의 사용자 정보를 동기화합니다.

## 보안 및 향후 보완 사항

- **데이터 보존**: 현재 백엔드는 메모리에 데이터를 저장합니다. 실제 서비스에서는 데이터베이스와 세션 저장소(예: Redis)를 사용해 영속화해야 합니다.
- **이메일 발송**: 패스키 흐름은 이메일 코드를 사용하지 않으므로 NestJS 서버에서 제공하는 별도의 이메일 인증 정책을 활용하세요.
- **패스키 검증**: 데모에서는 HTTPS 없이 `localhost`에서만 사용하도록 설정했습니다. 운영 환경에선 반드시 TLS를 적용하고 `RP_ID`, `APP_ORIGIN`을 도메인에 맞게 조정해야 합니다.
- **레이트 리미트**: 인증 코드 요청/검증 엔드포인트에는 추가적인 속도 제한과 CAPTCHA 등을 적용하는 것이 좋습니다.
- **인증 토큰**: 현재는 패스키 등록 이후 별도의 세션/토큰을 발급하지 않았습니다. 프로덕션에서는 JWT, 세션 쿠키 등을 발급하여 이후 API 보호에 활용해야 합니다.

## 테스트

- `npm run lint` : ESLint 검사
- 백엔드: `npm run typecheck` 로 TypeScript 검사

## 참고

- [@simplewebauthn/server](https://github.com/MasterKale/SimpleWebAuthn) for WebAuthn helpers
- [Nodemailer](https://nodemailer.com/about/) for transactional email

필요한 추가 기능이 있다면 이 README에 절차를 보강해주세요.
