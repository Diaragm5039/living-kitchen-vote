## Living Kitchen 投票系统 - 上线部署指南

本指南将带你完成从零到上线的全部步骤。整个过程大约需要 20 分钟。

---

### 第一步：Supabase 数据库

1. 打开 [supabase.com](https://supabase.com)，登录并创建一个新项目（Project）
2. 等待项目初始化完成（约 1-2 分钟）
3. 进入左侧菜单 **SQL Editor**，把 `schema.sql` 的全部内容粘贴进去，点击 **Run** 执行
4. 执行成功后，左侧 **Table Editor** 里应该能看到 `dishes` 和 `votes` 两张表
5. 获取数据库连接字符串：进入 **Settings → Database → Connection string**
   - 选择 **Pooler** 模式（适合 Render 免费套餐）
   - 记下连接字符串，格式类似：
     ```
     postgresql://postgres.xxxxx:密码@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
     ```
   - 把其中的 `[YOUR-PASSWORD]` 替换为你创建项目时设置的数据库密码

> 注意：Supabase 连接字符串中的密码需要你手动填入，不是自动生成的。

---

### 第二步：GitHub 仓库

1. 在 [github.com](https://github.com) 创建一个新的仓库（比如 `living-kitchen-vote`）
2. 把本项目文件夹里的所有文件推送到这个仓库：

```bash
cd 投票系统
git init
git add .
git commit -m "init: Living Kitchen vote system"
git branch -M main
git remote add origin https://github.com/你的用户名/living-kitchen-vote.git
git push -u origin main
```

> 确保 `.env` 文件没有被提交（它应该在 `.gitignore` 里被忽略）。

推送成功后，你的仓库里应该包含这些文件：
```
server.js
package.json
schema.sql
.env.example
.gitignore
templates/
  index.html
  admin.html
  admin-login.html
```

---

### 第三步：Render 部署

1. 打开 [render.com](https://render.com)，登录并点击 **New → Web Service**
2. 连接你的 GitHub 账号，选择刚才创建的仓库
3. 配置如下：

| 配置项 | 值 |
|-------|-----|
| **Name** | `living-kitchen`（或任意名称） |
| **Region** | 选离你最近的，如 Singapore |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

4. 展开 **Environment Variables**，添加以下变量：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | 第一步获取的 Supabase 连接字符串 |
| `ADMIN_PASSWORD` | 你想设置的管理员密码（如 `admin123`） |
| `SESSION_SECRET` | 随便一串随机字符（如 `my-secret-2026`） |
| `NODE_ENV` | `production` |

5. 点击 **Create Web Service**

Render 会自动安装依赖并启动服务。部署成功后你会看到一个类似 `living-kitchen.onrender.com` 的地址。打开这个地址确认投票页面正常显示。

> 免费套餐的 Render 服务在 15 分钟无请求后会休眠，首次访问可能需要等待 30 秒唤醒。

---

### 第四步：阿里云域名解析

1. 登录 [阿里云控制台](https://dns.console.aliyun.com)
2. 找到 `liuziyao.cn` 的域名解析设置
3. 添加一条 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|-------|
| CNAME | `@` | `living-kitchen.onrender.com` |

如果你希望用子域名（如 `vote.liuziyao.cn`）：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|-------|
| CNAME | `vote` | `living-kitchen.onrender.com` |

4. 等待 DNS 生效（通常几分钟到几小时）

> 阿里云有时不允许根域名（@）设置 CNAME。如果遇到这个问题，可以改用子域名 `vote`，然后用 `vote.liuziyao.cn` 访问。

---

### 第五步：Render 绑定自定义域名

1. 在 Render 的 Web Service 页面，进入 **Settings → Custom Domains**
2. 点击 **Add Custom Domain**
3. 输入你的域名（如 `liuziyao.cn` 或 `vote.liuziyao.cn`）
4. Render 会显示需要配置的 DNS 记录，确认与第四步一致
5. 等待验证通过（可能需要几分钟）

Render 会自动为你的域名配置 HTTPS 证书。

---

### 验证清单

部署完成后，确认以下功能正常：

- [ ] 打开 `https://liuziyao.cn`（或你的域名），看到投票首页
- [ ] 输入昵称后可以正常滑动投票
- [ ] 投完所有菜后能看到结果汇总
- [ ] 访问 `/admin-login`，输入密码后能进入管理后台
- [ ] 管理后台能增删改菜品，数据实时生效

---

### 常见问题

**Q: 页面显示空白或 500 错误？**
检查 Render 的 Logs，看是否有数据库连接错误。通常是 `DATABASE_URL` 填错了。

**Q: Render 免费套餐休眠后首次访问很慢？**
这是正常的，免费服务 15 分钟不活跃后会暂停，首次请求需要 30-50 秒唤醒。

**Q: 想更新菜品列表？**
在管理后台操作即可，修改会直接写入 Supabase 数据库，所有用户实时可见。

**Q: 想重置所有投票？**
在管理后台点击「重置投票」按钮。
