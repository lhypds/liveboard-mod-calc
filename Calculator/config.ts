export const config = {
  i: "Calculator",
  title: { en: "Calculator", ja: "電卓", zh: "计算器" },
  refreshAgeMinutes: 0,
  info: [
    {
      title: { en: "About", ja: "概要", zh: "说明" },
      items: [
        {
          key: { en: "Design", ja: "デザイン", zh: "设计" },
          value: {
            en: "Replica of the 1984 Macintosh Calculator, designed by Steve Jobs with the Calculator Construction Set",
            ja: "1984年初代Macintoshの電卓の再現。スティーブ・ジョブズがCalculator Construction Setでデザイン",
            zh: "复刻1984年初代Macintosh计算器，乔布斯用Calculator Construction Set亲自设计",
          },
        },
        {
          key: { en: "Keys", ja: "キー", zh: "按键" },
          value: {
            en: "C clears, E enters an exponent (5 E 3 = 5000)",
            ja: "Cはクリア、Eは指数入力（5 E 3 = 5000）",
            zh: "C 清除，E 输入指数（5 E 3 = 5000）",
          },
        },
        {
          key: { en: "Style", ja: "スタイル", zh: "样式" },
          value: {
            en: "comp.steveJobs: true = classic 1984 Mac look, false = plain style with the same layout",
            ja: "comp.steveJobs: true = 1984年Macのクラシック外観、false = 同じ配列のプレーン表示",
            zh: "comp.steveJobs：true = 1984年Mac经典外观，false = 同布局的朴素样式",
          },
        },
        {
          key: { en: "Keyboard", ja: "キーボード", zh: "键盘" },
          value: {
            en: "Click the calculator first; digits, + - * /, Enter (=), Esc (C), E, Backspace",
            ja: "電卓をクリックしてから入力。数字、+ - * /、Enter（=）、Esc（C）、E、Backspace",
            zh: "先点击计算器再输入：数字、+ - * /、Enter（=）、Esc（C）、E、退格",
          },
        },
      ],
    },
  ],
  x: 0,
  y: 0,
  w: 12,
  h: 17,
  minW: 12,
  minH: 17,
  comp: {
    // true = classic 1984 Mac style, false = plain style with the same layout
    steveJobs: false,
  },
};
