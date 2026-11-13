# WP2026 史实马社区数据仓库 (WP26 Data)

本仓库专门承载《Winning Post 10 2026》史实马数据与中文译名考据，由前端协作平台自动提交 PR 并经维护者审核后合并。

## 文件说明

- `WP26.csv`：最新合并后的原生 31 列数据（UTF-8 with BOM + CRLF，共 20,676 匹史实马）。
- `WP26.original.csv`：只读原始基准数据（用于网页端切换对比「原始数据 / 最新合并数据」，PR 禁止修改）。
- `WP26.translations.jsonl`：按马匹逐行对齐的中文译名与来源理由列表（每条译名均强制要求填写来源或理由，第 1 条为主显示译名，全部译名均可被检索）。
- `scripts/validate.mjs`：PR 自动校验脚本（`node scripts/validate.mjs`）。
