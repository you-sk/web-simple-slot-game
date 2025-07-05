// ブラウザ環境でのテスト用
if (typeof require !== 'undefined') {
    // Node.js環境の場合
    var SlotGameCore = require('../js/game-core.js');
    var { expect } = require('chai');
}

describe('SlotGameCore', function() {
    let game;

    beforeEach(function() {
        game = new SlotGameCore();
    });

    describe('初期化', function() {
        it('デフォルト値で初期化される', function() {
            expect(game.credits).to.equal(1000);
            expect(game.bet).to.equal(10);
            expect(game.symbols).to.have.length(8);
            expect(game.spinning).to.deep.equal([false, false, false]);
        });

        it('カスタム設定で初期化される', function() {
            const customGame = new SlotGameCore({
                initialCredits: 500,
                bet: 20,
                symbols: ['A', 'B', 'C']
            });
            expect(customGame.credits).to.equal(500);
            expect(customGame.bet).to.equal(20);
            expect(customGame.symbols).to.deep.equal(['A', 'B', 'C']);
        });
    });

    describe('スピン機能', function() {
        it('十分なクレジットがある場合スピンできる', function() {
            expect(game.canSpin()).to.be.true;
        });

        it('クレジット不足の場合スピンできない', function() {
            game.credits = 5;
            expect(game.canSpin()).to.be.false;
        });

        it('スピン開始時にベット額が引かれる', function() {
            const initialCredits = game.credits;
            const result = game.startSpin();
            
            expect(result.success).to.be.true;
            expect(game.credits).to.equal(initialCredits - game.bet);
            expect(game.spinning).to.deep.equal([true, true, true]);
        });

        it('クレジット不足時はスピンが失敗する', function() {
            game.credits = 5;
            const result = game.startSpin();
            
            expect(result.success).to.be.false;
            expect(result.error).to.equal('Insufficient credits');
        });
    });

    describe('リール停止機能', function() {
        beforeEach(function() {
            game.startSpin();
        });

        it('回転中のリールを停止できる', function() {
            const result = game.stopReel(0, '🍒');
            
            expect(result.success).to.be.true;
            expect(result.symbol).to.equal('🍒');
            expect(game.spinning[0]).to.be.false;
            expect(game.stoppedReels).to.equal(1);
        });

        it('無効なリールインデックスはエラー', function() {
            expect(() => game.stopReel(-1)).to.throw('Invalid reel index');
            expect(() => game.stopReel(3)).to.throw('Invalid reel index');
        });

        it('停止済みのリールは再停止できない', function() {
            game.stopReel(0, '🍒');
            const result = game.stopReel(0, '🍋');
            
            expect(result.success).to.be.false;
            expect(result.error).to.equal('Reel is not spinning');
        });

        it('3つすべてのリールが停止したら判定される', function() {
            game.stopReel(0, '🍒');
            game.stopReel(1, '🍒');
            const result = game.stopReel(2, '🍒');
            
            expect(result.allStopped).to.be.true;
            expect(result.winResult).to.exist;
        });
    });

    describe('当選判定', function() {
        beforeEach(function() {
            game.startSpin();
        });

        it('3つ揃いで正しい配当が得られる', function() {
            game.currentSymbols = ['🍒', '🍒', '🍒'];
            const result = game.checkWin();
            
            expect(result.type).to.equal('three_match');
            expect(result.payout).to.equal(100);
            expect(result.winAmount).to.equal(game.bet * 100);
        });

        it('2つ揃いで正しい配当が得られる', function() {
            game.currentSymbols = ['🍒', '🍒', '🍋'];
            const result = game.checkWin();
            
            expect(result.type).to.equal('two_match');
            expect(result.payout).to.equal(5);
            expect(result.winAmount).to.equal(game.bet * 5);
        });

        it('ハズレの場合は配当なし', function() {
            game.currentSymbols = ['🍒', '🍋', '🍊'];
            const result = game.checkWin();
            
            expect(result.type).to.equal('no_win');
            expect(result.payout).to.equal(0);
            expect(result.winAmount).to.equal(0);
        });

        it('最高配当の2つ揃いが選ばれる', function() {
            game.currentSymbols = ['🍒', '💎', '💎'];  // 💎💎(10倍) > 🍒🍒(5倍)
            const result = game.checkWin();
            
            expect(result.type).to.equal('two_match');
            expect(result.payout).to.equal(10);
            expect(result.combination).to.equal('💎💎');
        });
    });

    describe('ゲーム状態管理', function() {
        it('ゲームオーバー判定', function() {
            game.credits = 0;
            expect(game.isGameOver()).to.be.true;
            
            game.credits = 100;
            expect(game.isGameOver()).to.be.false;
        });

        it('リセット機能', function() {
            game.credits = 500;
            game.spinning = [true, true, false];
            game.stoppedReels = 1;
            
            game.reset();
            
            expect(game.credits).to.equal(1000);
            expect(game.spinning).to.deep.equal([false, false, false]);
            expect(game.stoppedReels).to.equal(0);
        });

        it('ゲーム状態取得', function() {
            const state = game.getGameState();
            
            expect(state).to.have.property('credits');
            expect(state).to.have.property('bet');
            expect(state).to.have.property('spinning');
            expect(state).to.have.property('stoppedReels');
            expect(state).to.have.property('currentSymbols');
        });
    });

    describe('ランダム性のテスト', function() {
        it('getRandomSymbolは有効なシンボルを返す', function() {
            for (let i = 0; i < 100; i++) {
                const symbol = game.getRandomSymbol();
                expect(game.symbols).to.include(symbol);
            }
        });

        it('複数回実行で異なる結果が得られる（確率的テスト）', function() {
            const results = new Set();
            for (let i = 0; i < 50; i++) {
                results.add(game.getRandomSymbol());
            }
            // 50回実行して少なくとも2つ以上の異なる結果が得られることを期待
            expect(results.size).to.be.at.least(2);
        });
    });

    describe('エッジケース', function() {
        it('ベット額がクレジットと同じ場合', function() {
            game.credits = 10;
            game.bet = 10;
            
            expect(game.canSpin()).to.be.true;
            const result = game.startSpin();
            expect(result.success).to.be.true;
            expect(game.credits).to.equal(0);
        });

        it('大当たり時のクレジット計算', function() {
            game.credits = 100;
            game.bet = 10;
            game.startSpin();
            game.currentSymbols = ['⭐', '⭐', '⭐']; // 300倍
            
            const result = game.checkWin();
            expect(result.winAmount).to.equal(3000);
            expect(game.credits).to.equal(3090); // 100 - 10 + 3000
        });
    });
});