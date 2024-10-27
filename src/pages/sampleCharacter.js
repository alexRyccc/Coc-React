const sampleCharacters = [
    {
    name: "罗铭志",
    class: 'Ranger',
    level: 5,
    profession: "侦探",
    age: 35,
    gender: "male",
    currentResidence: "纽约",
    birthplace: "波士顿",
    str: 70,
    con: 60,
    dex: 65,
    app: 50,
    pow: 55,
    siz: 75,
    int: 80,
    edu: 85,
    hp: 12,
    mp: 11,
    san: 60,
    luck: 50,
    moveRate: 8,
    skills: {
      creditRating: { initial: 9, current: 39 },
      accounting: { initial: 30, current: 30 },
      anthropology: { initial: 1, current: 1 },
      appraisal: { initial: 5, current: 25 },
      archaeology: { initial: 1, current: 16 },
      climb: { initial: 20, current: 35 },
      disguise: { initial: 24, current: 34 },
      dodge: { initial: 29, current: 39 },
      driveAuto: { initial: 20, current: 20 },
      electricalRepair: { initial: 10, current: 10 },
      firstAid: { initial: 30, current: 30 },
      history: { initial: 20, current: 20 },
      jump: { initial: 20, current: 20 },
      nativeLanguage: { initial: 74, current: 74 },
      law: { initial: 5, current: 5 },
      libraryUse: { initial: 20, current: 20 },
      listen: { initial: 20, current: 20 },
      locksmith: { initial: 1, current: 1 },
      mechanicalRepair: { initial: 10, current: 10 },
      medicine: { initial: 1, current: 1 },
      naturalWorld: { initial: 10, current: 10 },
      navigate: { initial: 10, current: 10 },
      occult: { initial: 5, current: 5 },
      operateHeavyMachinery: { initial: 1, current: 6 },
      psychoanalysis: { initial: 1, current: 36 },
      psychology: { initial: 70, current: 70 },
      ride: { initial: 5, current: 5 },
      sleightOfHand: { initial: 10, current: 10 },
      spotHidden: { initial: 25, current: 25 },
      stealth: { initial: 20, current: 20 },
      swim: { initial: 20, current: 20 },
      throw: { initial: 20, current: 20 },
      track: { initial: 10, current: 10 },
      charm: { initial: 55, current: 55 },
      intimidate: { initial: 15, current: 15 },
      fastTalk: { initial: 5, current: 5 },
      persuade: { initial: 40, current: 40 },
      artCraft1: { initial: 15, current: 15 },
      artCraft2: { initial: 5, current: 5 },
      artCraft3: { initial: 5, current: 5 },
      artCraft4: { initial: 5, current: 5 },
      artCraft5: { initial: 5, current: 5 },
      artCraft6: { initial: 5, current: 5 },
      artCraft7: { initial: 5, current: 5 },
      artCraft8: { initial: 5, current: 5 },
      artCraft9: { initial: 5, current: 5 },
      artCraft10: { initial: 5, current: 5 },
      artCraft11: { initial: 5, current: 5 },
      artCraft12: { initial: 5, current: 5 },
      artCraft13: { initial: 5, current: 5 },
      artCraft14: { initial: 5, current: 5 },
      artCraft15: { initial: 5, current: 5 },
      artCraft16: { initial: 5, current: 5 },
      artCraft17: { initial: 5, current: 5 },
      artCraft18: { initial: 5, current: 5 },
      artCraft19: { initial: 5, current: 5 },
      artCraft20: { initial: 5, current: 5 },
      science1: { initial: 1, current: 1 },
      science2: { initial: 1, current: 1 },
      science3: { initial: 1, current: 1 },
      science4: { initial: 10, current: 10 },
      science5: { initial: 1, current: 1 },
      science6: { initial: 1, current: 1 },
      science7: { initial: 1, current: 1 },
      science8: { initial: 1, current: 1 },
      science9: { initial: 1, current: 1 },
      science10: { initial: 1, current: 1 },
      science11: { initial: 1, current: 1 },
      science12: { initial: 1, current: 1 },
      science13: { initial: 1, current: 1 },
      science14: { initial: 1, current: 1 },
      cthulhuMythos: { initial: 0, current: 0 },
      survival: { initial: 10, current: 10 },
      fighting1: { initial: 45, current: 45 },
      fighting2: { initial: 5, current: 5 },
      fighting3: { initial: 10, current: 10 },
      fighting4: { initial: 15, current: 15 },
      fighting5: { initial: 20, current: 20 },
      fighting6: { initial: 15, current: 15 },
      fighting7: { initial: 10, current: 10 },
      fighting8: { initial: 20, current: 20 },
      firearms1: { initial: 25, current: 25 },
      firearms2: { initial: 15, current: 15 },
      firearms3: { initial: 15, current: 15 },
      firearms4: { initial: 10, current: 10 },
      firearms5: { initial: 10, current: 10 },
      firearms6: { initial: 20, current: 20 },
      firearms7: { initial: 10, current: 10 },
      language1: { initial: 1, current: 1 },
      language2: { initial: 1, current: 1 },
      language3: { initial: 1, current: 1 },
      language4: { initial: 1, current: 1 },
      language5: { initial: 1, current: 1 },
      language6: { initial: 1, current: 1 },
      language7: { initial: 1, current: 1 },
      language8: { initial: 1, current: 1 },
      language9: { initial: 1, current: 1 },
      language10: { initial: 1, current: 1 },
      language11: { initial: 1, current: 1 },
      language12: { initial: 1, current: 1 },
      demolitions: { initial: 1, current: 1 },
      hypnosis: { initial: 1, current: 1 },
      lipReading: { initial: 1, current: 1 },
      artillery: { initial: 1, current: 1 },
      diving: { initial: 1, current: 1 },
      animalHandling: { initial: 5, current: 5 },
      custom1: { initial: 1, current: 1 },
      custom2: { initial: 1, current: 1 },
      custom3: { initial: 1, current: 1 },
      custom4: { initial: 1, current: 1 },
      custom5: { initial: 1, current: 1 }
    },
    weapons: [
      {
        name: "徒手格斗",
        successRate: 45,
        penetration: "无",
        damage: "1D3",
        range: "—",
        attacks: 1,
        ammo: "—",
        malfunction: "—"
      }
    ],
    background: {
      personalDescription: "耀眼、乐观且苍白的人。",
      ideologyBeliefs: "神秘依然在。(例如占星术，招魂术，塔罗)",
      significantPeople: "梦想家。(例如，惯常异想天开，预言家，创造者)",
      importantLocations: "重要地址",
      treasuredPossessions: "贵重物品"
    },
    history:[
      {
        time: "2023-01-01",
        event: "成为了调查员",
      },
      {
        time: "2023-05-01",
        event: "参与剧本《黑暗之夜》",
      },
      {
        time: "2023-07-01",
        event: "参与剧本《爱丽丝之梦》",
      }
    ],
    achievements: [
      { title: "资深调查员", description: "在跑团中成功存活超过5次。" },
      { title: "神秘的幸存者", description: "在一局游戏中唯一存活者。" },
      // Add more achievements as needed
    ],
  },
    {
      name: "李华",
      class: 'Archer',
      level: 4,
      profession: "医生",
      age: 45,
      gender: "male",
      currentResidence: "北京",
      birthplace: "上海",
      str: 60,
      con: 70,
      dex: 55,
      app: 65,
      pow: 75,
      siz: 80,
      int: 85,
      edu: 90,
      hp: 14,
      mp: 12,
      san: 70,
      luck: 60,
      moveRate: 7,
      skills: {
        creditRating: { initial: 9, current: 39 },
        accounting: { initial: 30, current: 30 },
        anthropology: { initial: 1, current: 1 },
        appraisal: { initial: 5, current: 25 },
        archaeology: { initial: 1, current: 16 },
        climb: { initial: 20, current: 35 },
        disguise: { initial: 24, current: 34 },
        dodge: { initial: 29, current: 39 },
        driveAuto: { initial: 20, current: 20 },
        electricalRepair: { initial: 10, current: 10 },
        firstAid: { initial: 30, current: 30 },
        history: { initial: 20, current: 20 },
        jump: { initial: 20, current: 20 },
        nativeLanguage: { initial: 74, current: 74 },
        law: { initial: 5, current: 5 },
        libraryUse: { initial: 20, current: 20 },
        listen: { initial: 20, current: 20 },
        locksmith: { initial: 1, current: 1 },
        mechanicalRepair: { initial: 10, current: 10 },
        medicine: { initial: 1, current: 1 },
        naturalWorld: { initial: 10, current: 10 },
        navigate: { initial: 10, current: 10 },
        occult: { initial: 5, current: 5 },
        operateHeavyMachinery: { initial: 1, current: 6 },
        psychoanalysis: { initial: 1, current: 36 },
        psychology: { initial: 70, current: 70 },
        ride: { initial: 5, current: 5 },
        sleightOfHand: { initial: 10, current: 10 },
        spotHidden: { initial: 25, current: 25 },
        stealth: { initial: 20, current: 20 },
        swim: { initial: 20, current: 20 },
        throw: { initial: 20, current: 20 },
        track: { initial: 10, current: 10 },
        charm: { initial: 55, current: 55 },
        intimidate: { initial: 15, current: 15 },
        fastTalk: { initial: 5, current: 5 },
        persuade: { initial: 40, current: 40 },
        artCraft1: { initial: 15, current: 15 },
        artCraft2: { initial: 5, current: 5 },
        artCraft3: { initial: 5, current: 5 },
        artCraft4: { initial: 5, current: 5 },
        artCraft5: { initial: 5, current: 5 },
        artCraft6: { initial: 5, current: 5 },
        artCraft7: { initial: 5, current: 5 },
        artCraft8: { initial: 5, current: 5 },
        artCraft9: { initial: 5, current: 5 },
        artCraft10: { initial: 5, current: 5 },
        artCraft11: { initial: 5, current: 5 },
        artCraft12: { initial: 5, current: 5 },
        artCraft13: { initial: 5, current: 5 },
        artCraft14: { initial: 5, current: 5 },
        artCraft15: { initial: 5, current: 5 },
        artCraft16: { initial: 5, current: 5 },
        artCraft17: { initial: 5, current: 5 },
        artCraft18: { initial: 5, current: 5 },
        artCraft19: { initial: 5, current: 5 },
        artCraft20: { initial: 5, current: 5 },
        science1: { initial: 1, current: 1 },
        science2: { initial: 1, current: 1 },
        science3: { initial: 1, current: 1 },
        science4: { initial: 10, current: 10 },
        science5: { initial: 1, current: 1 },
        science6: { initial: 1, current: 1 },
        science7: { initial: 1, current: 1 },
        science8: { initial: 1, current: 1 },
        science9: { initial: 1, current: 1 },
        science10: { initial: 1, current: 1 },
        science11: { initial: 1, current: 1 },
        science12: { initial: 1, current: 1 },
        science13: { initial: 1, current: 1 },
        science14: { initial: 1, current: 1 },
        cthulhuMythos: { initial: 0, current: 0 },
        survival: { initial: 10, current: 10 },
        fighting1: { initial: 45, current: 45 },
        fighting2: { initial: 5, current: 5 },
        fighting3: { initial: 10, current: 10 },
        fighting4: { initial: 15, current: 15 },
        fighting5: { initial: 20, current: 20 },
        fighting6: { initial: 15, current: 15 },
        fighting7: { initial: 10, current: 10 },
        fighting8: { initial: 20, current: 20 },
        firearms1: { initial: 25, current: 25 },
        firearms2: { initial: 15, current: 15 },
        firearms3: { initial: 15, current: 15 },
        firearms4: { initial: 10, current: 10 },
        firearms5: { initial: 10, current: 10 },
        firearms6: { initial: 20, current: 20 },
        firearms7: { initial: 10, current: 10 },
        language1: { initial: 1, current: 1 },
        language2: { initial: 1, current: 1 },
        language3: { initial: 1, current: 1 },
        language4: { initial: 1, current: 1 },
        language5: { initial: 1, current: 1 },
        language6: { initial: 1, current: 1 },
        language7: { initial: 1, current: 1 },
        language8: { initial: 1, current: 1 },
        language9: { initial: 1, current: 1 },
        language10: { initial: 1, current: 1 },
        language11: { initial: 1, current: 1 },
        language12: { initial: 1, current: 1 },
        demolitions: { initial: 1, current: 1 },
        hypnosis: { initial: 1, current: 1 },
        lipReading: { initial: 1, current: 1 },
        artillery: { initial: 1, current: 1 },
        diving: { initial: 1, current: 1 },
        animalHandling: { initial: 5, current: 5 },
        custom1: { initial: 1, current: 1 },
        custom2: { initial: 1, current: 1 },
        custom3: { initial: 1, current: 1 },
        custom4: { initial: 1, current: 1 },
        custom5: { initial: 1, current: 1 }
      },
      weapons: [
        {
          name: "手术刀",
          successRate: 50,
          penetration: "无",
          damage: "1D4",
          range: "—",
          attacks: 1,
          ammo: "—",
          malfunction: "—"
        }
      ],
      background: {
        personalDescription: "冷静、理智且有条理的人。",
        ideologyBeliefs: "科学至上。(例如，科学研究，医学)",
        significantPeople: "导师。(例如，教授，医生)",
        importantLocations: "实验室",
        treasuredPossessions: "医学书籍"
      },
      history:[
        {
          time: "2023-01-01",
          event: "成为了调查员",
        },
        {
          time: "2023-05-01",
          event: "参与剧本《黑暗之夜》",
        },
        {
          time: "2023-07-01",
          event: "参与剧本《爱丽丝之梦》",
        }
      ],
      achievements: [
        { title: "资深调查员", description: "在跑团中成功存活超过5次。" },
        { title: "神秘的幸存者", description: "在一局游戏中唯一存活者。" },
        // Add more achievements as needed
      ],
    },
    {
      name: "吴旭",
      profession: "记者",
      age: 28,
      gender: "female",
      currentResidence: "长沙",
      birthplace: "广州",
      str: 50,
      con: 55,
      dex: 70,
      app: 75,
      pow: 60,
      siz: 65,
      int: 75,
      edu: 80,
      hp: 11,
      mp: 10,
      san: 65,
      luck: 55,
      moveRate: 9,
      skills: {
        creditRating: { initial: 9, current: 39 },
        accounting: { initial: 30, current: 30 },
        anthropology: { initial: 1, current: 1 },
        appraisal: { initial: 5, current: 25 },
        archaeology: { initial: 1, current: 16 },
        climb: { initial: 20, current: 35 },
        disguise: { initial: 24, current: 34 },
        dodge: { initial: 29, current: 39 },
        driveAuto: { initial: 20, current: 20 },
        electricalRepair: { initial: 10, current: 10 },
        firstAid: { initial: 30, current: 30 },
        history: { initial: 20, current: 20 },
        jump: { initial: 20, current: 20 },
        nativeLanguage: { initial: 74, current: 74 },
        law: { initial: 5, current: 5 },
        libraryUse: { initial: 20, current: 20 },
        listen: { initial: 20, current: 20 },
        locksmith: { initial: 1, current: 1 },
        mechanicalRepair: { initial: 10, current: 10 },
        medicine: { initial: 1, current: 1 },
        naturalWorld: { initial: 10, current: 10 },
        navigate: { initial: 10, current: 10 },
        occult: { initial: 5, current: 5 },
        operateHeavyMachinery: { initial: 1, current: 6 },
        psychoanalysis: { initial: 1, current: 36 },
        psychology: { initial: 70, current: 70 },
        ride: { initial: 5, current: 5 },
        sleightOfHand: { initial: 10, current: 10 },
        spotHidden: { initial: 25, current: 25 },
        stealth: { initial: 20, current: 20 },
        swim: { initial: 20, current: 20 },
        throw: { initial: 20, current: 20 },
        track: { initial: 10, current: 10 },
        charm: { initial: 55, current: 55 },
        intimidate: { initial: 15, current: 15 },
        fastTalk: { initial: 5, current: 5 },
        persuade: { initial: 40, current: 40 },
        artCraft1: { initial: 15, current: 15 },
        artCraft2: { initial: 5, current: 5 },
        artCraft3: { initial: 5, current: 5 },
        artCraft4: { initial: 5, current: 5 },
        artCraft5: { initial: 5, current: 5 },
        artCraft6: { initial: 5, current: 5 },
        artCraft7: { initial: 5, current: 5 },
        artCraft8: { initial: 5, current: 5 },
        artCraft9: { initial: 5, current: 5 },
        artCraft10: { initial: 5, current: 5 },
        artCraft11: { initial: 5, current: 5 },
        artCraft12: { initial: 5, current: 5 },
        artCraft13: { initial: 5, current: 5 },
        artCraft14: { initial: 5, current: 5 },
        artCraft15: { initial: 5, current: 5 },
        artCraft16: { initial: 5, current: 5 },
        artCraft17: { initial: 5, current: 5 },
        artCraft18: { initial: 5, current: 5 },
        artCraft19: { initial: 5, current: 5 },
        artCraft20: { initial: 5, current: 5 },
        science1: { initial: 1, current: 1 },
        science2: { initial: 1, current: 1 },
        science3: { initial: 1, current: 1 },
        science4: { initial: 10, current: 10 },
        science5: { initial: 1, current: 1 },
        science6: { initial: 1, current: 1 },
        science7: { initial: 1, current: 1 },
        science8: { initial: 1, current: 1 },
        science9: { initial: 1, current: 1 },
        science10: { initial: 1, current: 1 },
        science11: { initial: 1, current: 1 },
        science12: { initial: 1, current: 1 },
        science13: { initial: 1, current: 1 },
        science14: { initial: 1, current: 1 },
        cthulhuMythos: { initial: 0, current: 0 },
        survival: { initial: 10, current: 10 },
        fighting1: { initial: 45, current: 45 },
        fighting2: { initial: 5, current: 5 },
        fighting3: { initial: 10, current: 10 },
        fighting4: { initial: 15, current: 15 },
        fighting5: { initial: 20, current: 20 },
        fighting6: { initial: 15, current: 15 },
        fighting7: { initial: 10, current: 10 },
        fighting8: { initial: 20, current: 20 },
        firearms1: { initial: 25, current: 25 },
        firearms2: { initial: 15, current: 15 },
        firearms3: { initial: 15, current: 15 },
        firearms4: { initial: 10, current: 10 },
        firearms5: { initial: 10, current: 10 },
        firearms6: { initial: 20, current: 20 },
        firearms7: { initial: 10, current: 10 },
        language1: { initial: 1, current: 1 },
        language2: { initial: 1, current: 1 },
        language3: { initial: 1, current: 1 },
        language4: { initial: 1, current: 1 },
        language5: { initial: 1, current: 1 },
        language6: { initial: 1, current: 1 },
        language7: { initial: 1, current: 1 },
        language8: { initial: 1, current: 1 },
        language9: { initial: 1, current: 1 },
        language10: { initial: 1, current: 1 },
        language11: { initial: 1, current: 1 },
        language12: { initial: 1, current: 1 },
        demolitions: { initial: 1, current: 1 },
        hypnosis: { initial: 1, current: 1 },
        lipReading: { initial: 1, current: 1 },
        artillery: { initial: 1, current: 1 },
        diving: { initial: 1, current: 1 },
        animalHandling: { initial: 5, current: 5 },
        custom1: { initial: 1, current: 1 },
        custom2: { initial: 1, current: 1 },
        custom3: { initial: 1, current: 1 },
        custom4: { initial: 1, current: 1 },
        custom5: { initial: 1, current: 1 }
      },
      weapons: [
        {
          name: "相机",
          successRate: 60,
          penetration: "无",
          damage: "1D2",
          range: "—",
          attacks: 1,
          ammo: "—",
          malfunction: "—"
        }
      ],
      background: {
        personalDescription: "机智、好奇且善于交际的人。",
        ideologyBeliefs: "真相至上。(例如，新闻报道，调查)",
        significantPeople: "编辑。(例如，报社编辑，新闻主管)",
        importantLocations: "新闻办公室",
        treasuredPossessions: "相机"
      },
      history:[
        {
          time: "2023-01-01",
          event: "成为了调查员",
        },
        {
          time: "2023-05-01",
          event: "参与剧本《黑暗之夜》",
        },
        {
          time: "2023-07-01",
          event: "参与剧本《爱丽丝之梦》",
        }
      ],
      achievements: [
        { title: "资深调查员", description: "在跑团中成功存活超过5次。" },
        { title: "神秘的幸存者", description: "在一局游戏中唯一存活者。" },
        // Add more achievements as needed
      ],
    }
  ];
  
  export default sampleCharacters;