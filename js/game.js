class SlotGame extends SlotGameCore {
    constructor() {
        super();
        this.spinIntervals = [null, null, null];
        this.initializeGame();
    }

    initializeGame() {
        this.updateDisplay();
        this.addEventListeners();
    }

    addEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                if (!document.getElementById('spinBtn').disabled) {
                    this.startSpin();
                }
            } else if (event.code === 'Digit1') {
                this.stopReel(0);
            } else if (event.code === 'Digit2') {
                this.stopReel(1);
            } else if (event.code === 'Digit3') {
                this.stopReel(2);
            }
        });
    }

    updateDisplay() {
        document.getElementById('credits').textContent = this.credits;
        document.getElementById('bet').textContent = this.bet;
    }

    startSpin() {
        const result = super.startSpin();
        if (!result.success) {
            alert('クレジットが不足しています！');
            return;
        }

        this.updateDisplay();
        
        document.getElementById('spinBtn').disabled = true;
        document.getElementById('stopBtn1').disabled = false;
        document.getElementById('stopBtn2').disabled = false;
        document.getElementById('stopBtn3').disabled = false;
        document.getElementById('result').textContent = '';
        document.getElementById('win').textContent = '0';

        for (let i = 0; i < 3; i++) {
            const reel = document.getElementById(`reel${i + 1}`);
            reel.classList.add('spinning');
            
            this.spinIntervals[i] = setInterval(() => {
                const randomSymbol = this.getRandomSymbol();
                reel.textContent = randomSymbol;
            }, 100);
        }
    }

    stopReel(reelIndex) {
        const result = super.stopReel(reelIndex);
        if (!result.success) return;

        clearInterval(this.spinIntervals[reelIndex]);
        
        const reel = document.getElementById(`reel${reelIndex + 1}`);
        reel.classList.remove('spinning');
        reel.textContent = result.symbol;
        
        document.getElementById(`stopBtn${reelIndex + 1}`).disabled = true;

        if (result.allStopped) {
            this.displayWinResult(result.winResult);
            document.getElementById('spinBtn').disabled = false;
        }
    }

    displayWinResult(winResult) {
        let resultText = '';
        
        if (winResult.type === 'three_match') {
            document.getElementById('win').textContent = winResult.winAmount;
            resultText = `🎉 3つ揃い ${winResult.payout}倍当選！ ${winResult.winAmount}獲得！ 🎉`;
            document.getElementById('result').style.color = '#f39c12';
        } else if (winResult.type === 'two_match') {
            document.getElementById('win').textContent = winResult.winAmount;
            const symbol = winResult.combination.substring(0, 1);
            resultText = `✨ ${symbol}${symbol} 2つ揃い ${winResult.payout}倍当選！ ${winResult.winAmount}獲得！ ✨`;
            document.getElementById('result').style.color = '#2ecc71';
        } else {
            resultText = 'ハズレ...';
            document.getElementById('result').style.color = '#e74c3c';
        }
        
        document.getElementById('result').textContent = resultText;
        this.updateDisplay();

        if (this.isGameOver()) {
            setTimeout(() => {
                alert('ゲームオーバー！クレジットがなくなりました。');
                this.reset();
                this.updateDisplay();
            }, 1000);
        }
    }
}

// ゲーム開始のための関数
function startSpin() {
    game.startSpin();
}

function stopReel(reelIndex) {
    game.stopReel(reelIndex);
}

// ゲーム初期化
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SlotGame();
});