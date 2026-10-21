FROM node:26-slim
RUN npm install -g pnpm@12.11.2
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:setup && pnpm start"]
