# P22 Spec - 太阳阴影/地理定位推算仪

## 1. Summary

- **Project ID**: P22
- **Project Name**: 太阳阴影/地理定位推算仪
- **Goal**: 根据阴影长度+方向+日期推算拍摄地理位置或时间
- **User Persona**: 核查员 / OSINT 分析师

## 2. Scope

- **In scope**:
  - 根据阴影长度+方向+日期推算拍摄地理位置或时间
- **Out of scope**:
  - 后端代理或服务端逻辑
  - API Key 持久化存储

## 3. UX

- **Core workflow**: 用户输入 → 前端处理 → 结果展示
- **Inputs**: 阴影参数 + 日期/坐标
- **Outputs**: 推算结果 + 地图标注
- **States**: empty (初始) / loading (处理中) / error (失败) / success (完成)

## 4. Functional Requirements

1. FR-1: 根据阴影长度+方向+日期推算拍摄地理位置或时间
2. FR-2: 结果可视化展示
3. FR-3: 错误状态可见提示

## 5. Non-Functional Requirements

- **Performance**: 核心任务 3 分钟内完成
- **Accessibility**: 键盘导航、aria-label、焦点可见、WCAG AA 对比度
- **Privacy**: 本地处理优先，不默认上传数据
- **Browser support**: 现代 Chromium (Chrome 110+)

## 6. Dependencies

- **Libraries/CDNs**: SunCalc (CDN)
- **Local data**: 无

## 7. Risks & Mitigations

- **Risk**: 推算精度受输入误差影响
- **Mitigation**: 显示误差范围

## 8. Acceptance Criteria

- [ ] 时间与经纬度输入
- [ ] 太阳角度计算
- [ ] 可视化方向指示
- [ ] 纯静态页面可部署 GitHub Pages
- [ ] 移动端可用
- [ ] 隐私提示清晰可见
