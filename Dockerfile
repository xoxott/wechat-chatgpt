FROM node:16 AS app

# 安装依赖
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y google-chrome-stable chromium xvfb \
    && rm -rf /var/lib/apt/lists/* \
    && echo "Chrome: " && google-chrome --version

WORKDIR /app

# 复制并安装npm依赖
COPY package*.json ./
RUN npm install

# 复制项目文件
COPY . .

# 使用xvfb-run运行应用
CMD xvfb-run --server-args="-screen 0 1280x800x24 -ac -nolisten tcp -dpi 96 +extension RANDR" npm run dev
