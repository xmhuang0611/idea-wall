
# 创建虚拟环境

python -m venv venv

# 激活虚拟环境

# Windows:

.\venv\Scripts\activate

# Linux/Mac:

# source venv/bin/activate

# 安装依赖

pip install -r requirements.txt

# 运行服务器

uvicorn main:app --reload

# 访问API文档

http://127.0.0.1:8000/docs
