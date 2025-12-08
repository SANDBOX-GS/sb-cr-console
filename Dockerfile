# Dockerfile

# ===================================================
# 1단계: 빌더 이미지 (Builder Stage)
# ===================================================
FROM node:20-alpine AS builder

# ARG 선언: 외부 (docker-compose)에서 MYSQL_URI 값을 받기 위해 선언
ARG MYSQL_URI

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# ARG로 받은 MYSQL_URI 값을 환경 변수로 설정합니다.
# 이 ENV는 이후 'RUN npm run build' 명령이 실행될 때 사용됩니다.
ENV MYSQL_URI=${MYSQL_URI}

COPY . .

# Next.js 프로젝트 빌드 실행
# 빌드 명령을 실행할 때 환경 변수를 명시적으로 사용하여 .env 파일 의존성을 우회합니다.
RUN npm run build

# ===================================================
# 2단계: 실행 스테이지 (Runner Stage - Prod 모드)
# ===================================================
FROM node:20-alpine
WORKDIR /app

# ENV 설정
ENV PORT 3000

# Next.js가 기본으로 사용하는 유저와 그룹 설정 (보안 강화)
RUN addgroup -g 1001 nodejs
RUN adduser -u 1001 -D nextjs -G nodejs
USER nextjs

# 빌드된 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# 프로덕션 모드로 시작
CMD ["npm", "start"]