FROM node:26-slim
RUN npm install -g pnpm@12.11.2
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json api/
COPY contracts/package.json contracts/
RUN pnpm install --frozen-lockfile --filter api...

COPY api api
COPY contracts contracts
WORKDIR /app/api
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:setup && pnpm start"]
