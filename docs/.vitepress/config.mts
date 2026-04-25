import { defineConfig } from "vitepress";
import { AnnouncementPlugin } from "vitepress-plugin-announcement";
import { type RSSOptions, RssPlugin } from "vitepress-plugin-rss";
import { SponsorPlugin } from "vitepress-plugin-sponsor";
import { blogTheme } from "./blog-theme";
import { nav } from "./configs/nav";
import sidebar from "./configs/sidebar.json";

const baseUrl = "https://blog.wkndnite-tech.cn";
const RSS: RSSOptions = {
  title: "岛屿开发录",
  baseUrl,
  copyright: "MIT License | 岛屿开发录",
};

export default defineConfig({
  cleanUrls: true,
  markdown: {
    math: true,
    image: {
      lazyLoading: true,
    },
    lineNumbers: true,
    container: {
      tipLabel: "提示",
      warningLabel: "警告",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
    theme: { light: "one-light", dark: "dracula" },
    codeCopyButtonTitle: "复制代码",
  },
  ignoreDeadLinks: [
    // 秋招 index.md 里的
    /^\.\/(25\d{4}|26)[a-zA-Z0-9]+$/,
  ],
  extends: blogTheme,
  lang: "en",
  title: "岛屿开发录",
  description: "宁鸣而死 不默而生",
  lastUpdated: true,
  head: [
    [
      "meta",
      {
        name: "baidu-site-verification",
        content: "codeva-CxRAHCK2KM",
      },
    ],
    [
      "script",
      {
        src: "//sdk.51.la/js-sdk-pro.min.js",
        charset: "UTF-8",
        id: "LA_COLLECT",
      },
    ],
    ["script", {}, 'LA.init({id:"3PjhFFYrwb9tbOZK",ck:"3PjhFFYrwb9tbOZK",autoTrack:true,hashMode:true,screenRecord:true})'],
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-095CYQ2P6C",
      },
    ],
    [
      "script",
      {},
      `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-095CYQ2P6C');
    `,
    ],
    ["link", { rel: "icon", href: "/svg/logo.svg" }],
  ],
  themeConfig: {
    outline: {
      level: [2, 3],
      label: "目录",
    },
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "相关文章",
    lastUpdatedText: "上次更新于",

    logo: "/svg/logo.svg",
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Wkndnite",
      },
    ],
    nav: nav,
    sidebar: sidebar,
  },
  vite: {
    resolve: {
      alias: {
        "@": "/docs",
      },
    },
    ssr: {
      noExternal: ["dayjs"],
    },
    plugins: [
      RssPlugin(RSS),
      SponsorPlugin({
        type: "simple",
        aliPayQR: "/aliPayQR.jpg",
        weChatQR: "/weChatPayQR.jpg",
      }),
      AnnouncementPlugin({
        title: "公告",
        body: [
          { type: "text", content: "👇 微信 👇" },
          {
            type: "image",
            src: "/wechat.png",
          },
          {
            type: "text",
            content: "欢迎私信交流",
          },
        ],
        duration: -1,
        twinkle: true,
        mobileMinify: true,
      }),
    ],
  },
});
