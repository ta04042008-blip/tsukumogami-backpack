(() => {
  "use strict";

  const ITEM_DEFS = {
    sword: {
      name: "古刀", w: 1, h: 2, price: 4, category: "weapon", rotatable: true,
      description: "2.5秒ごとに12ダメージ。",
      action: { kind: "damage", amount: 12, interval: 2500 }
    },
    hammer: {
      name: "槌", w: 1, h: 2, price: 4, category: "weapon", rotatable: true,
      description: "4秒ごとに20ダメージ。重いが強力。",
      action: { kind: "damage", amount: 20, interval: 4000 }
    },
    mirror: {
      name: "鏡", w: 1, h: 1, price: 5, category: "support",
      description: "隣接する補助道具の配置効果を20%強める。",
      mirrorAmp: 0.2
    },
    lantern: {
      name: "提灯", w: 1, h: 1, price: 3, category: "support", directional: true,
      description: "正面1マスの武器ダメージ+25%。",
      directionalPowerBuff: 0.25
    },
    umbrella: {
      name: "唐傘", w: 1, h: 2, price: 4, category: "defense", rotatable: true,
      description: "4秒ごとに結界10。",
      action: { kind: "shield", amount: 10, interval: 4000 }
    },
    fan: {
      name: "扇子", w: 2, h: 1, price: 5, category: "support", rotatable: true,
      description: "隣接道具の発動間隔-10%。",
      adjacentSpeedBuff: 0.1
    },
    charm: {
      name: "お守り", w: 1, h: 1, price: 3, category: "support",
      description: "隣接道具の効果量+15%。",
      adjacentPowerBuff: 0.15
    },
    medicine: {
      name: "薬壺", w: 1, h: 1, price: 4, category: "heal",
      description: "5秒ごとにHPを8回復。",
      action: { kind: "heal", amount: 8, interval: 5000 }
    },
    oil: {
      name: "油壺", w: 1, h: 1, price: 3, category: "support",
      description: "隣接武器に炎の追加ダメージ+4。",
      adjacentWeaponBonus: 4
    },
    flint: {
      name: "火打石", w: 1, h: 1, price: 3, category: "fire",
      description: "隣接する火系道具の効果量+25%。",
      fireBoost: 0.25
    },
    furoshiki: {
      name: "風呂敷", w: 2, h: 2, price: 6, category: "support",
      description: "隣接した1×1道具を最大5個収納。中身1個につき周囲の効果量+4%。",
      containerCapacity: 5,
      containerPowerPerItem: 0.04
    },
  
    cracked_mirror: {
      name: "割れた鏡", w: 1, h: 1, price: 4, category: "defense",
      description: "被弾するたび敵へ3ダメージを返す。",
      retaliation: 3
    },
    fire_pot: {
      name: "火炎壺", w: 1, h: 1, price: 5, category: "fire", fire: true,
      description: "4秒ごとに8の炎ダメージ。",
      action: { kind: "damage", amount: 8, interval: 4000 }
    },
    burning_blade: {
      name: "焼刃", w: 1, h: 2, price: 6, category: "weapon", rotatable: true, fire: true,
      description: "炎を帯びた刀。2.7秒ごとに14ダメージ。",
      action: { kind: "damage", amount: 14, interval: 2700 }
    },
    exorcist_blade: {
      name: "破邪刀", w: 1, h: 2, price: 6, category: "weapon", rotatable: true,
      description: "妖怪に強い刀。2.5秒ごとに16ダメージ。",
      action: { kind: "damage", amount: 16, interval: 2500 }
    },
    warding_mirror: {
      name: "魔除け鏡", w: 1, h: 1, price: 6, category: "defense",
      description: "5秒ごとに結界6。",
      action: { kind: "shield", amount: 6, interval: 5000 }
    },
    lit_lantern: {
      name: "灯った提灯", w: 1, h: 1, price: 5, category: "support", directional: true,
      description: "正面1マスの武器ダメージ+40%。",
      directionalPowerBuff: 0.4
    },
    oil_lantern: {
      name: "油提灯", w: 1, h: 1, price: 5, category: "support",
      description: "隣接武器の効果量+35%。",
      adjacentWeaponPowerBuff: 0.35
    },
    oiled_umbrella: {
      name: "油紙傘", w: 1, h: 2, price: 6, category: "defense", rotatable: true,
      description: "4秒ごとに結界16。",
      action: { kind: "shield", amount: 16, interval: 4000 }
    },
    scorched_umbrella: {
      name: "焦げ傘", w: 1, h: 2, price: 5, category: "fire", rotatable: true, fire: true,
      description: "結界6。被弾時に炎で5ダメージを返す。",
      action: { kind: "shield", amount: 6, interval: 4000 },
      retaliation: 5
    },
    fire_fan: {
      name: "火扇", w: 2, h: 1, price: 6, category: "fire", rotatable: true, fire: true,
      description: "3秒ごとに7の炎ダメージ。隣接CT-8%。",
      action: { kind: "damage", amount: 7, interval: 3000 },
      adjacentSpeedBuff: 0.08
    },
    lantern_fan: {
      name: "灯風の扇", w: 2, h: 1, price: 6, category: "support", rotatable: true,
      description: "隣接道具の発動間隔-18%。",
      adjacentSpeedBuff: 0.18
    },
    decoction: {
      name: "煎じ薬", w: 1, h: 1, price: 5, category: "heal",
      description: "6秒ごとにHPを15回復。",
      action: { kind: "heal", amount: 15, interval: 6000 }
    },
    murky_medicine: {
      name: "濁り薬", w: 1, h: 1, price: 4, category: "heal",
      description: "5秒ごとにHP12回復するが、2ダメージを受ける。",
      action: { kind: "heal", amount: 12, interval: 5000, selfDamage: 2 }
    },
    machete: {
      name: "鉈", w: 1, h: 2, price: 6, category: "weapon", rotatable: true,
      description: "4.5秒ごとに28ダメージ。",
      action: { kind: "damage", amount: 28, interval: 4500 }
    },
    broken_umbrella: {
      name: "壊れ傘", w: 1, h: 2, price: 4, category: "weapon", rotatable: true,
      description: "3秒ごとに10ダメージ。被弾時2ダメージ反射。",
      action: { kind: "damage", amount: 10, interval: 3000 },
      retaliation: 2
    },
    curse_return_mirror: {
      name: "厄返しの鏡", w: 1, h: 1, price: 7, category: "defense",
      description: "被弾するたび5ダメージを返す。",
      retaliation: 5
    },
    crimson_mirror: {
      name: "紅蓮鏡", w: 1, h: 1, price: 7, category: "fire", fire: true,
      description: "被弾するたび7の炎ダメージを返す。",
      retaliation: 7
    },
    secret_medicine: {
      name: "秘薬", w: 1, h: 1, price: 7, category: "heal",
      description: "6.5秒ごとにHPを25回復。",
      action: { kind: "heal", amount: 25, interval: 6500 }
    },
    warding_umbrella: {
      name: "厄除け傘", w: 1, h: 2, price: 7, category: "defense", rotatable: true,
      description: "4秒ごとに結界15。被弾時2ダメージ反射。",
      action: { kind: "shield", amount: 15, interval: 4000 },
      retaliation: 2
    },
    trick_umbrella: {
      name: "仕込み傘", w: 1, h: 2, price: 7, category: "weapon", rotatable: true,
      description: "3秒ごとに10ダメージと結界6。",
      action: { kind: "hybrid", amount: 10, shield: 6, interval: 3000 }
    },
    flame_blade: {
      name: "炎刀", w: 1, h: 2, price: 8, category: "fire", rotatable: true, fire: true,
      description: "2.6秒ごとに20の炎ダメージ。",
      action: { kind: "damage", amount: 20, interval: 2600 }
    },
    exorcist_sword: {
      name: "退魔刀", w: 1, h: 2, price: 8, category: "weapon", rotatable: true,
      description: "2.8秒ごとに22ダメージ。",
      action: { kind: "damage", amount: 22, interval: 2800 }
    },
    inferno_fan: {
      name: "業火扇", w: 2, h: 1, price: 8, category: "fire", rotatable: true, fire: true,
      description: "3秒ごとに14の炎ダメージ。隣接CT-5%。",
      action: { kind: "damage", amount: 14, interval: 3000 },
      adjacentSpeedBuff: 0.05
    },
    wind_umbrella: {
      name: "風受け傘", w: 1, h: 2, price: 8, category: "defense", rotatable: true,
      description: "3.5秒ごとに結界12。隣接CT-5%。",
      action: { kind: "shield", amount: 12, interval: 3500 },
      adjacentSpeedBuff: 0.05
    },
    reflecting_lantern: {
      name: "映し灯籠", w: 1, h: 1, price: 8, category: "support",
      description: "隣接する全道具の効果量+20%。",
      adjacentPowerBuff: 0.2
    },
  
    kaeshi_mirror: {
      name: "付喪神・返し鏡", w: 1, h: 1, price: 10, category: "defense", tsukumogami: true,
      description: "受けた災いを返す付喪神。被弾時9ダメージ反射。",
      retaliation: 9
    },
    fire_eater_blade: {
      name: "付喪神・火喰い刀", w: 1, h: 2, price: 11, category: "fire", rotatable: true, fire: true, tsukumogami: true,
      description: "火を喰らう妖刀。2.4秒ごとに26の炎ダメージ。",
      action: { kind: "damage", amount: 26, interval: 2400 }
    },
    bake_umbrella: {
      name: "付喪神・化け傘", w: 1, h: 2, price: 10, category: "defense", rotatable: true, tsukumogami: true,
      description: "身を守りつつ牙をむく。3.5秒ごとに結界20、被弾時3反射。",
      action: { kind: "shield", amount: 20, interval: 3500 },
      retaliation: 3
    },
    fire_wind_fan: {
      name: "付喪神・火風の扇", w: 2, h: 1, price: 11, category: "fire", rotatable: true, fire: true, tsukumogami: true,
      description: "火風を起こす付喪神。2.6秒ごとに18ダメージ、隣接CT-8%。",
      action: { kind: "damage", amount: 18, interval: 2600 },
      adjacentSpeedBuff: 0.08
    },
    ghost_lantern: {
      name: "付喪神・幽灯籠", w: 1, h: 1, price: 11, category: "support", tsukumogami: true,
      description: "妖しい光で周囲を強化。隣接道具の効果量+30%。",
      adjacentPowerBuff: 0.3
    },
    medicine_eater_pot: {
      name: "付喪神・薬喰い壺", w: 1, h: 1, price: 10, category: "heal", tsukumogami: true,
      description: "薬気を蓄えた付喪神。5.5秒ごとにHP30回復。",
      action: { kind: "heal", amount: 30, interval: 5500 }
    }
  };
  
  const SHOP_ENTRIES = [
    { id: "sword", weight: 14, rarity: "common" },
    { id: "hammer", weight: 12, rarity: "common" },
    { id: "lantern", weight: 14, rarity: "common" },
    { id: "charm", weight: 13, rarity: "common" },
    { id: "medicine", weight: 11, rarity: "common" },
    { id: "oil", weight: 10, rarity: "common" },
    { id: "flint", weight: 10, rarity: "common" },
    { id: "umbrella", weight: 9, rarity: "uncommon" },
    { id: "fan", weight: 6, rarity: "uncommon" },
    { id: "mirror", weight: 4, rarity: "rare" },
    { id: "furoshiki", weight: 3, rarity: "rare" }
  ];
  
  const RARITY_META = {
    common: { label: "並", className: "rarity-common" },
    uncommon: { label: "珍", className: "rarity-uncommon" },
    rare: { label: "希", className: "rarity-rare" }
  };
  
  const RECIPES = [
    { a: "hammer", b: "mirror", result: "cracked_mirror" },
    { a: "flint", b: "oil", result: "fire_pot" },
    { a: "sword", b: "flint", result: "burning_blade" },
    { a: "sword", b: "charm", result: "exorcist_blade" },
    { a: "mirror", b: "charm", result: "warding_mirror" },
    { a: "lantern", b: "flint", result: "lit_lantern" },
    { a: "lantern", b: "oil", result: "oil_lantern" },
    { a: "umbrella", b: "oil", result: "oiled_umbrella" },
    { a: "umbrella", b: "flint", result: "scorched_umbrella" },
    { a: "fan", b: "flint", result: "fire_fan" },
    { a: "fan", b: "lantern", result: "lantern_fan" },
    { a: "medicine", b: "flint", result: "decoction" },
    { a: "medicine", b: "oil", result: "murky_medicine" },
    { a: "hammer", b: "sword", result: "machete" },
    { a: "hammer", b: "umbrella", result: "broken_umbrella" },
  
    { a: "cracked_mirror", b: "charm", result: "curse_return_mirror" },
    { a: "cracked_mirror", b: "flint", result: "crimson_mirror" },
    { a: "murky_medicine", b: "charm", result: "secret_medicine" },
    { a: "scorched_umbrella", b: "charm", result: "warding_umbrella" },
    { a: "broken_umbrella", b: "oil", result: "trick_umbrella" },
    { a: "burning_blade", b: "oil", result: "flame_blade" },
    { a: "exorcist_blade", b: "mirror", result: "exorcist_sword" },
    { a: "fire_fan", b: "oil", result: "inferno_fan" },
    { a: "oiled_umbrella", b: "fan", result: "wind_umbrella" },
    { a: "lit_lantern", b: "mirror", result: "reflecting_lantern" }
  ];
  
  const AWAKEN_BATTLES = 3;
  const AWAKENINGS = {
    curse_return_mirror: "kaeshi_mirror",
    flame_blade: "fire_eater_blade",
    warding_umbrella: "bake_umbrella",
    inferno_fan: "fire_wind_fan",
    reflecting_lantern: "ghost_lantern",
    secret_medicine: "medicine_eater_pot"
  };
  
  const ENEMIES = [
    { name: "小鬼", hp: 65, attack: 6, interval: 2400, reward: 6 },
    { name: "一つ目小僧", hp: 90, attack: 7, interval: 2100, reward: 7 },
    { name: "骸骨武者", hp: 125, attack: 10, interval: 2500, reward: 8, reduction: 0.1 },
    { name: "火車", hp: 145, attack: 6, interval: 1500, reward: 9 },
    { name: "赤鬼", hp: 280, attack: 12, interval: 2400, reward: 0, heavy: { interval: 8000, damage: 20 } }
  ];
  
  const DIRS = [
    { dx: 0, dy: -1, arrow: "↑" },
    { dx: 1, dy: 0, arrow: "→" },
    { dx: 0, dy: 1, arrow: "↓" },
    { dx: -1, dy: 0, arrow: "←" }
  ];

  window.TSUKUMOGAMI_DATA = Object.freeze({
    ITEM_DEFS,
    SHOP_ENTRIES,
    RARITY_META,
    RECIPES,
    AWAKEN_BATTLES,
    AWAKENINGS,
    ENEMIES,
    DIRS
  });
})();
