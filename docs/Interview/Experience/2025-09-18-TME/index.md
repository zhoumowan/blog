---
date: 2025-09-18 20:00:00
publish: false
tags:
   - 腾讯音乐
   - 秋招
   - 前端
   - 面试
---

# 腾讯音乐秋招一面

1. 自我介绍。
2. ReactRouter 的实现原理。

   :::tip 📌 回答
   React Router 的实现原理可以概括为：它通过 BrowserRouter 或 HashRouter 来封装路由容器，内部利用 History API（pushState、replaceState、popState）或 hashChange 事件监听 URL 的变化；当地址栏发生改变时，Router 会更新自身维护的 location 对象，并通过 React Context 向下传递。每一个 Route 组件在渲染时都会订阅这个 location，根据配置的 path 使用路由匹配算法（支持动态参数、通配符、嵌套）判断是否需要渲染对应的组件。与此同时，Link 和 Navigate 组件会拦截跳转行为，调用 history.push/replace 来修改 URL，而不会触发浏览器的默认刷新，从而实现单页应用的无刷新导航。整个过程可以总结为：URL 改变 → Router 更新上下文 → Route 匹配 → 渲染组件，这样就完成了前端路由系统。
   :::

3. History 和 Hash 的区别。

   :::tip 📌 回答
   1. Hash 路由
   - 原理：利用 location.hash 和 hashChange 事件，# 后面的内容不会被浏览器当作真正的 URL 请求发送到服务端。
   - URL 样式：<http://example.com/#/user/123>。
   - 刷新后请求：浏览器只会请求 <http://example.com/>，不会带上 hash，天然避免了 404 问题。
   - 兼容性：老浏览器（IE9+）就支持，适合对兼容性要求高的场景。
   - 缺点：URL 不够美观，SEO 不友好。

   2. History 路由
   - 原理：基于 HTML5 的 history.pushState / replaceState 和 popState 事件，实现前端修改路径但不刷新页面。
   - URL 样式：<http://example.com/user/123>，更接近真实地址。
   - 刷新后请求：浏览器会真的请求 /user/123，所以如果后端没有配置兜底（通常转发到 index.html），就会返回 404。
   - 优点：URL 美观，语义化强，利于 SEO。
   - 缺点：需要服务端配合做重定向，否则刷新/直访问户端路由会报错。
   :::

4. 低代码配置和渲染的实现原理。
5. 介绍 Json Schema 的结构。
6. 你现在相当于 markRaw 等经过序列化和反序列化，存在 indexedDB 是字符串，如果这个函数处理后字符串很大怎么办？
7. 讲一下项目里的 OAuth 和 JWT。
8. JWT 相比于其他的鉴权机制，有什么区别或者长短处？
9.  SSR 的性能指标能达到什么水准？
10. 移动端怎么布局？
11. rem 是什么？
12. 手写发布订阅模式。

   :::details 🔍 展开代码
   <<< ./1.js
   :::

13. 对上面写的代码提了些问题：args 为什么有的时候需要扩展运算符，有的时候不需要？内部接收到 args 怎么访问并使用？为什么取消监听某个函数需要重新 set，on 的时候不需要重新 set？
14. 微前端的 JS 等是如何隔离的？
15. 为什么要对 setTimeout 等重写？
16. 我在子应用里向 document 里 appendChild，或添加到哪个位置？什么时机执行？什么时候改写的默认行为？怎么做到插入到这个位置的？
17. 最复杂或者最有挑战的工作？
18. 特征淘汰是页面阻塞了嘛？为什么阻塞？你找到阻塞的函数的部分了吗？
19. 提前实习？Base？有无其他 Offer？
20. 「反问」业务、技术栈团队规模、培养体系、晋升机制、OKR 标准。