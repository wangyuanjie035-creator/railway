# 📦 项目依赖说明

## 🤔 什么是依赖？

### 简单解释

**依赖（Dependencies）** 就是你的项目需要使用的**第三方代码库**。

### 生活类比

就像做菜需要买食材：
- 🍳 **你的代码** = 菜谱（告诉怎么做）
- 📦 **依赖** = 食材（面粉、鸡蛋、调料）
- 🛒 **npm install** = 去超市买食材
- 📋 **package.json** = 购物清单

### 为什么需要依赖？

不需要"重复造轮子"：
- ✅ **节省时间**：使用现成的功能
- ✅ **更可靠**：经过社区测试验证
- ✅ **易维护**：功能更新由作者维护

---

## 📋 本项目的依赖列表

### 运行时依赖（dependencies）

这些是**项目运行时必需**的包：

#### 1. express (^4.18.2)
**用途**：Web 服务器框架
```javascript
// 示例：创建 API 服务器
const express = require('express');
const app = express();
app.get('/api/quotes', (req, res) => {
  res.json({ quotes: [] });
});
```

**为什么需要**：
- 处理 HTTP 请求和响应
- 创建 RESTful API
- 路由管理

**不需要手动使用**：Vercel 自动处理

---

#### 2. multer (^1.4.5-lts.1)
**用途**：文件上传处理
```javascript
// 示例：处理文件上传
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);
});
```

**为什么需要**：
- 解析 multipart/form-data 格式
- 处理文件上传
- 文件类型验证

**项目中的使用**：
- 虽然列在依赖中，但当前代码使用手动构建 multipart
- 保留是为了未来可能的简化

---

#### 3. archiver (^6.0.1)
**用途**：文件压缩（创建 ZIP）
```javascript
// 示例：创建 ZIP 文件
const archiver = require('archiver');
const archive = archiver('zip');
archive.file('file1.txt', { name: 'file1.txt' });
archive.finalize();
```

**为什么需要**：
- 批量下载多个文件
- 压缩文件减少大小
- 创建压缩包

**项目中的使用**：
- 当前未直接使用
- 保留用于未来的批量下载功能

---

#### 4. uuid (^9.0.1)
**用途**：生成唯一标识符
```javascript
// 示例：生成唯一ID
const { v4: uuidv4 } = require('uuid');
const uniqueId = uuidv4();
// 输出: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
```

**为什么需要**：
- 生成文件唯一ID
- 防止文件名冲突
- 追踪文件

**项目中的使用**：
- 当前使用自定义ID生成方式
- 保留用于未来增强

---

### 开发依赖（devDependencies）

这些是**开发时使用**的包，生产环境不需要：

#### 5. nodemon (^3.0.2)
**用途**：自动重启开发服务器
```bash
# 不使用 nodemon
node server.js  # 修改代码后需要手动重启

# 使用 nodemon
nodemon server.js  # 修改代码后自动重启
```

**为什么需要**：
- 开发时自动重启服务器
- 节省手动重启的时间
- 提高开发效率

**如何使用**：
```bash
npm run dev  # 使用 nodemon 启动
```

---

## 🔢 依赖版本说明

### 版本号格式

```
^4.18.2
│ │ │└─ 补丁版本（Bug 修复）
│ │└─── 次版本（新功能，向后兼容）
│└───── 主版本（重大更新，可能不兼容）
└────── ^ 符号（允许次版本和补丁更新）
```

### 版本符号含义

- **`^4.18.2`** - 允许 4.x.x 的更新（不更新主版本）
- **`~4.18.2`** - 只允许 4.18.x 的更新（不更新次版本）
- **`4.18.2`** - 精确版本，不允许任何更新

---

## 💻 如何安装依赖

### 首次安装

```bash
# 在项目根目录执行
npm install
```

**这个命令会做什么**：
1. 读取 `package.json` 文件
2. 下载所有列出的依赖包
3. 保存到 `node_modules/` 文件夹
4. 创建 `package-lock.json` 锁定版本

### 安装后的文件结构

```
项目根目录/
├── package.json          # 依赖清单
├── package-lock.json     # 版本锁定文件（自动生成）
├── node_modules/         # 依赖包存储目录（自动生成）
│   ├── express/
│   ├── multer/
│   ├── archiver/
│   └── uuid/
└── ...
```

---

## ⚙️ npm install 详细过程

### 执行流程

```
1. 检查 package.json
   ↓
2. 解析依赖关系
   ↓
3. 从 npm 仓库下载包
   ↓
4. 安装到 node_modules/
   ↓
5. 生成 package-lock.json
   ↓
6. 完成 ✅
```

### 下载来源

依赖包从 **npm 官方仓库** 下载：
- 官网：https://www.npmjs.com/
- 镜像（中国）：https://registry.npmmirror.com/

### 国内加速

如果下载速度慢，可以使用国内镜像：

```bash
# 临时使用
npm install --registry=https://registry.npmmirror.com

# 永久设置
npm config set registry https://registry.npmmirror.com
```

---

## 📊 依赖大小

### 安装后占用空间

```
node_modules/ 文件夹大小：约 50-100 MB
```

**为什么这么大？**
- 每个包都有自己的依赖
- 依赖的依赖也会被下载（依赖树）

**示例依赖树**：
```
你的项目
├── express (1MB)
│   ├── body-parser (500KB)
│   ├── cookie (100KB)
│   └── ... (更多依赖)
├── multer (500KB)
│   ├── busboy (200KB)
│   └── ... (更多依赖)
└── ...
```

---

## ⚠️ 重要提示

### node_modules 不要提交到 Git

**原因**：
- 文件太多太大（几万个文件）
- 不同操作系统可能需要不同的包
- 其他人可以通过 `npm install` 重新安装

**.gitignore 已经配置**：
```gitignore
node_modules/
```

### 团队协作流程

```
开发者 A：
1. 写代码
2. 添加新依赖到 package.json
3. 提交 package.json 到 Git
4. 推送到远程仓库

开发者 B：
1. 拉取最新代码
2. 运行 npm install
3. 自动安装所有依赖
4. 开始开发
```

---

## 🔧 常用命令

### 安装依赖

```bash
# 安装所有依赖
npm install

# 简写
npm i

# 安装指定包
npm install express

# 安装并保存到 package.json
npm install express --save

# 安装开发依赖
npm install nodemon --save-dev
```

### 更新依赖

```bash
# 检查哪些包可以更新
npm outdated

# 更新所有包（遵循版本规则）
npm update

# 更新指定包
npm update express
```

### 删除依赖

```bash
# 删除包
npm uninstall express

# 删除并从 package.json 中移除
npm uninstall express --save
```

### 查看依赖

```bash
# 查看已安装的包
npm list

# 只查看顶层依赖
npm list --depth=0

# 查看包的信息
npm info express
```

---

## 🐛 常见问题

### Q1: npm install 失败怎么办？

**可能原因**：
1. 网络问题
2. npm 版本过旧
3. 权限问题

**解决方法**：
```bash
# 1. 清除缓存
npm cache clean --force

# 2. 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows

# 3. 重新安装
npm install

# 4. 使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### Q2: 安装很慢怎么办？

**解决方法**：
```bash
# 方法 1: 使用 cnpm（淘宝镜像）
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install

# 方法 2: 使用镜像
npm install --registry=https://registry.npmmirror.com

# 方法 3: 永久设置镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### Q3: 为什么 node_modules 文件夹这么大？

**原因**：
- 包含所有依赖及其依赖
- 每个包都有完整的文件

**解决**：
- 这是正常的，不需要担心
- 可以删除，需要时重新 `npm install`

### Q4: package-lock.json 是什么？

**作用**：
- 锁定依赖的确切版本
- 确保团队成员安装相同的版本
- 提高安装速度

**要提交到 Git 吗**：
- ✅ 是的，应该提交
- 确保所有人使用相同版本

### Q5: 需要安装 Node.js 吗？

**是的！**

npm 是 Node.js 的包管理器，需要先安装 Node.js：

1. 访问 https://nodejs.org/
2. 下载 LTS 版本
3. 安装
4. 验证：`node -v` 和 `npm -v`

---

## 🎯 本项目实际使用

### 当前状态

**虽然 package.json 中列出了依赖，但：**

1. **Vercel 部署**：不需要手动安装
   - Vercel 自动处理依赖
   - 部署时自动运行 `npm install`

2. **Shopify 主题**：不需要 npm 依赖
   - 主题文件直接上传到 Shopify
   - 不使用 Node.js 运行

3. **何时需要 npm install**：
   - ✅ 本地开发 Vercel API
   - ✅ 运行测试脚本
   - ❌ 正常使用（Vercel 自动处理）

### 实际命令

```bash
# 如果要本地开发 API
npm install          # 安装依赖
vercel dev           # 启动开发服务器

# 如果只是使用（部署到 Vercel）
# 不需要运行任何命令，Vercel 自动处理
```

---

## 📚 学习资源

- [npm 官方文档](https://docs.npmjs.com/)
- [package.json 完整说明](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [语义化版本](https://semver.org/lang/zh-CN/)

---

**文档版本**: 1.0  
**最后更新**: 2025-01-29  
**维护者**: AI Assistant

