# WalletGamblingUI.gd
# UI logic for P2P bets, send animations, and balance tracking.

extends Control

@onready var balance_label = $Panel/BalanceLabel
@onready var amount_input = $Panel/AmountInput
@onready var address_input = $Panel/AddressInput
@onready var animation_player = $AnimationPlayer

func _ready():
	WalletManager.balance_updated.connect(_on_balance_updated)
	_on_balance_updated(WalletManager.balance)

func _on_balance_updated(new_balance):
	balance_label.text = "CIVIC BALANCE: " + str(new_balance) + " TKN"

func _on_bet_pressed():
	var amount = float(amount_input.text)
	var target = address_input.text
	if WalletManager.initiate_p2p_bet(target, amount, "MATCH_001"):
		play_send_animation()

func play_send_animation():
	animation_player.play("send_tokens")
	# Visual feedback: Glowing particles moving from player to center
