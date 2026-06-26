# Engineering Decisions

## ED-0001 — No Market Prediction
Headquarters never predicts market direction. It evaluates operator behavior, doctrine compliance, risk state, and decision quality.

## ED-0002 — Battlefield Independence
Headquarters does not replace TradingView, NinjaTrader, TopstepX, Quantower, Tradovate, Rithmic, IBKR, or any broker. It functions as Mission Control beside the battlefield.

## ED-0003 — Local First
The first implementation should be local-first with SQLite. The Operator owns the Archives.

## ED-0004 — Silence Is A Feature
If no intervention is valuable, Headquarters remains silent. Commander messages are rare by design.

## ED-0005 — Behavior Before Outcome
A profitable rule violation is still a compromised mission. A losing trade with excellent execution can be a successful mission.

## ED-0006 — Repository Before Code
No feature is implemented before it exists in the Headquarters Design Repository and Master Index.
