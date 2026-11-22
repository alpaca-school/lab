# ハワイから550頭の豚｜QA_CHECKLIST

基準: 「アルパカすく〜るラボ ゲーム制作・公開標準 第1版」
基準コミット: `981d514211cd793eefc0364d1b35b0f6ae7c9ae8`

## 識別・公開設定
- [x] game_id: `hawaii-550pigs`
- [x] folder: `/hawaii-550pigs/`
- [x] 一覧カードの `data-game-id` と一致
- [x] Google Sheets `lab` タブへ登録
- [x] status: 公開中
- [x] visible: TRUE
- [x] sort_order: 25
- [x] 静的フォールバック順も sort_order に合わせた

## 共通UI
- [x] タイトル／プレイ中にラボ一覧へ戻る導線
- [x] 音声 ON / OFF
- [x] もう一度遊ぶ
- [x] 説明画面
- [x] 終了画面に「← 🔬 ラボ一覧にもどる」を追加
- [x] Safe Area を考慮した戻る導線

## スマホ・アクセシビリティ
- [x] viewport-fit=cover
- [x] maximum-scale / user-scalable=no を削除し、ピンチズームを妨げない
- [x] 375 / 390 / 430px級を想定した既存レスポンシブ実装をコード上確認
- [ ] 375×667 実表示確認
- [ ] 390×844 実表示確認
- [ ] 430×932 実表示確認
- [ ] iPhone実機で第1章〜結果画面まで通し確認

## 教材内容
- [x] 1948年・550頭・七勇士の説明あり
- [x] 物語上の創作部分を注記
- [x] 結果画面に「📚 出典・参考文献」を追加
- [x] 沖縄県公式ページ・説明資料を掲載
- [ ] 「約10万頭になるまでの年数」は公的資料間で表記差があるため、今後の内容校閲で再確認する

## 音
- [x] 既存の音声 ON / OFF と連動
- [x] 豚タップ時の既存 `Tt.oink()` に実音源を接続
- [x] SFXMint「Piglet Double Pig Oink 08」CC0 1.0 を使用
- [x] 外部音源再生失敗時は従来のWeb Audio擬似音へフォールバック
- [ ] iPhone実機で初回タップ・ミュート・再開を確認

## 公開
- [x] `alpaca-school/lab` main へ反映
- [x] 公開URL: `https://lab.alpaca-school.okinawa/hawaii-550pigs/`
- [ ] GitHub Pages 最新workflow successを最終確認
- [ ] 公開URLで実ブラウザQA

## 注意
公開用HTMLはGoogle Driveから渡されたバンドル済み単一HTMLが正本として開始されたため、今回の標準反映は公開HTMLへの最小修正で実施した。今後継続改修する場合は、可能なら開発ソース側を正本化して再buildする。
