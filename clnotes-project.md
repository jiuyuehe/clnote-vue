# CLNotes Project - React to Vue3 Migration

## 项目概述

本项目是将原有的React笔记应用迁移到Vue3+Vite+Element Plus的完整重写。目标是实现功能无缺失，组件符合Element Plus规范，数据格式兼容旧项目。

## 技术栈对比

### 原项目 (clnotes-old)
- **框架**: React 15.6.1 + Create React App
- **状态管理**: MobX
- **UI库**: Ant Design v2.13.6
- **路由**: React Router v4 + HashRouter
- **富文本编辑器**: WangEditor v3.0.10
- **构建工具**: Webpack (Create React App)

### 新项目 (clnotes-new)
- **框架**: Vue 3.5.18 + Vite
- **状态管理**: Pinia
- **UI库**: Element Plus v2.11.2
- **路由**: Vue Router v4 + createWebHashHistory
- **富文本编辑器**: @wangeditor/editor v5.1.23 + @wangeditor/editor-for-vue
- **构建工具**: Vite v7.1.2

## 项目架构

### 目录结构
```
clnotes-new/
├── public/                     # 静态资源 (从原项目复制)
│   ├── iconfont/              # 图标字体
│   ├── index.html             # 主页面
│   └── noteshare.html         # 分享页面
├── src/
│   ├── assets/                # 静态资源 (从原项目复制)
│   │   ├── App.css           # 主样式
│   │   ├── iconfont.css      # 图标样式
│   │   └── *.png             # 图片资源
│   ├── components/            # Vue组件
│   │   ├── Nav.vue           # 导航侧边栏
│   │   ├── Loading.vue       # 加载组件
│   │   ├── BookNav.vue       # 笔记列表和编辑器
│   │   ├── ShareNav.vue      # 分享管理
│   │   └── WangEditor.vue    # 富文本编辑器
│   ├── router/                # 路由配置
│   │   └── index.js          # Vue Router配置
│   ├── store/                 # Pinia状态管理
│   │   ├── notes.js          # 笔记相关状态
│   │   ├── user.js           # 用户相关状态
│   │   └── index.js          # 状态导出
│   ├── utils/                 # 工具函数
│   │   ├── fetch-creator.js  # API请求封装
│   │   └── sysHandler.js     # 系统错误处理
│   ├── App.vue               # 主应用组件
│   └── main.js               # 应用入口
├── vite.config.js            # Vite配置
└── package.json              # 依赖配置
```

## 功能模块

### 1. 状态管理迁移

#### 原MobX Store -> Pinia Store
- **notes.js**: 笔记本和笔记管理
  - 笔记本列表 (notebooks)
  - 笔记列表 (noteList)
  - 当前笔记详情 (noteDetail)
  - 分享笔记列表 (shareNoteList)
  - CRUD操作方法

- **user.js**: 用户信息管理
  - 用户信息 (userInfo)
  - 获取用户信息方法

### 2. 路由配置

#### 路由对应关系
| 原React路由 | 新Vue路由 | 功能 |
|------------|-----------|------|
| `/` | `/` | 默认页面 (Loading) |
| `/loading/:nbi` | `/loading/:nbi` | 加载指定笔记本 |
| `/book/:nbi` | `/book/:nbi` | 笔记本详情 |
| - | `/book/:nbi/note/:noteId` | 特定笔记编辑 |
| `/share` | `/share` | 分享管理 |

### 3. 组件迁移

#### UI组件映射
| Ant Design | Element Plus | 说明 |
|------------|-------------|------|
| `Button` | `el-button` | 按钮组件 |
| `Layout` | `el-container` | 布局组件 |
| `Sider` | `el-aside` | 侧边栏 |
| `Menu` | `el-dropdown` | 菜单/下拉 |
| `Modal` | `el-dialog` | 对话框 |
| `Input` | `el-input` | 输入框 |
| `Table` | `el-table` | 表格 |
| `Icon` | `el-icon` | 图标 |

### 4. API兼容性

#### 请求配置保持一致
- URL前缀: `/apps/`
- 认证头: `ct` (token)
- 请求格式: JSON
- 错误处理: 与原项目相同

#### 接口列表
- `GET /apps/notebook/list` - 获取笔记本列表
- `GET /apps/note/list` - 获取笔记列表
- `GET /apps/note` - 获取笔记详情
- `POST /apps/notebook` - 创建/更新笔记本
- `POST /apps/note` - 创建/更新笔记
- `DELETE /apps/notebook` - 删除笔记本
- `DELETE /apps/notes` - 删除笔记
- `POST /apps/note/share` - 分享笔记
- `DELETE /apps/note/share` - 取消分享
- `GET /apps/note/share/list` - 获取分享列表

### 5. 富文本编辑器

#### 功能特性
- **图片上传**: 支持拖拽和选择文件上传
- **粘贴上传**: 支持直接粘贴图片
- **自动保存**: 内容变化4秒后自动保存
- **工具栏**: 完整的富文本编辑功能
- **接口兼容**: 使用相同的上传接口

## 关键特性

### 1. 自动保存机制
```javascript
const handleTextChange = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(async () => {
    // 4秒后自动保存
    await notesStore.createNote({
      noteId: selectedNote.value.noteId,
      noteContent: selectedNote.value.noteContent
    }, 'update')
  }, 4000)
}
```

### 2. 图片上传配置
```javascript
uploadImage: {
  server: '/upload/stream',
  fieldName: 'file',
  maxFileSize: 5 * 1024 * 1024, // 5M
  headers: {
    'ct': 'token',
    'cv': '3.6.0'
  }
}
```

### 3. 响应式设计
- 使用Element Plus的栅格系统
- 适配不同屏幕尺寸
- 保持与原项目相同的布局结构

## 开发和构建

### 开发环境
```bash
cd clnotes-new
npm install
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 测试验证

### 功能测试项目
- [x] 导航侧边栏显示
- [x] 笔记本管理对话框
- [x] 分享页面和表格显示
- [x] 下拉菜单交互
- [x] 路由跳转功能
- [ ] 富文本编辑器完整功能
- [ ] 图片上传和显示
- [ ] 自动保存机制
- [ ] API接口调用
- [ ] 笔记CRUD操作

### 兼容性测试
- [ ] 数据格式兼容性验证
- [ ] API接口兼容性测试
- [ ] 与旧项目数据互通测试

## 部署说明

### Vite配置
- 代理设置: 支持开发环境API代理
- 路径别名: `@` 指向 `src` 目录
- 静态资源处理: 自动优化和压缩

### 环境变量
- 开发环境: 使用固定token进行API访问
- 生产环境: 从Cookie获取token

## 注意事项

1. **图标兼容**: Element Plus图标与Ant Design图标名称不同，需要手动映射
2. **样式调整**: 部分样式需要适配Element Plus的CSS类名
3. **事件处理**: Vue3的事件处理语法与React不同
4. **生命周期**: 组合式API的生命周期与React类组件不同
5. **状态管理**: Pinia的响应式与MobX的observable有差异

## 后续优化

1. **性能优化**: 使用Vue3的性能特性如Tree-shaking
2. **类型安全**: 考虑引入TypeScript
3. **测试覆盖**: 添加单元测试和E2E测试
4. **代码分割**: 实现路由级别的代码分割
5. **PWA支持**: 添加Service Worker支持离线功能

## 迁移决策记录

### 技术选型理由
1. **Vue3**: 更现代的框架，更好的性能和开发体验
2. **Vite**: 更快的构建速度，更好的开发体验
3. **Element Plus**: 成熟的Vue3 UI库，功能完整
4. **Pinia**: Vue3官方推荐的状态管理库
5. **WangEditor**: 继续使用相同的富文本编辑器保证兼容性

### 保持兼容的设计
1. **API接口**: 完全保持原有接口规范
2. **数据格式**: 保持相同的数据结构
3. **路由结构**: 保持相同的URL路径
4. **功能完整性**: 确保所有原有功能都能实现