# Dockerfile

# ===================================================
# 1단계: 빌더 이미지 (Builder Stage)
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# .env 파일의 환경변수들을 Dockerfile 내 ENV로 설정
ENV MYSQL_URI="mysql://dummy:dummy@localhost:3306/dummy"
ENV S3_ACCESS_KEY="dummy"
ENV S3_SECRET_KEY="dummy"
ENV S3_REGION="ap-northeast-2"
ENV S3_ENDPOINT="https://dummy"
ENV S3_BUCKET_NAME="dummy"
ENV SLACK_TOKEN="dummy"
ENV MONDAY_API_TOKEN="dummy"
ENV NHN_EMAIL_APP_KEY="dummy"
ENV NHN_EMAIL_SECRET_KEY="dummy"
ENV NHN_KAKAO_APP_KEY="dummy"
ENV NHN_KAKAO_SECRET_KEY="dummy"

# NODE_ENV는 프로덕션 빌드용 고정
ENV NODE_ENV=production

COPY . .

# Next.js 프로젝트 빌드 실행
RUN npm run build

# ===================================================
# 2단계: 실행 스테이지 (Runner Stage - Prod 모드)
# ===================================================
FROM node:20-alpine
WORKDIR /app

# ENV 설정
ENV PORT 3000

# 보안용 유저 설정
RUN addgroup -g 1001 nodejs
RUN adduser -u 1001 -D nextjs -G nodejs

# 빌드된 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# 프로덕션 모드로 시작
CMD ["npm", "start"]