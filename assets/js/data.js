/* ==========================================================================
   NKAA 站点数据
   改这个文件就能加照片、加活动、改每月天象，不用动 index.html
   ========================================================================== */

window.NKAA = {

  /* ---------------------------------------------------------------
     画廊
     加一张照片 = 把图放进 assets/img/gallery/，再在下面加一段：
       { src: "assets/img/gallery/15-xxx.jpg", w: 1600, h: 1067,
         title: "标题", date: "2026.12", place: "地点",
         event: "活动名", author: "拍摄人" }
     不知道的字段留空字符串（""），页面上会自动不显示那一行。
     越靠前越先显示。
     --------------------------------------------------------------- */
  gallery: [
    {
      src: "assets/img/gallery/01-milkyway.jpg", kind: "astro", w: 1600, h: 1067,
      title: "银河与流星",
      date: "2023.07",
      place: "",
      event: "",
      author: ""
    },
    {
      src: "assets/img/gallery/02-horsehead.jpg", kind: "astro", w: 1600, h: 1366,
      title: "马头星云",
      date: "",
      place: "",
      event: "深空摄影",
      author: ""
    },
    {
      src: "assets/img/gallery/03-startrail.jpg", kind: "astro", w: 1600, h: 1067,
      title: "星轨",
      date: "2026.10",
      place: "兴隆观测站",
      event: "国家天文台兴隆观测站研学",
      author: ""
    },
    {
      src: "assets/img/gallery/04-eclipse-moon.jpg", kind: "astro", w: 1217, h: 906,
      title: "月全食",
      date: "2025.09",
      place: "",
      event: "月全食观测",
      author: ""
    },
    {
      src: "assets/img/gallery/05-xinglong.jpg", kind: "event", w: 1600, h: 1067,
      title: "兴隆观测站",
      date: "2026.10",
      place: "国家天文台兴隆观测站",
      event: "兴隆观测站研学",
      author: ""
    },
    {
      src: "assets/img/gallery/06-lakeside.jpg", kind: "event", w: 1600, h: 1200,
      title: "湖畔观测",
      date: "2025.03.05",
      place: "八里台校区",
      event: "月掩昴星团观测",
      author: ""
    },
    {
      src: "assets/img/gallery/07-milkyway-portrait.jpg", kind: "astro", w: 1050, h: 1400,
      title: "夏季银河",
      date: "2025.05",
      place: "",
      event: "银河观测",
      author: ""
    },
    {
      src: "assets/img/gallery/08-group.jpg", kind: "event", w: 1600, h: 1066,
      title: "野外观测合影",
      date: "2024.10",
      place: "",
      event: "野外观测",
      author: ""
    },
    {
      src: "assets/img/gallery/09-midautumn.jpg", kind: "event", w: 1600, h: 1067,
      title: "中秋赏月",
      date: "2026.09.25",
      place: "八里台校区",
      event: "中秋赏月活动",
      author: ""
    },
    {
      src: "assets/img/gallery/10-quiz.jpg", kind: "event", w: 1600, h: 1200,
      title: "知识竞赛现场",
      date: "2025.11.09",
      place: "八里台校区 学生活动中心",
      event: "第二十五届天津市大学生天文节",
      author: ""
    },
    {
      src: "assets/img/gallery/11-telescope-contest.jpg", kind: "event", w: 1600, h: 1200,
      title: "望远镜观测赛",
      date: "2025.11.09",
      place: "八里台校区",
      event: "第二十五届天文知识竞赛",
      author: ""
    },
    {
      src: "assets/img/gallery/12-recruit.jpg", kind: "event", w: 1600, h: 899,
      title: "招新摊位",
      date: "2025.09",
      place: "八里台校区",
      event: "秋季招新",
      author: ""
    },
    {
      src: "assets/img/gallery/13-class.jpg", kind: "event", w: 1600, h: 900,
      title: "社课合影",
      date: "2026.03.29",
      place: "",
      event: "探索中国古代星空 主题团日",
      author: ""
    },
    {
      src: "assets/img/gallery/14-xinglong-group.jpg", kind: "event", w: 1600, h: 1067,
      title: "兴隆合影",
      date: "2026.10.05",
      place: "国家天文台兴隆观测站",
      event: "兴隆观测站研学",
      author: ""
    },
    {
      src: "assets/img/gallery/15-school.jpg", kind: "event", w: 1600, h: 1199,
      title: "小学天文课",
      date: "2025",
      place: "南开附小",
      event: "科普进校园",
      author: ""
    }
  ],

  /* ---------------------------------------------------------------
     近期活动（大字列表，点标题展开详情）
     date 显示在左边，detail 和 meta 是展开后的内容
     --------------------------------------------------------------- */
  upcoming: [
    {
      date: "11.09",
      tag: "筹备中",
      title: "第二十六届天津市大学生天文节 · 天文知识竞赛",
      detail: "由天津市天文学会、天津市科技馆主办，南开大学天文协会承办。四轮答题加望远镜观测比赛，天津各高校的天文社团都参加。比赛对全校开放观赛。",
      meta: [
        ["时间", "2026 年 11 月 9 日 14:30 至 17:30"],
        ["地点", "八里台校区 学生活动中心 1F 多功能厅"],
        ["赛制", "个人必答、小组必答、抢答、选择性答题，加望远镜观测赛"],
        ["参赛", "天津大学、天津师大、河北工大、天津城建、天津中医药、天津体育学院等"]
      ]
    },
    {
      date: "11.17",
      tag: "天象",
      title: "狮子座流星雨极大",
      detail: "母体是坦普尔—塔特尔彗星。流量不算大，但每年都可能出现明亮的火流星，值得在寒夜里守一守。",
      meta: [
        ["时间", "11 月 17 日前后，凌晨 2 点后最好"],
        ["建议", "离开市区灯光，找一片开阔的地面躺下来"]
      ]
    },
    {
      date: "11.24",
      tag: "天象",
      title: "超级月亮",
      detail: "满月与近地点几乎重合，月亮看起来比平时更大更亮。用望远镜看月球环形山，是最好的入门观测。",
      meta: [
        ["时间", "11 月 24 日傍晚月出之后"],
        ["地点", "校园里就行，湖边视野最好"]
      ]
    },
    { date: "本月", tag: "星空", sky: true }
  ],

  /* ---------------------------------------------------------------
     活动卡片的详情（点开卡片后弹出来的内容）
     key 对应 index.html 里卡片的 data-act
     --------------------------------------------------------------- */
  details: {
    festival: {
      detail: "天津市大学生天文节从 1999 年办到现在，由天津市天文学会、天津市科技馆组织，各高校天文社团轮流承办。开幕式、野外观测、天文知识竞赛、闭幕式贯穿 11 月到 12 月。",
      more: "南开天协是承办方之一。2025 年承办了天文知识竞赛，拿到一等奖和优秀社团奖，也为协会争取到了闭幕式的承办资格。",
      photos: ["assets/img/gallery/10-quiz.jpg", "assets/img/gallery/11-telescope-contest.jpg"]
    },
    sidewalk: {
      detail: "天晴的周末，把望远镜架到八里台新开湖西岸，或者津南的大草原。月球、木星、土星、猎户座大星云是常客。",
      more: "不用报名，排队就能看。路过的人问什么我们都答，从「那是星星还是飞机」到「黑洞会不会把地球吸进去」。",
      photos: ["assets/img/gallery/09-midautumn.jpg", "assets/img/gallery/06-lakeside.jpg"]
    },
    meteor: {
      detail: "英仙、双子、狮子、猎户、天琴，一年五场。市郊集合，包车出发，器材、保险和应急预案都提前安排好。",
      more: "凌晨最冷的时候，总有人裹着睡袋躺在防潮垫上不肯走。运气好的年份，一小时能看到三四十颗。",
      photos: ["assets/img/gallery/01-milkyway.jpg", "assets/img/gallery/08-group.jpg"]
    },
    xinglong: {
      detail: "国家天文台兴隆观测站。看 2.16 米望远镜怎么工作，听站里的老师讲正在做的研究，晚上在站区看星星。",
      more: "每学期一次，名额有限，报名要抢。山上的夜空比市区暗得多，银河是直接铺在头顶的。",
      photos: ["assets/img/gallery/05-xinglong.jpg", "assets/img/gallery/14-xinglong-group.jpg", "assets/img/gallery/03-startrail.jpg"]
    },
    talks: {
      detail: "请天文领域的研究者，也请协会里的师兄师姐来讲。题目从恒星演化、天体化学到天文摄影的后期处理。",
      more: "苏宜教授编的《天文学新概论》是协会的入门书，资料室可以借。听完课第二天晚上常常就跟一次观测。",
      photos: ["assets/img/gallery/13-class.jpg"]
    },
    outreach: {
      detail: "去中小学上课，把望远镜和天文课一起带过去。",
      more: "也参加天津市科技馆的全国科普月和社区观测。讲一节课、带一次观测，志愿时长也有了。",
      photos: ["assets/img/gallery/15-school.jpg"]
    }
  },

  /* ---------------------------------------------------------------
     活动足迹（倒序，最新的放最前）
     加一条 = 复制一段改内容
     --------------------------------------------------------------- */
  journey: [
    { time: "2026.10", title: "兴隆观测站研学、迎新会", note: "在兴隆看了一整夜", detail: "四十多人一起上了兴隆。白天看 2.16 米望远镜和展厅，晚上在站区铺开防潮垫躺了一夜。回程车上有人睡着了，有人还在数流星。", photos: ["assets/img/gallery/05-xinglong.jpg", "assets/img/gallery/14-xinglong-group.jpg"] },
    { time: "2026.09", title: "中秋赏月、科技馆全国科普月", note: "八里台和津南同时出摊", detail: "中秋当晚两个校区一起出摊，排队的人从湖边一直排到路灯下面。有人第一次看清月球环形山，盯着目镜看了快十分钟。", photos: ["assets/img/gallery/09-midautumn.jpg", "assets/img/gallery/06-lakeside.jpg"] },
    { time: "2026.05", title: "三十周年庆典", note: "侯自新校长、苏宜教授和国家天文台嘉宾到场", detail: "侯自新校长、沈亚平老师、苏宜教授和国家天文台的嘉宾都来了。放了一部协会自己剪的片子，几十届的人坐在同一间屋子里。", photos: ["assets/img/gallery/13-class.jpg"] },
    { time: "2026.03", title: "探索古代星空主题团日社课", note: "从星官讲到二十八宿" },
    { time: "2026.03", title: "元宵月食观测", note: "红月亮挂在天上" },
    { time: "2025.11", title: "第二十五届天文节、知识竞赛", note: "承办赛事，获一等奖和优秀社团奖", detail: "四轮擂台加望远镜观测赛，最后拿了一等奖和优秀社团奖，也为协会争到了闭幕式的承办资格。", photos: ["assets/img/gallery/10-quiz.jpg", "assets/img/gallery/11-telescope-contest.jpg"] },
    { time: "2025.11", title: "天体化学科普讲座", note: "请来天体化学方向的研究者" },
    { time: "2025.10", title: "兴隆观测站观星", note: "第一次在专业台站过夜" },
    { time: "2025.09", title: "月全食、土星冲日、招新", note: "一整个九月都在看天", detail: "一个月里连着三件事：月全食、土星冲日、招新。招新那天摆了一桌子星球模型，报名表写满了两张。", photos: ["assets/img/gallery/04-eclipse-moon.jpg", "assets/img/gallery/12-recruit.jpg"] },
    { time: "2025.08", title: "英仙座流星雨、红外银河拍摄", note: "市郊暗空，通宵", detail: "英仙座流星雨，市郊通宵。凌晨三点最冷的时候，还有人裹着睡袋躺在防潮垫上不肯走。", photos: ["assets/img/gallery/01-milkyway.jpg", "assets/img/gallery/08-group.jpg"] },
    { time: "2025.05", title: "梅西耶马拉松、银河观测", note: "一夜找 110 个深空天体" },
    { time: "2025.03", title: "月掩昴星团、中国古代星空团日", note: "重启后的第一场活动" }
  ],

  /* ---------------------------------------------------------------
     每月星空提示：key 为月份 1-12
     --------------------------------------------------------------- */
  skyNotes: {
    1:  ["象限仪座流星雨", "极大通常出现在 1 月 3 到 4 日，流量大但峰值窄。冬夜冷，记得带热饮。", "METEOR"],
    2:  ["猎户座的季节", "冬季六边形整夜高悬，猎户座腰带三星最好认。用双筒指向腰带下方，那就是 M42 大星云。", "DEEP SKY"],
    3:  ["梅西耶马拉松", "三月底的夜晚可以在一夜之内找齐 110 个梅西耶天体，是天文爱好者最经典的挑战。", "MARATHON"],
    4:  ["天琴座流星雨", "极大在 4 月 21 到 22 日前后，流量不大，但偶有明亮火流星。", "METEOR"],
    5:  ["宝瓶座 η 流星雨", "极大在 5 月 5 到 6 日黎明前，母体是哈雷彗星。春季大三角正在天顶。", "METEOR"],
    6:  ["银河初升", "夏至前后，银河中心在人马座、天蝎座之间升起，心宿二是这个季节最红的亮星。", "MILKY WAY"],
    7:  ["宝瓶座 δ 南流星雨", "7 月底达到极大，与摩羯座 α 流星雨同期，整夜都有机会。", "METEOR"],
    8:  ["英仙座流星雨", "8 月 12 到 13 日前后，年度最稳定的流星雨之一。离开城市灯光，躺下用肉眼等就好。", "METEOR"],
    9:  ["秋分与飞马座", "飞马座大四边形在头顶，往仙女座方向，肉眼就能看到 M31 仙女座星系。", "GALAXY"],
    10: ["猎户座流星雨", "极大在 10 月 21 日前后，同样来自哈雷彗星。秋夜晴朗时每小时能看十几颗。", "METEOR"],
    11: ["狮子座流星雨", "11 月 17 到 18 日前后，历史上出现过壮观的流星暴。这也是天文节举办的时候。", "METEOR"],
    12: ["双子座流星雨", "12 月 13 到 14 日前后，年度流量最大、最稳定的一场。这是冬天最好的理由。", "METEOR"]
  }
};
