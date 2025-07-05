class SlotGameCore {
    constructor(config = {}) {
        this.symbols = config.symbols || ['🍒', '🍋', '🍊', '🍇', '🔔', '🎰', '💎', '⭐'];
        this.payouts = config.payouts || {
            '🍒🍒🍒': 100,
            '🍋🍋🍋': 50,
            '🍊🍊🍊': 30,
            '🍇🍇🍇': 20,
            '🔔🔔🔔': 10,
            '🎰🎰🎰': 5,
            '💎💎💎': 200,
            '⭐⭐⭐': 300
        };
        
        this.twoPairPayouts = config.twoPairPayouts || {
            '🍒🍒': 5,
            '🍋🍋': 3,
            '🍊🍊': 2,
            '🍇🍇': 2,
            '🔔🔔': 1,
            '🎰🎰': 1,
            '💎💎': 10,
            '⭐⭐': 15
        };

        this.credits = config.initialCredits || 1000;
        this.bet = config.bet || 10;
        this.spinning = [false, false, false];
        this.stoppedReels = 0;
        this.currentSymbols = ['🍒', '🍋', '🍊'];
    }

    canSpin() {
        return this.credits >= this.bet;
    }

    deductBet() {
        if (!this.canSpin()) {
            throw new Error('Insufficient credits');
        }
        this.credits -= this.bet;
        this.stoppedReels = 0;
        return this.credits;
    }

    getRandomSymbol() {
        return this.symbols[Math.floor(Math.random() * this.symbols.length)];
    }

    startSpin() {
        if (!this.canSpin()) {
            return { success: false, error: 'Insufficient credits' };
        }
        
        this.deductBet();
        this.spinning = [true, true, true];
        this.stoppedReels = 0;
        this.currentSymbols = ['', '', ''];
        
        return { success: true, credits: this.credits };
    }

    stopReel(reelIndex, symbol = null) {
        if (reelIndex < 0 || reelIndex > 2) {
            throw new Error('Invalid reel index');
        }
        
        if (!this.spinning[reelIndex]) {
            return { success: false, error: 'Reel is not spinning' };
        }

        this.spinning[reelIndex] = false;
        this.currentSymbols[reelIndex] = symbol || this.getRandomSymbol();
        this.stoppedReels++;

        const result = {
            success: true,
            symbol: this.currentSymbols[reelIndex],
            stoppedReels: this.stoppedReels,
            allStopped: this.stoppedReels === 3
        };

        if (result.allStopped) {
            const winResult = this.checkWin();
            result.winResult = winResult;
        }

        return result;
    }

    checkWin() {
        const combination = this.currentSymbols.join('');
        let payout = this.payouts[combination];
        let winType = null;
        let winAmount = 0;
        
        if (payout) {
            winAmount = this.bet * payout;
            this.credits += winAmount;
            winType = 'three_match';
            return {
                type: winType,
                combination,
                payout,
                winAmount,
                credits: this.credits
            };
        }

        // Check for two pairs
        const counts = {};
        this.currentSymbols.forEach(symbol => {
            counts[symbol] = (counts[symbol] || 0) + 1;
        });
        
        let maxPayout = 0;
        let winningSymbol = '';
        
        for (const [symbol, count] of Object.entries(counts)) {
            if (count >= 2 && this.twoPairPayouts[symbol + symbol]) {
                const twoPairPayout = this.twoPairPayouts[symbol + symbol];
                if (twoPairPayout > maxPayout) {
                    maxPayout = twoPairPayout;
                    winningSymbol = symbol;
                }
            }
        }
        
        if (maxPayout > 0) {
            winAmount = this.bet * maxPayout;
            this.credits += winAmount;
            winType = 'two_match';
            return {
                type: winType,
                combination: winningSymbol + winningSymbol,
                payout: maxPayout,
                winAmount,
                credits: this.credits
            };
        }

        return {
            type: 'no_win',
            combination,
            payout: 0,
            winAmount: 0,
            credits: this.credits
        };
    }

    isGameOver() {
        return this.credits <= 0;
    }

    reset() {
        this.credits = 1000;
        this.spinning = [false, false, false];
        this.stoppedReels = 0;
        this.currentSymbols = ['🍒', '🍋', '🍊'];
    }

    getGameState() {
        return {
            credits: this.credits,
            bet: this.bet,
            spinning: [...this.spinning],
            stoppedReels: this.stoppedReels,
            currentSymbols: [...this.currentSymbols]
        };
    }
}

// Node.js環境での export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlotGameCore;
}