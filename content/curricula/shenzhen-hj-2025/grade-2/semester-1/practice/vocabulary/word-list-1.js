// Browser-safe mirror of word-list-1.md for learning and practice modes.
window.ENGLISH_VOCABULARY_1 = [
  ["unit-1", "feel", "感觉到"], ["unit-1", "see", "看见"], ["unit-1", "smell", "闻到"], ["unit-1", "hear", "听见"], ["unit-1", "taste", "品尝（味道）"],
  ["unit-2", "uncle", "舅父；叔父；伯父；姑父；姨父"], ["unit-2", "aunt", "姑母；姨母；伯母；婶婶；舅母"], ["unit-2", "cousin", "堂兄（或弟、姐、妹）；表兄（或弟、姐、妹）"], ["unit-2", "old", "年纪大的"], ["unit-2", "young", "年轻的"], ["unit-2", "cute", "可爱的"],
  ["unit-3", "doll", "玩具娃娃"], ["unit-3", "toy plane", "玩具飞机"], ["unit-3", "toy bear", "玩具熊"], ["unit-3", "ball", "球"], ["unit-3", "robot", "机器人"], ["unit-3", "jigsaw puzzle", "拼图游戏"],
  ["unit-4", "pet shop", "宠物店"], ["unit-4", "fruit shop", "水果店"], ["unit-4", "cinema", "电影院"], ["unit-4", "zoo", "动物园"], ["unit-4", "park", "公园"], ["unit-4", "toy shop", "玩具店"],
  ["unit-5", "cow", "奶牛"], ["unit-5", "sheep", "羊；绵羊"], ["unit-5", "duck", "鸭"], ["unit-5", "chick", "小鸡"], ["unit-5", "chicken", "鸡"], ["unit-5", "pig", "猪"],
  ["unit-6", "play with lanterns", "玩灯笼"], ["unit-6", "eat mooncakes", "吃月饼"], ["unit-6", "solve riddles", "猜谜语"], ["unit-6", "look at the moon", "赏月"]
].map(([unit, text, meaning]) => ({ id:`${unit}-vocab-${text.replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`, unit, text, meaning }));
