# 民俗知识挑战 H5

答题页在 `frontend/`，参赛台账在 `backend/`。两边共用浏览器 `localStorage`，需要用同一个开发地址打开。

## 本地运行

```bash
npm install
npm run dev
```

- 答题：<http://localhost:5173/frontend/>
- 参赛台账：<http://localhost:5173/backend/>

首页填写姓名和手机号即可开始。手机号只校验中国大陆 11 位格式，不发送验证码。

## Supabase migration

迁移文件位于 `supabase/migrations/202611160001_create_quiz_records.sql`，用于创建参赛记录表、最终用时生成列、索引和基础 RLS 策略。

```bash
supabase db push
```

当前前端把记录写在浏览器本地。接入 Supabase 时，把 `shared/records.ts` 里的读取和保存换成 `quiz_records` 的查询和插入。生产环境应把后台台账放在登录后的管理端。

## 构建验证

```bash
npm run build
```
