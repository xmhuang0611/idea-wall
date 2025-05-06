# idea-wall
 
## 运行API项目

根据查看的文件内容，这是一个基于 FastAPI 的 Python 后端项目。以下是启动步骤：

### 创建并激活虚拟环境
```bash
# 在 components/idea-wall-api 目录下
python -m venv .venv

# Windows 激活虚拟环境
.venv\Scripts\activate

# Linux/Mac 激活虚拟环境
source .venv/bin/activate
```

### 升级pip (可选)
```bash
python -m pip install --upgrade pip
```

### 安装依赖
```bsh
pip install -r requirements.txt

pydantic-core 依赖于Rust和Cargo，需预先安装
      Cargo, the Rust package manager, is not installed or is not on PATH.
      This package requires Rust and Cargo to compile extensions. Install it through
      the system's package manager or via https://rustup.rs/
```

### 配置环境变量
项目使用了 python-dotenv，需要创建 .env 文件配置必要的环境变量，主要包括：
```bash
# 创建 .env 文件（如果不存在）
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=idea_wall
SECRET_KEY=your_secret_key
```

### 启动服务
```bash
# 开发模式启动
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式启动
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 启动后
```bash
API 文档访问地址：http://localhost:8000/docs
API 根路径：http://localhost:8000/api
```

## 运行UI项目

### 安装nodejs依赖包
```bash
npm run install
```

### 启动UI
```bash
npm start
```

### 启动后
```bash
访问：http://localhost:4200/
/api/* 接口会通过代理转发到 http://localhost:8000，代理的设置在 \components\idea-wall-ui\proxy.conf.json
```

