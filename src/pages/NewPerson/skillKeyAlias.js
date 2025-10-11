// 集中维护：职业映射中使用的泛用/旧称/占位技能key到实际技能key的别名
// 注意：若新增技能或重命名，请在此处维护映射关系
const skillKeyAlias = {
  // 通用/基础技能别名
  credit: 'creditRating',
  firstaid: 'firstAid',
  first_aid: 'firstAid',
  sleight: 'sleightOfHand',
  sleightHand: 'sleightOfHand',
  lipreading: 'lipReading',
  heavyMachinery: 'operateHeavyMachinery',
  drive: 'driveAuto',
  throwing: 'throw',
  climbIng: 'climb',
  swimming: 'swim',
  tracking: 'track',
  fighting: 'fighting1',
  firearms: 'firearms1',
  languageOther: 'language2', // 其他外语 -> 默认日语
  ownLanguage: 'nativeLanguage',
  science: 'science1', // 泛指科学 -> 地质学
  scienceBio: 'science3', // 生物学
  scienceBiology: 'science3',
  sciencePharmacy: 'science7', // 药学
  scienceChemistry: 'science2', // 化学
  scienceEngineering: 'science11', // 工程学
  sciencePhysics: 'science6', // 物理
  scienceForensics: 'science13', // 司法科学
  scienceAnimal: 'science9', // 动物学
  operateHeavy: 'operateHeavyMachinery',
  handleAnimal: 'animalHandling',
  artCraft: 'artCraft2', // 泛用技艺 -> 美术
  artCraftPerformance: 'artCraft1', // 表演
  artCraftPhotography: 'artCraft3', // 摄影
  artCraftDrafting: 'artCraft18', // 制图
  artCraftFarming: 'artCraft17', // 耕作
  artCraftMusic: 'artCraft7', // 音乐
  artCraftGolf: 'artCraft2', // 高尔夫暂映射
  artCraftTennis: 'artCraft2', // 网球暂映射为美术
  artCraftDance: 'artCraft11', // 舞蹈
  artCraftCooking: 'artCraft8', // 厨艺
  artCraftLiterature: 'artCraft5', // 写作/文学
  artPerformance: 'artCraft1',
  acting: 'artCraft1',
  performance: 'artCraft1',
  photography: 'artCraft3',
  drafting: 'artCraft18',
  farming: 'artCraft17',
  music: 'artCraft7',
  dance: 'artCraft11',
  cooking: 'artCraft8',
  literature: 'artCraft5',
  writing: 'artCraft5',
  painting: 'artCraft2',
  calligraphy: 'artCraft6',
  hairdressing: 'artCraft9',
  carpentry: 'artCraft10',
  morrisDance: 'artCraft12',
  opera: 'artCraft13',
  pottery: 'artCraft15',
  sculpture: 'artCraft16',
  typing: 'artCraft19',
  shorthand: 'artCraft20',
  pilotBoat: 'navigate', // 缺少 pilot，临时用导航
  pilot: 'navigate',
  biology: 'science3',
  chemistry: 'science2',
  leadership: 'charm', // 无单独领导力，用魅惑代替
  theology: 'occult', // 暂用神秘学
  languageLatin: 'language11', // 拉丁语
  psychology: 'psychology', // 占位，确保存在
  computerUse: 'libraryUse', // 暂时映射，无 computerUse 技能
  survival: 'survival', // 占位
  appraise: 'appraisal', // 一致化
  appraisal: 'appraisal',

  // 科学类英文别名（对应 scienceX）
  geology: 'science1',
  mathematics: 'science4',
  math: 'science4',
  astronomy: 'science5',
  physics: 'science6',
  pharmacy: 'science7',
  botany: 'science8',
  zoology: 'science9',
  cryptography: 'science10',
  engineering: 'science11',
  meteorology: 'science12',
  forensics: 'science13',
  forensicScience: 'science13',

  // 格斗类英文别名（对应 fightingX）
  brawl: 'fighting1',
  whip: 'fighting2',
  chainsaw: 'fighting3',
  axe: 'fighting4',
  sword: 'fighting5',
  garrote: 'fighting6',
  flail: 'fighting7',
  spear: 'fighting8',

  // 射击类英文别名（对应 firearmsX）
  rifle: 'firearms1',
  shotgun: 'firearms1',
  smg: 'firearms2',
  bow: 'firearms3',
  flamethrower: 'firearms4',
  machineGun: 'firearms5',
  handgun: 'firearms6',
  heavyWeapons: 'firearms7',

  // 语言别名（对应 languageX / nativeLanguage）
  english: 'nativeLanguage',
  chinese: 'language1',
  mandarin: 'language1',
  japanese: 'language2',
  korean: 'language3',
  russian: 'language4',
  spanish: 'language5',
  french: 'language6',
  german: 'language7',
  italian: 'language8',
  portuguese: 'language9',
  arabic: 'language10',
  latin: 'language11'
};

export default skillKeyAlias;
