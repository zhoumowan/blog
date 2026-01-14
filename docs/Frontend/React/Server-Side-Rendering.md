---
date: 2025-10-25 12:35:00
tags:
   - React
   - 服务端渲染
---

# 一文解析 React 服务端渲染

## 服务端渲染的实现原理

简单来讲，服务端渲染的实现原理主要包含以下两部分：

- 服务端渲染：在服务端将 React 组件渲染为 HTML 字符串或者管道化的 NodeJS 流，返回给客户端。这里用到两个 API：

  ✅ ReactDOMServer.renderToString：将 React 组件渲染为 HTML 字符串。

  ✅ ReactDOMServer.renderToPipeableStream：将 React 组件渲染为管道化的 NodeJS 流。

- 客户端渲染：在客户端接收 HTML 结构后需要进行交互方面的处理，例如事件绑定、状态管理等。这里用到的 API 主要有：

  ✅ ReactDOM.render：将 HTML 结构渲染为 DOM 元素。

  ✅ ReactDOM.hydrate：将 HTML 结构渲染为 DOM 元素，并且与服务器端渲染的结果进行关联。

> 为了保证服务端和客户端能够完美配合，需要React在服务端和客户端保持一致，即同构。

## renderToString

在一个 React 为技术栈的项目里，我们可以遵循以下步骤实现以 `renderToString` 为基础的服务端渲染：

1. 通过 Vite 等工具新建一个 React 项目，默认情况下会通过 `createRoot` 走 CSR 的路径。检查 `main.jsx` 文件如下：

    ```JSX
    import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import './index.css'
    import App from './App.jsx'

    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <App />
        </StrictMode>,
    )
    ```



2. 接下来针对 `App.jsx` 文件，我们将其从 CSR 修改为 SSR。默认的文件内容如下：

    ```JSX
    import { useState } from 'react'
    import reactLogo from './assets/react.svg'
    import viteLogo from '/vite.svg'
    import './App.css'

    function App() {
        const [count, setCount] = useState(0)

        return (
            <>
            <div>
                <a href="https://vite.dev" target="_blank">
                <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
                </button>
                <p>
                Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
            </>
        )
    }

    export default App

    ```

3. 新建 `entry-server.jsx` 文件，用于实现服务端渲染。默认内容如下：

    ```JSX
    import { renderToString } from 'react-dom/server'
    import { StrictMode } from 'react'
    import App from './App.jsx'

    export function render() {
        const html = renderToString(
            <StrictMode>
                <App />
            </StrictMode>,
        )
        return { html }
    }
    ```

4. 新建 `entry-client.jsx` 文件，用于实现客户端渲染。默认内容如下：

    ```JSX
    import { hydrateRoot } from 'react-dom/client'
    import { StrictMode } from 'react'
    import App from './App.jsx'

    hydrateRoot(document.getElementById('root'),
        <StrictMode>
            <App />
        </StrictMode>,
    )
    ```

5. 改造 `index.html` 文件，将 `entry-client.jsx` 引入到 `index.html` 中。默认内容如下：

    ```HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/svg/logo.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite + React</title>
    </head>
    <body>
        <div id="root"><!--app-html--></div>
        <script type="module" src="/entry-client.jsx"></script>
    </body>
    </html>
    ```

6. 自定义服务端，包括创建 server 文件、创建 Vite 服务器、赋予热更新能力和返回服务端渲染结果，`server.js` 默认内容如下：

    ```JS
    import express from 'express'
    import fs from 'fs'


    const port = 5173

    const app = express()

    const { createServer } = await import('vite')

    const vite = await createServer({
        server: { middlewareMode: true },
        appType: "custom"
    })

    app.use(vite.middlewares)
    app.use('*all',async (req,res)=>{
        const url = req.originalUrl
        let template =  fs.readFileSync('./index.html','utf-8')
        template = await vite.transformIndexHtml(url,template)
        const rendered = (await vite.ssrLoadModule('/src/entry-server.jsx')).render()
        const html = template.replace('<!-- app-html -->',rendered.html)
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
    })

    app.listen(port,()=>{
        console.log(`Server is running on port ${port}`)
    })

    ```

## renderToPipeableStream

renderToString 是同步的，而 renderToPipeableStream 是异步的，其存在的意义就是满足一些场景下的需求，比如：

- 服务端渲染时，需要等待所有数据加载完成后再渲染，而 renderToString 是同步的，无法满足这个需求。
- 服务端渲染时，需要将渲染结果分块返回给客户端，而 renderToString 是同步的，无法满足这个需求。
- 可能会用到 Suspense 组件，而 Suspense 组件只能在异步环境下使用，因此也需要 renderToPipeableStream。


1. 我们先创建这样一个 Card 组件：

    ```JSX
    import { useState } from 'react'

    const Card = () => {
        const [count, setCount] = useState(0)
        return (
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
        )
    }

    export default Card
    ```

2. 然后对 App 组件进行改造，添加 Suspense 组件：

    ```JSX
    import reactLogo from './assets/react.svg'
    import viteLogo from '/vite.svg'
    import './App.css'
    import { lazy } from 'react'
    import { Suspense } from 'react'

    const Card = lazy(() => import('./Card'))

    function App() {

    return (
        <>
        <div>
            <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
        </div>
        <h1>Vite + React</h1>
        <Suspense fallback={<div>Loading...</div>}>
            <Card />
        </Suspense>
        <p className="read-the-docs">
            Click on the Vite and React logos to learn more
        </p>
        </>
    )
    }

    export default App

    ```

3. 打开浏览器去访问，界面和交互都是没有问题的，但是控制台会报错如下：


    :::danger Error

    The server used "renderToString" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to "renderToPipeableStream" which supports Suspense on the server

    :::

4. 对比 renderToString 和 renderToPipeableStream，我们需要改造 `server.js` 和 `entry-server.jsx` 文件。

:::code-group

```JSX [entry-server.jsx]
import { renderToPipeableStream } from 'react-dom/server'
import { StrictMode } from 'react'
import App from './App.jsx'

export function render(options) {
    const { pipe } = renderToPipeableStream(
        <StrictMode>
            <App />
        </StrictMode>,
        options
    )
    return { pipe }
}
```

```JavaScript [server.js]
import express from 'express'
import fs from 'fs'
import { Transform } from 'stream'


const port = 5173
const app = express()

const { createServer } = await import('vite')

const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom"
})

app.use(vite.middlewares)
app.use('*all', async (req, res) => {
    let didError = false

    const url = req.originalUrl
    let template = fs.readFileSync('./index.html', 'utf-8')

    template = await vite.transformIndexHtml(url, template)
    const rendered = (await vite.ssrLoadModule('/src/entry-server.jsx')).render({
        onShellReady() {
            res.status(didError ? 500 : 200)
            res.set({ 'Content-Type': 'text/html' })
            const transformStream = new Transform({
                transform(chunk, encoding, callback) {
                    res.write(chunk, encoding)
                    callback()
                }
            })
            const [htmlStart, htmlEnd] = template.split('<div id="root">')
            res.write(htmlStart + '<div id="root">')
            rendered.pipe(transformStream)
            transformStream.on('finish', () => {
                res.end('</div>' + htmlEnd)
            })
        },
        onShellError(error) {
            res.status(500)
            res.set({ 'Content-Type': 'text/html' })
            res.send(`<h1>Error: ${error.message}</h1>`)
        },
        onError(error) {
            didError = true
            console.error(error)
        }
    })
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

```

:::


## 生产环境下的调整

在开发环境中，我们刷新 SSR 的页面会发现页面存在样式闪烁的问题，这是因为在开发环境中，样式是客户端赋予的能力，而页面结构是服务器渲染的。

在生产环境里，这种问题不用担心。因为在部署服务前，我们会先构建出静态资源，包括样式文件。

我们对 `package.json` 进行调整：

```json
"scripts": {
    "dev": "node server.js",
    "build": "pnpm run build:client && pnpm run build:server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.jsx",
    "preview": "node server.js"
}
```

但是你会注意到，当前并没有区分开发环境和生产环境。

我们可以通过环境变量来区分：

```json
"scripts": {
    "dev": "node server.js",
    "build": "pnpm run build:client && pnpm run build:server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.jsx",
    "preview": "node server.js"
}
```

在这之前需要运行以下命令安装 `cross-env`：

```bash
pnpm install cross-env -D
```

接着，我们改造服务端代码，新的 `server.js` 如下：

```JavaScript
import express from 'express'
import fs from 'fs'
import { Transform } from 'stream'

const isProduction = process.env.NODE_ENV === 'production'
const port = isProduction ? 8080 : 5173
const app = express()
const { createServer } = await import('vite')

const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom"
})

app.use(vite.middlewares)
app.use('*all', async (req, res) => {
    let didError = false
    const url = req.originalUrl
    let template
    let render

    if (isProduction) {
        template = fs.readFileSync('./dist/client/index.html', 'utf-8')
        render = (await vite.ssrLoadModule('./dist/server/entry-server.js')).render
    }
    else {
        template = fs.readFileSync('./index.html', 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('./src/entry-server.jsx')).render
    }

    const rendered = render({
        onShellReady() {
            res.status(didError ? 500 : 200)
            res.set({ 'Content-Type': 'text/html' })
            const transformStream = new Transform({
                transform(chunk, encoding, callback) {
                    res.write(chunk, encoding)
                    callback()
                }
            })
            const [htmlStart, htmlEnd] = template.split('<div id="root">')
            res.write(htmlStart + '<div id="root">')
            rendered.pipe(transformStream)
            transformStream.on('finish', () => {
                res.end('</div>' + htmlEnd)
            })
        },
        onShellError(error) {
            res.status(500)
            res.set({ 'Content-Type': 'text/html' })
            res.send(`<h1>Error: ${error.message}</h1>`)
        },
        onError(error) {
            didError = true
            console.error(error)
        }
    })
})

app.listen(port, () => {
    console.log(`[${isProduction ? 'production' : 'development'}] Server is running on port ${port}`)
})

```

运行 `preview` 命令，查看是否正常运行：

![20251027115905_e3813ef5a644eb51b8a7ffc97d7204d6.png](https://blog-1328542955.cos.ap-shanghai.myqcloud.com/20251027115905_e3813ef5a644eb51b8a7ffc97d7204d6.png)

查看网页源代码如下：

```HTML

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>react-ssr</title>
    <script type="module" crossorigin src="/assets/index-BLFP0Tac.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-COcDBgFa.css">
  </head>
  <body>
    <div id="root"><link rel="preload" as="image" href="/vite.svg"/><link rel="preload" as="image" href="/assets/react-CHdo91hT.svg"/><div><a href="https://vite.dev" target="_blank"><img src="/vite.svg" class="logo" alt="Vite logo"/></a><a href="https://react.dev" target="_blank"><img src="/assets/react-CHdo91hT.svg" class="logo react" alt="React logo"/></a></div><h1>Vite + React</h1><!--$--><div class="card"><button>count is <!-- -->0</button><p>Edit <code>src/App.jsx</code> and save to test HMR</p></div><!--/$--><p class="read-the-docs">Click on the Vite and React logos to learn more</p></div><!--app-html--></div>

  </body>
</html>

```

发现其实是静态资源采用绝对路径，导致从 `dist` 开始访问找不到对应资源，是因为我们将静态资源通通打包到了 `dist/client` 目录下。因此，我们运行以下命令安装 `sirv`：

```bash
pnpm install sirv
```

最后，我们需要修改 `server.js` 代码，添加静态资源的处理：

```JavaScript

import express from 'express'
import fs from 'fs'
import path from 'node:path'
import { Transform } from 'stream'
import sirv from 'sirv'

const isProduction = process.env.NODE_ENV === 'production'
const port = isProduction ? 8080 : 5173
const app = express()
const { createServer } = await import('vite')

// 生产环境静态资源路径修改为 ./dist/client
if (isProduction) {
    const clientDist = path.resolve('./dist/client')
    app.use(sirv(clientDist, { extensions: [] }))
}

const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom"
})

app.use(vite.middlewares)
app.use('*all', async (req, res) => {
    let didError = false
    const url = req.originalUrl
    let template
    let render

    if (isProduction) {
        template = fs.readFileSync('./dist/client/index.html', 'utf-8')
        render = (await vite.ssrLoadModule('./dist/server/entry-server.js')).render
    }
    else {
        template = fs.readFileSync('./index.html', 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('./src/entry-server.jsx')).render
    }

    const rendered = render({
        onShellReady() {
            res.status(didError ? 500 : 200)
            res.set({ 'Content-Type': 'text/html' })
            const transformStream = new Transform({
                transform(chunk, encoding, callback) {
                    res.write(chunk, encoding)
                    callback()
                }
            })
            const [htmlStart, htmlEnd] = template.split('<div id="root">')
            res.write(htmlStart + '<div id="root">')
            rendered.pipe(transformStream)
            transformStream.on('finish', () => {
                res.end('</div>' + htmlEnd)
            })
        },
        onShellError(error) {
            res.status(500)
            res.set({ 'Content-Type': 'text/html' })
            res.send(`<h1>Error: ${error.message}</h1>`)
        },
        onError(error) {
            didError = true
            console.error(error)
        }
    })
})

app.listen(port, () => {
    console.log(`[${isProduction ? 'production' : 'development'}] Server is running on port ${port}`)
})

```

现在，运行 `preview` 命令，查看是否正常运行：

![20251027121906_0d8ac654db7153f5f0e6705ed38eab86.png](https://blog-1328542955.cos.ap-shanghai.myqcloud.com/20251027121906_0d8ac654db7153f5f0e6705ed38eab86.png)

## SSR 下的数据同构

通过 `useEffect` 获取数据，这是传统的客户端渲染方式，数据是在客户端获取的。但是这种做法，是不利于 SEO 的，因为数据是在客户端获取的，而搜索引擎爬虫并不能执行 JavaScript 代码。

编写类似于 `getServerSideProps` 或 `getStaticProps` 这样的函数，在服务器端获取数据，然后将数据传递给客户端。

我们先在 `App` 组件中添加 `getServerSideProps` 函数：

```JavaScript

export async function getServerSideProps() {
  const url = 'https://api.freeapi.app/api/v1/public/randomusers/13';
  const userRes = await fetch(url);
  const userData = await userRes.json();
  return {
    props: {
      users: userData.data
    }
  }
}

```

并且接下来由服务端将数据传递给 `App` 组件，先修改一下 `server.js` 代码：

```JavaScript
const getServerSideProps = (await vite.ssrLoadModule('./src/App.jsx')).getServerSideProps
const props = getServerSideProps ? (await getServerSideProps()) : {}

const rendered = render({
    onShellReady() {
        res.status(didError ? 500 : 200)
        res.set({ 'Content-Type': 'text/html' })
        const transformStream = new Transform({
            transform(chunk, encoding, callback) {
                res.write(chunk, encoding)
                callback()
            }
        })
        const [htmlStart, htmlEnd] = template.split('<div id="root">')
        res.write(htmlStart + '<div id="root">')
        rendered.pipe(transformStream)
        transformStream.on('finish', () => {
            res.end('</div>' + htmlEnd)
        })
    },
    onShellError(error) {
        res.status(500)
        res.set({ 'Content-Type': 'text/html' })
        res.send(`<h1>Error: ${error.message}</h1>`)
    },
    onError(error) {
        didError = true
        console.error(error)
    }
},props)

```

接下来，我们把 props 传递给服务器组件 `App`：

```JavaScript

import { renderToPipeableStream } from 'react-dom/server'
import { StrictMode } from 'react'
import App from './App.jsx'

export function render(options,props) {
    const { pipe } = renderToPipeableStream(
        <StrictMode>
            <App {...props} />
        </StrictMode>,
        options
    )
    return { pipe }
}

```

```JSX

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { lazy } from 'react'
import { Suspense } from 'react'

const Card = lazy(() => import('./Card'))

function App({ props }) {

  const { userData } = props || {}

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Card />
      </Suspense>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div>
        {userData?.statusCode} - {userData?.data.name.title}
      </div>

    </>
  )
}

export default App


export async function getServerSideProps() {
  const url = 'https://api.freeapi.app/api/v1/public/randomusers/13';
  const userRes = await fetch(url);
  const userData = await userRes.json();
  return {
    props: {
      userData
    }
  }
}

```

此时，如果打开控制台能发现返回的 HTML 结构里已经包含了提前获取的数据，接下来我们需要同构 CS 结构，保证客户端是可以正常渲染结果的。

![20251027153709_396b29c91f48490ef65e1ec68af9509a.png](https://blog-1328542955.cos.ap-shanghai.myqcloud.com/20251027153709_396b29c91f48490ef65e1ec68af9509a.png)

在 `rendered` 里添加下面一行，生成一个变量挂载的脚本：

```JavaScript
bootstrapScriptContent:`window.__INITIAL_PROPS__ = ${JSON.stringify(props)}`,
```

![20251027154228_272876c0aee6df96fd8ff33ed42824de.png](https://blog-1328542955.cos.ap-shanghai.myqcloud.com/20251027154228_272876c0aee6df96fd8ff33ed42824de.png)

最后在客户端导入 props 即可：

```JSX
import { StrictMode } from 'react'
import './index.css'
import App from './App.jsx'
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(document.getElementById('root'),
    <StrictMode>
        <App {...window.__INITIAL_PROPS__} />
    </StrictMode>,
)
```


## Prerender 服务

Prerender 是一个节点服务器，它使用 Headless Chrome 从任何网页中呈现 HTML、屏幕截图、PDF 和 HAR 文件。Prerender 服务器侦听 HTTP 请求，获取 URL 并将其加载到 Headless Chrome 中，等待网络空闲，然后返回您的内容。

> https://github.com/prerender/prerender

具体做法可以参照以上官方文档，实际原理就是客户和 Spider 访问服务器，会经过 Nginx 等中间件的请求转发。如果是客户访问，直接转发到 Node 服务，页面上的数据是经过 CSR 方式主动请求得到的。如果是 Spider 访问，会通过请求的转发得到真实数据，这种情况兼顾了用户体验并且增强了 SEO 能力。