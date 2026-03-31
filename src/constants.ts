import { Problem } from './types';

export const generateProblem = (level: number): Problem => {
  const isAdd = Math.random() > 0.5;
  let a, b, answer;

  if (isAdd) {
    // Addition: answer <= 19
    answer = Math.floor(Math.random() * 18) + 2; // 2 to 19
    a = Math.floor(Math.random() * (answer - 1)) + 1; // 1 to answer-1
    b = answer - a;
  } else {
    // Subtraction: a <= 19, answer >= 0
    a = Math.floor(Math.random() * 19) + 1; // 1 to 19
    b = Math.floor(Math.random() * (a + 1)); // 0 to a
    answer = a - b;
  }

  // Generate options
  const options = new Set<number>();
  options.add(answer);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 8) - 4; // Slightly wider range for 4 options
    const opt = answer + offset;
    if (opt >= 0 && opt <= 25 && opt !== answer) {
      options.add(opt);
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    question: `${a} ${isAdd ? '+' : '-'} ${b}`,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5),
    type: isAdd ? 'add' : 'sub',
  };
};

export const POKEMON_CHARACTERS = [
  { id: '25', name: 'ピカチュウ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
  { id: '133', name: 'イーブイ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
  { id: '6', name: 'リザードン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
  { id: '448', name: 'ルカリオ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
  { id: '94', name: 'ゲンガー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
  { id: '658', name: 'ゲッコウガ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png' },
  { id: '150', name: 'ミュウツー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png' },
  { id: '815', name: 'エースバーン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/815.png' },
  { id: '778', name: 'ミミッキュ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png' },
  { id: '1', name: 'フシギダネ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
  { id: '4', name: 'ヒトカゲ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png' },
  { id: '7', name: 'ゼニガメ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' },
  { id: '39', name: 'プリン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png' },
  { id: '52', name: 'ニャース', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png' },
  { id: '143', name: 'カビゴン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png' },
  { id: '149', name: 'カイリュー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png' },
  { id: '151', name: 'ミュウ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png' },
  { id: '249', name: 'ルギア', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png' },
  { id: '250', name: 'ホウオウ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png' },
  { id: '257', name: 'バシャーモ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/257.png' },
  { id: '282', name: 'サーナイト', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/282.png' },
  { id: '384', name: 'レックウザ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png' },
  { id: '392', name: 'ゴウカザル', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/392.png' },
  { id: '445', name: 'ガブリアス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png' },
  { id: '470', name: 'リーフィア', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png' },
  { id: '471', name: 'グレイシア', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/471.png' },
  { id: '493', name: 'アルセウス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/493.png' },
  { id: '571', name: 'ゾロアーク', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/571.png' },
  { id: '635', name: 'サザンドラ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/635.png' },
  { id: '700', name: 'ニンフィア', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png' },
  { id: '722', name: 'モクロー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png' },
  { id: '745', name: 'ルガルガン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/745-midday.png' },
  { id: '800', name: 'ネクロズマ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/800.png' },
  { id: '888', name: 'ザシアン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/888.png' },
  { id: '889', name: 'ザマゼンタ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/889.png' },
  { id: '898', name: 'バドレックス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/898.png' },
  { id: '906', name: 'ニャオハ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/906.png' },
  { id: '909', name: 'ホゲータ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/909.png' },
  { id: '912', name: 'クワッス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/912.png' },
  { id: '1007', name: 'コライドン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1007.png' },
  { id: '1008', name: 'ミライドン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1008.png' },
  { id: '134', name: 'シャワーズ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png' },
  { id: '135', name: 'サンダース', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png' },
  { id: '136', name: 'ブースター', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png' },
  { id: '196', name: 'エーフィ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png' },
  { id: '197', name: 'ブラッキー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png' },
  { id: '251', name: 'セレビィ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/251.png' },
  { id: '254', name: 'ジュカイン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/254.png' },
  { id: '260', name: 'ラグラージ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/260.png' },
  { id: '385', name: 'ジラーチ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/385.png' },
  { id: '395', name: 'エンペルト', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/395.png' },
  { id: '405', name: 'レントラー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/405.png' },
  { id: '447', name: 'リオル', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/447.png' },
  { id: '475', name: 'エルレイド', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/475.png' },
  { id: '491', name: 'ダークライ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/491.png' },
  { id: '494', name: 'ビクティニ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/494.png' },
  { id: '637', name: 'ウルガモス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/637.png' },
  { id: '681', name: 'ギルガルド', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/681.png' },
  { id: '724', name: 'ジュナイパー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/724.png' },
  { id: '727', name: 'ガオガエン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/727.png' },
  { id: '744', name: 'イワンコ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/744.png' },
  { id: '773', name: 'シルヴァディ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png' },
  { id: '807', name: 'ゼラオラ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/807.png' },
  { id: '812', name: 'ゴリランダー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/812.png' },
  { id: '818', name: 'インテレオン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/818.png' },
  { id: '823', name: 'アーマーガア', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/823.png' },
  { id: '849', name: 'ストリンダー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/849.png' },
  { id: '887', name: 'ドラパルト', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/887.png' },
  { id: '914', name: 'ウェーニバル', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/914.png' },
  { id: '959', name: 'デカヌチャン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/959.png' },
  { id: '975', name: 'グレンアルマ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/975.png' },
  { id: '977', name: 'ソウブレイズ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/977.png' },
  { id: '980', name: 'ドオー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/980.png' },
  { id: '1000', name: 'サーフゴー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1000.png' },
  { id: '1005', name: 'トドロクツキ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1005.png' },
  { id: '1006', name: 'テツノブジン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1006.png' },
  { id: '1024', name: 'テラパゴス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1024.png' },
  { id: '1025', name: 'モモワロウ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1025.png' },
  { id: '175', name: 'トゲピー', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/175.png' },
  { id: '183', name: 'マリル', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/183.png' },
  { id: '212', name: 'ハッサム', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/212.png' },
  { id: '248', name: 'バンギラス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png' },
  { id: '376', name: 'メタグロス', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png' },
  { id: '609', name: 'シャンデラ', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/609.png' },
  { id: '706', name: 'ヌメルゴン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/706.png' },
  { id: '715', name: 'オンバーン', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/715.png' },
];

export const RACE_DISTANCE = 5000;
export const BASE_SPEED = 0.5;
export const MAX_BOOST = 100;
