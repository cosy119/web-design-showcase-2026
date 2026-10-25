/* 二十四节气静态数据 —— 仅数据，不含逻辑 */
window.SOLAR_TERMS = [
  {
    no: 1, name: '立春', py: 'Lì Chūn', en: 'Beginning of Spring',
    date: '02-04', longitude: 315, season: 'spring',
    phenology: ['东风解冻', '蛰虫始振', '鱼陟负冰'],
    line: '冰消一寸，春生一分', custom: '咬春、打春牛',
    color: '#7C9473', colorName: '苍筤'
  },
  {
    no: 2, name: '雨水', py: 'Yǔ Shuǐ', en: 'Rain Water',
    date: '02-19', longitude: 330, season: 'spring',
    phenology: ['獭祭鱼', '候雁北', '草木萌动'],
    line: '天一生水，润物无声', custom: '回娘屋、拉保保',
    color: '#6E8F8A', colorName: '水绿'
  },
  {
    no: 3, name: '惊蛰', py: 'Jīng Zhé', en: 'Awakening of Insects',
    date: '03-05', longitude: 345, season: 'spring',
    phenology: ['桃始华', '仓庚鸣', '鹰化为鸠'],
    line: '一雷惊蛰，万物抬头', custom: '吃梨、祭白虎',
    color: '#8A9A5B', colorName: '柳芽'
  },
  {
    no: 4, name: '春分', py: 'Chūn Fēn', en: 'Spring Equinox',
    date: '03-20', longitude: 0, season: 'spring',
    phenology: ['玄鸟至', '雷乃发声', '始电'],
    line: '昼夜均分，春色平分', custom: '竖蛋、放风筝',
    color: '#A3A56A', colorName: '缃叶'
  },
  {
    no: 5, name: '清明', py: 'Qīng Míng', en: 'Pure Brightness',
    date: '04-05', longitude: 15, season: 'spring',
    phenology: ['桐始华', '田鼠化为鴽', '虹始见'],
    line: '气清景明，万物皆显', custom: '扫墓、踏青',
    color: '#93A98C', colorName: '青玉'
  },
  {
    no: 6, name: '谷雨', py: 'Gǔ Yǔ', en: 'Grain Rain',
    date: '04-20', longitude: 30, season: 'spring',
    phenology: ['萍始生', '鸣鸠拂其羽', '戴胜降于桑'],
    line: '雨生百谷，春事将阑', custom: '赏牡丹、喝谷雨茶',
    color: '#A8A46F', colorName: '谷黄'
  },
  {
    no: 7, name: '立夏', py: 'Lì Xià', en: 'Beginning of Summer',
    date: '05-05', longitude: 45, season: 'summer',
    phenology: ['蝼蝈鸣', '蚯蚓出', '王瓜生'],
    line: '绿肥红瘦，夏木成阴', custom: '称人、斗蛋',
    color: '#3E7F6E', colorName: '石绿'
  },
  {
    no: 8, name: '小满', py: 'Xiǎo Mǎn', en: 'Grain Buds',
    date: '05-21', longitude: 60, season: 'summer',
    phenology: ['苦菜秀', '靡草死', '麦秋至'],
    line: '麦气初盈，将满未满', custom: '祭车神、吃苦菜',
    color: '#6E9A66', colorName: '麦绿'
  },
  {
    no: 9, name: '芒种', py: 'Máng Zhòng', en: 'Grain in Ear',
    date: '06-05', longitude: 75, season: 'summer',
    phenology: ['螳螂生', '鵙始鸣', '反舌无声'],
    line: '有芒之种，忙收忙种', custom: '送花神、煮梅',
    color: '#B08A3E', colorName: '麦黄'
  },
  {
    no: 10, name: '夏至', py: 'Xià Zhì', en: 'Summer Solstice',
    date: '06-21', longitude: 90, season: 'summer',
    phenology: ['鹿角解', '蜩始鸣', '半夏生'],
    line: '日长至，影短至', custom: '吃夏至面、消暑',
    color: '#20696E', colorName: '石青'
  },
  {
    no: 11, name: '小暑', py: 'Xiǎo Shǔ', en: 'Minor Heat',
    date: '07-07', longitude: 105, season: 'summer',
    phenology: ['温风至', '蟋蟀居壁', '鹰始鸷'],
    line: '温风至，蟋蟀居壁', custom: '食新、晒书画',
    color: '#C08040', colorName: '琥珀'
  },
  {
    no: 12, name: '大暑', py: 'Dà Shǔ', en: 'Major Heat',
    date: '07-23', longitude: 120, season: 'summer',
    phenology: ['腐草为萤', '土润溽暑', '大雨时行'],
    line: '腐草为萤，大雨时行', custom: '饮伏茶、送大暑船',
    color: '#B34A34', colorName: '朱砂'
  },
  {
    no: 13, name: '立秋', py: 'Lì Qiū', en: 'Beginning of Autumn',
    date: '08-07', longitude: 135, season: 'autumn',
    phenology: ['凉风至', '白露降', '寒蝉鸣'],
    line: '凉风有信，一叶知秋', custom: '贴秋膘、啃秋',
    color: '#9C8B4E', colorName: '秋香'
  },
  {
    no: 14, name: '处暑', py: 'Chǔ Shǔ', en: 'End of Heat',
    date: '08-23', longitude: 150, season: 'autumn',
    phenology: ['鹰乃祭鸟', '天地始肃', '禾乃登'],
    line: '暑气至此，禾乃登场', custom: '放河灯、吃鸭子',
    color: '#A8874A', colorName: '赭石'
  },
  {
    no: 15, name: '白露', py: 'Bái Lù', en: 'White Dew',
    date: '09-07', longitude: 165, season: 'autumn',
    phenology: ['鸿雁来', '玄鸟归', '群鸟养羞'],
    line: '露凝而白，鸿雁南飞', custom: '收清露、饮白露茶',
    color: '#8FA3A8', colorName: '月白'
  },
  {
    no: 16, name: '秋分', py: 'Qiū Fēn', en: 'Autumn Equinox',
    date: '09-23', longitude: 180, season: 'autumn',
    phenology: ['雷始收声', '蛰虫坯户', '水始涸'],
    line: '雷收声，虫坯户', custom: '祭月、吃秋菜',
    color: '#C2A25A', colorName: '藤黄'
  },
  {
    no: 17, name: '寒露', py: 'Hán Lù', en: 'Cold Dew',
    date: '10-08', longitude: 195, season: 'autumn',
    phenology: ['鸿雁来宾', '雀入大水为蛤', '菊有黄华'],
    line: '露气寒冷，将凝为霜', custom: '登高、赏菊',
    color: '#9A7B4F', colorName: '秋褐'
  },
  {
    no: 18, name: '霜降', py: 'Shuāng Jiàng', en: "Frost's Descent",
    date: '10-23', longitude: 210, season: 'autumn',
    phenology: ['豺乃祭兽', '草木黄落', '蛰虫咸俯'],
    line: '草木黄落，霜华满天', custom: '赏红叶、吃柿子',
    color: '#A05B33', colorName: '柿红'
  },
  {
    no: 19, name: '立冬', py: 'Lì Dōng', en: 'Beginning of Winter',
    date: '11-07', longitude: 225, season: 'winter',
    phenology: ['水始冰', '地始冻', '雉入大水为蜃'],
    line: '水始冰，地始冻', custom: '吃饺子、补冬',
    color: '#5C7180', colorName: '远山黛'
  },
  {
    no: 20, name: '小雪', py: 'Xiǎo Xuě', en: 'Minor Snow',
    date: '11-22', longitude: 240, season: 'winter',
    phenology: ['虹藏不见', '天气上升地气下降', '闭塞而成冬'],
    line: '虹藏不见，天地闭塞', custom: '腌腊肉、吃糍粑',
    color: '#6E8492', colorName: '灰蓝'
  },
  {
    no: 21, name: '大雪', py: 'Dà Xuě', en: 'Major Snow',
    date: '12-07', longitude: 255, season: 'winter',
    phenology: ['鹖鴠不鸣', '虎始交', '荔挺出'],
    line: '雪盛此时，万籁俱寂', custom: '赏雪、腌肉',
    color: '#7C93A6', colorName: '雪青'
  },
  {
    no: 22, name: '冬至', py: 'Dōng Zhì', en: 'Winter Solstice',
    date: '12-21', longitude: 270, season: 'winter',
    phenology: ['蚯蚓结', '麋角解', '水泉动'],
    line: '日短至，阳气生', custom: '吃饺子、数九',
    color: '#4C6472', colorName: '玄青'
  },
  {
    no: 23, name: '小寒', py: 'Xiǎo Hán', en: 'Minor Cold',
    date: '01-05', longitude: 285, season: 'winter',
    phenology: ['雁北乡', '鹊始巢', '雉始雊'],
    line: '雁北乡，鹊始巢', custom: '探梅、吃腊八粥',
    color: '#566B78', colorName: '黛蓝'
  },
  {
    no: 24, name: '大寒', py: 'Dà Hán', en: 'Major Cold',
    date: '01-20', longitude: 300, season: 'winter',
    phenology: ['鸡始乳', '征鸟厉疾', '水泽腹坚'],
    line: '岁末天寒，静待春归', custom: '除尘、尾牙祭',
    color: '#3F545F', colorName: '墨蓝'
  }
];

window.SEASONS = {
  spring: {
    key: 'spring', name: '春', num: '壹', en: 'SPRING', span: '立春 — 谷雨',
    poem: '律回岁晚冰霜少，春到人间草木知', poet: '张栻《立春偶成》',
    note: '风从东来，冰面裂开第一道缝；草木不说话，只把绿意递上来。',
    color: '#6F8F6A'
  },
  summer: {
    key: 'summer', name: '夏', num: '贰', en: 'SUMMER', span: '立夏 — 大暑',
    poem: '绿树阴浓夏日长，楼台倒影入池塘', poet: '高骈《山亭夏日》',
    note: '日头把影子压到最短，蝉声把午后拉得很长，万物都在用力生长。',
    color: '#20696E'
  },
  autumn: {
    key: 'autumn', name: '秋', num: '叁', en: 'AUTUMN', span: '立秋 — 霜降',
    poem: '云天收夏色，木叶动秋声', poet: '刘禹锡《始闻秋风》',
    note: '一场雨凉一层，稻穗低头，霜把山野的叶子一寸寸染红。',
    color: '#A56B32'
  },
  winter: {
    key: 'winter', name: '冬', num: '肆', en: 'WINTER', span: '立冬 — 大寒',
    poem: '晚来天欲雪，能饮一杯无', poet: '白居易《问刘十九》',
    note: '万物收藏，雪落无声，炉火替太阳守着人间。',
    color: '#5C7180'
  }
};
