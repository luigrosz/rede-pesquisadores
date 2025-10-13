FROM node:20-alpine AS build

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install --prod

COPY . .
RUN pnpm run build



# COMENTE SE DESCOMENTAR O PROXIMO TRECHO
EXPOSE 5173
CMD ["pnpm", "dev"]


# DESCOMENTE PARA USO EM PRODUCAO
# FROM nginx:alpine
# COPY --from=build /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
