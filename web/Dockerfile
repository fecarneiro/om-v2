FROM node:26-slim
RUN npm install -g pnpm@12.11.2
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
COPY contracts/package.json contracts/
RUN pnpm install --frozen-lockfile --filter web...

COPY web web
COPY contracts contracts
WORKDIR /app/web
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
